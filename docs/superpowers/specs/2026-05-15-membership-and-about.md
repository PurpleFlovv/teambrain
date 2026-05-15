# TeamBrain 用户团队归属 & 关于页面

**日期**: 2026-05-15 | **基于**: 2026-05-15-teambrain-system-design.md

---

## 一、概述

新增用户-团队归属关系（UserTeam 关联表），实现多用户可加入同一团队。ADMIN 和 TEAM_ADMIN 两者均可使用管理后台，但权限范围不同。导航栏新增"关于"页面展示系统概述。我的团队页面仅显示已加入团队，子页面为只读展示。**新用户注册后不自动创建团队**，需通过团队广场加入。

---

## 二、注册流程变更

### 2.1 取消自动创建团队

- `AuthService.register()` 移除 `teamRepository.save(...)` 和 `brainRegionService.copyTemplatesForTeam(...)`
- `AdminService.createUser()` 移除自动创建团队
- `DataInitializer` 保持不变（admin 仍需影视飓风团队作为演示数据）
- `MockDataSeeder` 保持不变（模拟用户需要团队）

### 2.2 注册后流程

新用户注册 → 登录 → `teamIds = []` → 首页显示默认影视飓风（teamId=1）→ 引导用户去团队广场加入团队。

---

## 三、多团队归属处理

### 2.1 JWT & AuthContext

`LoginResponse` 改 `teamId` 为 `teamIds: []`：

```java
// LoginResponse.java
private List<Long> teamIds;  // 所有已加入团队的 ID

// AuthService.login()
List<Long> teamIds = userTeamRepository.findByUserId(user.getId())
    .stream().map(ut -> ut.getTeamId()).toList();
```

前端 `AuthContext.user` 同步改为：
```js
{ id, username, teamIds: [], roles: [] }
```

### 2.2 首页默认团队逻辑

`Index.jsx` 选择逻辑：
1. 若用户有所有者团队（`team.user_id == userId`）→ 默认第一个所有者团队
2. 否则 → 默认第一个加入的团队（`teamIds[0]`）
3. 若 `teamIds` 为空 → 使用影视飓风（teamId=1）

```js
const ownedTeamId = teamIds.find(tid => allTeams.find(t => t.id === tid && t.ownerId === user.id));
const defaultTeamId = ownedTeamId || teamIds[0] || 1;
```

### 2.3 权限判定

权限在每个请求中动态判定，不存于 token：

```java
// TeamService.java
public boolean isOwner(Long teamId, Long userId) {
    return teamRepository.findById(teamId)
        .map(t -> t.getUser().getId().equals(userId))
        .orElse(false);
}

public boolean canEdit(Long teamId, Long userId, boolean isAdmin) {
    if (isAdmin) return true;
    return isOwner(teamId, userId);
}
```

- TEAM_ADMIN = 鉴权时实时检查 `team.user_id == currentUserId || isAdmin`
- USER = `teamIds` 中包含该团队即可查看，但不能修改

---

## 三、权限模型

| 角色 | 团队可见范围 | 编辑节点/脑区 | 管理成员 | 管理全局 |
|------|:----------:|:----------:|:-------:|:------:|
| **ADMIN** | 全部 | ✅ | ✅ | ✅ |
| **TEAM_ADMIN** | 本人拥有的 | ✅ | ✅ | — |
| **USER** | 已加入的 | — | — | — |

- ADMIN 不加入任何团队，可查看所有团队
- TEAM_ADMIN = 团队所有者（team.user_id == currentUser.id）
- USER 只能查看已加入团队的数据，无编辑权限

---

## 三、数据模型变更

### 3.1 新增 `user_team` 表

| 列 | 类型 | 说明 |
|----|------|------|
| user_id | BIGINT FK → sys_user | 成员 |
| team_id | BIGINT FK → team | 团队 |
| joined_at | TIMESTAMP NOT NULL DEFAULT NOW() | 加入时间 |

主键：(user_id, team_id)

### 3.2 新增 UserTeam 实体

```java
@Entity
@Table(name = "user_team")
@IdClass(UserTeamId.class)  // 复合主键
public class UserTeam {
    @Id private Long userId;
    @Id private Long teamId;
    private LocalDateTime joinedAt = LocalDateTime.now();
}
```

### 3.3 依赖关系（无循环引用）

```
UserTeamRepository
  ├── finds teams by userId   → GET /api/user/teams
  ├── finds users by teamId   → GET /api/teams/{id}/members
  ├── inserts                 → POST /api/teams/{id}/join
  └── deletes                 → DELETE /api/teams/{id}/leave
                                 DELETE /api/teams/{id}/members/{userId}

TeamService (修改)
  ├── 注入 UserTeamRepository
  ├── getMyTeams(userId)       → user_team join 查询
  └── isOwner(teamId, userId)  → 复用现有 team.user_id 比对

MyTeams 页面 (修改)
  └── 调用 GET /api/user/teams (仅返回已加入的团队)

MyTeamDetail 页面 (修改)
  └── 调用 GET /api/teams/{id}/members (显示成员列表)
```

User/Team 实体**不**添加 JPA @OneToMany/@ManyToMany 映射到 UserTeam，避免双向依赖。所有查询通过 UserTeamRepository。

### 3.4 种子数据调整

MockDataSeeder 中 ADMId2N 用户的 `user_team` 对应关系：
- user10 作为 星辰科技 的 owner（team.user_id = user10.id）→ 自动有 TEAM_ADMIN 权限
- user11-17 各为其所属团队的 owner → TEAM_ADMIN
- 额外：user11 加入 星辰科技（INSERT user_team），user12 加入 星辰科技。其余团队的成员类似。

---

## 四、路由

| 路径 | 页面 | 权限 |
|------|------|------|
| `/#/login` | 登录/注册 | 公开 |
| `/#/` | 大脑首页（3D 可视化 + 团队切换） | 需登录 |
| `/#/my-teams` | **我的团队**（仅已加入） | 需登录 |
| `/#/my-teams/:id` | **团队详情**（只读：名称+描述+所有者+成员+3D大脑） | 需登录 |
| `/#/teams` | 团队广场（所有团队） | 需登录 |
| `/#/join-team` | 加入团队 | 需登录 |
| `/#/profile` | 个人信息 | 需登录 |
| `/#/about` | **关于**（系统概述） | 公开 |
| `/#/admin` | 管理仪表盘 | ADMIN |
| `/#/admin/users` | 用户管理 | ADMIN |
| `/#/admin/teams` | 团队管理 | ADMIN |
| `/#/admin/teams/:id` | 团队详情（3D 大脑+节点列表） | ADMIN |
| `/#/admin/teams/:id/edit` | 团队编辑（三个选项卡） | ADMIN 或 TEAM_ADMIN |
| `/#/admin/logs` | 操作日志 | ADMIN |

---

## 五、导航栏

```
TeamBrain    我的团队  团队广场  个人信息  关于  [管理]
```

- "关于"放在个人信息后面
- "[管理]"仅 ADMIN 可见

---

## 六、页面设计

### 6.1 关于页面 (About.jsx)

```
┌──────────────────────────────────────────┐
│  TeamBrain                               │
│                                          │
│  TeamBrain 是一个组织架构可视化平台。       │
│  将团队的成员和项目映射到 3D 大脑模型的     │
│  不同脑区，直观展示组织结构和协作关系。      │
│  支持多团队、角色权限、自动连接策略和       │
│  拖拽交互。                               │
│                                          │
│  技术栈：Spring Boot + React + Three.js   │
└──────────────────────────────────────────┘
```

使用 PageShell + GlassCard，深色背景，居中布局。

### 6.2 滚动与滚动条风格

MyTeams、TeamSquare、JoinTeam 等列表页需支持内容溢出时下滑：

- 页面容器 `overflow-y-auto` + `h-full`
- 滚动条风格与 Cosmic Glass 一致（`scrollbar-thin` + 暗色半透明）：

```css
/* 在 index.css 中添加 */
.scrollbar-glass::-webkit-scrollbar { width: 6px; }
.scrollbar-glass::-webkit-scrollbar-track { background: transparent; }
.scrollbar-glass::-webkit-scrollbar-thumb { 
  background: rgba(148, 163, 184, 0.3); 
  border-radius: 3px;
}
.scrollbar-glass::-webkit-scrollbar-thumb:hover { 
  background: rgba(148, 163, 184, 0.5);
}
```

应用 `scrollbar-glass` 类到内容溢出容器。

### 6.3 我的团队页面 (MyTeams.jsx)

```
┌──────────────────────────────────────────┐
│  我的团队                                 │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 星辰科技  │ │ 云帆教育  │ │           │  │
│  │ AI数字.. │ │ 在线编程..│ │           │  │
│  │ 12 节点  │ │ 9 节点   │ │           │  │
│  └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────┘
```

- 调用 `GET /api/user/teams` 获取当前用户已加入的团队
- 卡片点击 → `/#/my-teams/:id`
- 若无团队 → 提示"暂无加入的团队"，按钮跳转团队广场

### 6.4 我的团队子页面 (MyTeamDetail.jsx)

**所有角色（ADMIN/TEAM_ADMIN/USER）均为只读**：

```
┌──────────────────────────────────────────┐
│  ← 我的团队                               │
│                                          │
│  星辰科技                                 │
│  AI驱动的企业数字化解决方案提供商            │
│  所有者：user10                            │
│                                          │
│  团队成员（3人）：                          │
│    user10   user11   user12              │
│                                          │
│  ───────────────────────────────         │
│                                          │
│       3D 大脑可视化 (BrainPointCloud)      │
│       只读，无编辑选项卡                   │
└──────────────────────────────────────────┘
```

编辑功能仅通过 `/#/admin/teams/:id/edit`（三个选项卡），与 MyTeamDetail 完全解耦。

---

## 七、API

### 7.1 新增端点

| 方法 | 路径 | 鉴权 | 实现 |
|------|------|------|------|
| GET | `/api/user/teams` | 需登录 | TeamService.getMyTeams(username) → UserTeamRepository |
| GET | `/api/teams/{id}/members` | 需登录 | TeamService.getMembers(teamId) → UserTeamRepository |
| POST | `/api/teams/{id}/join` | 需登录 | TeamService.joinTeam(teamId, username) |
| DELETE | `/api/teams/{id}/leave` | 需登录 | TeamService.leaveTeam(teamId, username) |
| DELETE | `/api/teams/{id}/members/{userId}` | owner/admin | TeamService.removeMember(teamId, userId, adminUsername) |

### 7.2 用户列表多团队显示

AdminPage 用户列表新增一列"团队数"：

```
状态 | 用户名 | 角色 | 团队 | 团队数 | 操作
 🟢   admin   ADMIN   —      0      [编辑]
 🟢   user10  USER   星辰科技  3      [编辑]
```

- "团队"列 = 所有者团队名（`team.user_id == user.id`），无则为 —
- "团队数"列 = `teamIds.length`

后端 `GET /api/admin/users` 返回新增 `ownedTeamName` 和 `teamCount`。

### 7.3 权限调整

AdminController 的团队端点增加 TEAM_ADMIN 访问：
- `GET /api/admin/teams/{id}/nodes` — 若当前用户为 team owner，允许访问
- `PUT /api/admin/teams/{id}` — 同上

---

## 八、涉及文件

| 层 | 文件 | 操作 |
|----|------|------|
| 后端 | `entity/UserTeam.java` | 新建 |
| 后端 | `entity/UserTeamId.java` | 新建（复合主键类） |
| 后端 | `repository/UserTeamRepository.java` | 新建 |
| 后端 | `dto/LoginResponse.java` | 修改：teamId → teamIds, +ownedTeamId |
| 后端 | `service/AuthService.java` | 修改：登录查 user_team，register 移除自动创团队 |
| 后端 | `service/AdminService.java` | 修改：createUser 移除自动创团队 |
| 后端 | `service/TeamService.java` | 修改：加成员管理 + isOwner/canEdit |
| 后端 | `service/AdminService.java` | 修改：getAllUsers 加 ownedTeamName/teamCount |
| 后端 | `controller/TeamController.java` | 修改：加成员/我的团队端点 |
| 后端 | `controller/AdminController.java` | 修改：TEAM_ADMIN 可访问团队端点 |
| 后端 | `config/MockDataSeeder.java` | 修改：user_team 关联数据 |
| 后端 | `config/SecurityConfig.java` | 修改：/api/about 公开 |
| 前端 | `context/AuthContext.jsx` | 修改：teamId → teamIds |
| 前端 | `components/Navbar.jsx` | 修改：加"关于" |
| 前端 | `App.jsx` | 修改：加 #/about 路由 |
| 前端 | `pages/About.jsx` | 新建 |
| 前端 | `pages/Index.jsx` | 修改：默认团队逻辑（owner优先→首个加入→默认1） |
| 前端 | `pages/MyTeams.jsx` | 修改：调用 /user/teams, overflow-y-auto |
| 前端 | `pages/TeamSquare.jsx` | 修改：overflow-y-auto |
| 前端 | `pages/MyTeamDetail.jsx` | 修改：只读视图+成员列表 |
| 前端 | `pages/AdminPage.jsx` | 修改：用户列表加团队数列 |
| 前端 | `src/index.css` | 修改：加 .scrollbar-glass 样式 |
