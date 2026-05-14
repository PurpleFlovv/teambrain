# TeamBrain 系统完整设计

**版本**: 1.0 | **日期**: 2026-05-15 | **状态**: 当前实现

---

## 一、系统概述

TeamBrain 是一个组织架构可视化平台。将团队的成员和项目映射到 3D 大脑模型的不同脑区，直观展示组织结构和协作关系。支持多团队、角色权限、自动连接策略和拖拽交互。

**技术栈**: Spring Boot 3.4 + JPA + MySQL | React 18 + Three.js + Tailwind CSS + shadcn/ui

---

## 二、核心概念

### 2.1 脑区 (Brain Region)
大脑分为 6 个解剖区域，对应组织的功能模块：

| 模板 ID | 名称 | 颜色 | 组织映射 |
|---------|------|------|---------|
| 1 | 前额叶 | #FFB347 | 核心管理层 |
| 2 | 额叶后部 | #44AAFF | 创意与战略 |
| 3 | 顶叶 | #AA44FF | 技术执行 |
| 4 | 颞叶 | #44FFAA | 商务运营 |
| 5 | 枕叶 | #FF8844 | 品牌与愿景 |
| 6 | 小脑/脑干 | #FF4477 | 企业文化 |

脑区系统采用**模板-团队双层架构**：
- 6 个全局模板脑区（`team_id = NULL`），固定不可变
- 每个团队从模板复制 6 个脑区（`template_region_id` 指向模板）
- 团队可自定义脑区名称和颜色，可增删合并脑区
- 多个团队脑区可映射到同一模板

### 2.2 节点 (Team Node)
每个节点代表一个组织实体：
- **MEMBER**: 团队成员
- **PROJECT**: 项目或产品
- 节点归属于特定脑区，可拖拽移动
- `tags` 字段支持 `leader`（同区领导者）和 `bridge:区域ID`（跨区桥接）

### 2.3 连接 (Connection)
节点之间的协作关系：
- 手动连接：用户自定义 from → to
- 自动策略连接：系统根据节点属性和标签自动生成

---

## 三、数据模型

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  sys_user │────→│   team   │────→│ brain_region  │
│  - id     │ 1:1 │  - id    │ 1:N │  - id         │
│  - username│     │  - name  │     │  - name       │
│  - password│     │  - desc  │     │  - color_hex  │
│  - enabled │     │  - user_id│    │  - team_id    │
└──────────┘     └──────────┘     │  - template_id │
      │              │            └──────────────┘
      │ N:M          │ 1:N               │ 1:N
      ▼              ▼                   ▼
┌──────────┐   ┌───────────┐    ┌──────────────┐
│ sys_role │   │ team_node  │    │  brain_point  │
│  - name  │   │  - name    │    │  - x, y, z    │
└──────────┘   │  - type    │    │  - region_id  │
               │  - tags    │    └──────────────┘
               │  - region_id│
               └───────────┘
                     │
                     │ N:M
                     ▼
              ┌────────────────┐
              │ node_connection │
              │  - from_node_id │
              │  - to_node_id   │
              │  - type         │
              │  - color_hex    │
              └────────────────┘
```

**审计日志 (audit_log)**: 记录 CREATE_USER / DELETE_USER / UPDATE_TEAM / DELETE_TEAM / UPDATE_REGION 等管理操作。

**连接类型 (connection_type)**: 团队可自定义连接样式（名称、颜色、线宽、透明度）。

---

## 四、3D 大脑引擎

### 4.1 点云生成
`util_scripts/gen_points.py`：从 brain.glb 模型采样顶点，按解剖边界分类到 6 个脑区。

**分类算法**: 倾斜边界，模拟真实脑沟走向：
- 顶枕沟: `z_occipital = 0.20 - 0.10 * y_norm`（顶部更靠后）
- 中央沟: `z_central = 0.50 - 0.16 * y_norm`（底部前倾）
- 前额叶边界: `z_prefrontal = 0.70 - 0.10 * y_norm`
- 外侧裂（颞叶上界）: `y_temporal = 0.22 + 0.33 * z_norm`
- 颞叶前界: `z_norm < 0.76`

输出 2900 个点，Y/Z 坐标在输出时交换以适配前端 Three.js 坐标系。

### 4.2 前端 3D 渲染

**BrainPointCloud**（全功能 3D 视图）:
- 2900 个 SphereGeometry 点，按 regionId 着色
- 代表节点：随机选取每个 infoKey 的代表点
- 动态连接线：TubeGeometry（近距离）+ Line（远距离 LOD）
- 流动粒子：仅在高亮节点时激活
- 鼠标交互：悬停高亮、点击显示连接、拖拽旋转
- LOD: >15 单位用简单 Line，>30 单位跳过

**MiniBrain**（仪表盘迷你视图）:
- 仅脑区分色渲染，无连接线
- 自动旋转，无点击交互
- 支持拖拽接收：onDragOver + onDrop 射线检测区域归属

---

## 五、路由与页面

### 5.1 前端路由 (HashRouter)

| 路径 | 页面 | 组件 | 权限 |
|------|------|------|------|
| `/#/login` | 登录/注册 | LoginPage | 公开 |
| `/#/` | 大脑首页 | Index → BrainPointCloud | 需登录 |
| `/#/my-teams` | 我的团队 | MyTeams | 需登录 |
| `/#/my-teams/:id` | 团队编辑 | MyTeamDetail → TeamEditor | 需登录 |
| `/#/teams` | 团队广场 | TeamSquare | 需登录 |
| `/#/join-team` | 加入团队 | JoinTeam | 需登录 |
| `/#/profile` | 个人信息 | Profile | 需登录 |
| `/#/admin` | 管理仪表盘 | AdminPage → Dashboard | ADMIN |
| `/#/admin/users` | 用户管理 | AdminPage → UserList | ADMIN |
| `/#/admin/teams` | 团队管理 | AdminPage → TeamList | ADMIN |
| `/#/admin/teams/:id` | 团队详情 | AdminPage → TeamDetail | ADMIN |
| `/#/admin/teams/:id/edit` | 团队编辑 | AdminPage → TeamEditPage → TeamEditor | ADMIN |
| `/#/admin/logs` | 操作日志 | AdminPage → LogList | ADMIN |

### 5.2 页面架构

**导航布局**: ProtectedLayout = Navbar（顶部 56px）+ 内容区（flex-1）

**AdminPage**: 顶部水平选项卡（仪表盘/用户管理/团队管理/操作日志），无侧边栏

**TeamEditor**: 共享组件，MyTeamDetail 和 TeamEditPage 的薄包装
- 三个居中选项卡：编辑信息 / 编辑节点 / 导入 JSON
- 编辑节点：左侧节点列表（可拖拽）+ 右侧脑区面板（含策略总览 + MiniBrain 切换）

---

## 六、API 设计

### 6.1 认证 (`/api/auth`)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /register | 注册（自动创建团队+复制脑区） |
| POST | /login | 登录（返回 JWT + roles） |

### 6.2 脑区与点云 (`/api/brain`, `/api/teams/{teamId}/regions`)
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/brain/regions | 公开 | 全局模板脑区 |
| GET | /api/brain/points?teamId= | 公开 | 点云（可选团队颜色映射） |
| GET | /api/teams/{teamId}/regions | 公开 | 团队脑区列表 |
| POST | /api/teams/{teamId}/regions | owner/admin | 新增脑区 |
| PUT | /api/teams/{teamId}/regions/{id} | owner/admin | 修改脑区 |
| DELETE | /api/teams/{teamId}/regions/{id} | owner/admin | 删除脑区（节点重分配） |
| POST | /api/teams/{teamId}/regions/merge | owner/admin | 合并脑区 |
| PUT | /api/teams/{teamId}/regions/reorder | owner/admin | 排序 |

### 6.3 节点 (`/api/teams/{teamId}/nodes`, `/api/nodes/{id}`)
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/teams/{teamId}/nodes | 公开 | 团队节点列表 |
| POST | /api/teams/{teamId}/nodes | owner/admin | 新增节点 |
| PUT | /api/nodes/{id} | owner/admin | 修改节点 |
| DELETE | /api/nodes/{id} | owner/admin | 删除节点 |
| PUT | /api/admin/nodes/{id}/region | admin | 移节点到其他脑区 |

### 6.4 团队 (`/api/teams`, `/api/admin/teams`)
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/teams/{id} | 需登录 | 团队信息 |
| PUT | /api/teams/{id} | owner/admin | 修改团队名称/描述 |
| POST | /api/teams/{id}/join | 需登录 | 加入团队 |
| GET | /api/teams/public | 公开 | 所有团队列表 |
| GET | /api/admin/teams | admin | 团队列表（含成员/项目数） |
| POST | /api/admin/teams | admin | 创建团队（复制模板脑区） |
| PUT | /api/admin/teams/{id} | admin | 管理员修改团队 |
| DELETE | /api/admin/teams/{id} | admin | 删除团队（级联） |
| GET | /api/admin/teams/{id}/connections/computed | admin | 策略计算的连接 |

### 6.5 用户管理 (`/api/admin/users`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表 |
| POST | /users | 创建用户 |
| PUT | /users/{id} | 编辑用户 |
| DELETE | /users/{id} | 删除用户（级联删除团队） |
| PUT | /users/{id}/state | 启用/禁用 |

### 6.6 连接类型 (`/api/connection-types`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | 查询团队的连接类型列表 |
| POST | / | 创建连接类型 |
| PUT | /{id} | 修改连接类型 |
| DELETE | /{id} | 删除连接类型 |

### 6.7 系统 (`/api/admin`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /stats | 仪表盘统计 |
| GET | /logs | 操作日志（分页+按类型筛选） |

---

## 七、连接策略引擎

`ConnectionStrategyService.computeConnections(teamId)` 按四层策略生成连接：

| 策略 | 触发条件 | 连接规则 |
|------|---------|---------|
| **D: 手动** | node_connection 表中已有的记录 | 直接使用，优先级最高 |
| **A: 同区协作** | 同脑区节点 | 每节点最多连接 5 个邻居 |
| **B: 负责关系** | 节点 tags 含 `leader` | Leader → 同脑区所有 PROJECT |
| **C: 跨区桥接** | 节点 tags 含 `bridge:区域ID` | Bridge → 目标脑区所有节点 |

去重：`"fromId_toId"` 格式的 HashSet。

---

## 八、权限模型

**角色**: USER / ADMIN / TEAM_ADMIN

**鉴权规则**:
- 节点操作（增/改/删/移脑区）：需是团队 owner 或系统 ADMIN
- 脑区操作（增/改/删/合并/排序）：需是团队 owner 或系统 ADMIN
- 用户/团队管理：需系统 ADMIN
- 公开端点（脑区/点云/团队列表）：无需认证

**JWT**: 含 userId、username、roles，有效期 24 小时。

---

## 九、Cosmic Glass 设计系统

### 9.1 CSS 变量（暗色模式）
```
--bg-deep-space: #0B0B10     (页面背景)
--glass-bg: rgba(15,23,42,0.55) (毛玻璃面板)
--glass-border: rgba(148,163,184,0.12) (面板边框)
--accent: #3B82F6            (主色调)
--text-primary: #F8FAFC      (正文)
--text-muted: #94A3B8        (辅助文本)
```

### 9.2 共享组件
| 组件 | 用途 |
|------|------|
| GlassCard | 毛玻璃卡片（default/accent variant） |
| GlassModal | 毛玻璃弹窗（基于 shadcn Dialog） |
| FormField | 表单字段（Label + Input + error） |
| PageShell | 页面容器（loading/error/max-width） |
| NodeModal | 节点创建/编辑弹窗 |
| RegionModal | 脑区创建/编辑弹窗 |
| DeleteRegionModal | 脑区删除确认弹窗（含节点重分配） |
| TeamEditor | 团队编辑共享组件（MyTeamDetail + TeamEditPage 共用） |

### 9.3 UI 规范
- 字体: Plus Jakarta Sans
- 圆角: 0.5rem
- 过渡: 150-300ms
- 通知: sonner toast（禁止 alert/confirm）
- 图标: lucide-react

---

## 十、部署

### 10.1 构建
```bash
./build.sh   # 前端 vite build → 复制到 backend static → mvn package
```

### 10.2 配置
```yaml
spring.datasource.url: jdbc:mysql://localhost:3306/teambrain
spring.jpa.hibernate.ddl-auto: update
jwt.secret: teambrain-jwt-secret-key-2026
jwt.expiration: 86400000  # 24h
```

### 10.3 种子数据
- `data.sql`: 角色、模板脑区、admin 用户、影视飓风团队
- `DataInitializer`: 确保 admin 用户存在
- `BrainDataImporter`: 从 brain_points_labeled.json 导入点云
- `MockDataSeeder`: 8 个模拟团队（各 18-22 节点）

### 10.4 启动
```bash
java -jar backend/target/teambrain-0.0.1.jar
# → http://localhost:8080
# admin / admin123
# 模拟用户: user10-user17 / 123456
```

---

## 十一、文件清单

### 后端 (47 文件)
```
entity/     AuditLog, BrainPoint, BrainRegion, ConnectionType, NodeConnection, Role, Team, TeamNode, User
dto/        BrainPointDto, BrainRegionDto, LoginRequest, LoginResponse, NodeConnectionDto, RegisterRequest, TeamDto, TeamNodeDto
repository/ 9 repositories
service/    AdminService, AuthService, BrainRegionService, ConnectionService, ConnectionStrategyService, TeamNodeService, TeamService
controller/ AdminController, AuthController, BrainRegionController, ConnectionController, ConnectionTypeController, TeamController, TeamNodeController
config/     BrainDataImporter, CorsConfig, DataInitializer, JwtAuthFilter, MockDataSeeder, SecurityConfig
util/       JwtUtil
```

### 前端 (85+ 文件)
```
components/
  BrainPointCloud.jsx    3D 大脑全功能渲染
  MiniBrain.jsx          迷你 3D 预览（含拖拽）
  Navbar.jsx             顶部导航栏
  TeamEditor.jsx         团队编辑共享组件（核心业务组件）
  shared/                7 个共享组件 (GlassCard, GlassModal, FormField, PageShell, 3个Modal)
  ui/                    45 个 shadcn/ui 组件

pages/
  Index.jsx              大脑首页（含团队切换）
  LoginPage.jsx          登录/注册
  AdminPage.jsx          管理后台（Dashboard + UserList + TeamList + TeamDetail + LogList）
  TeamEditPage.jsx       管理端团队编辑薄包装
  MyTeamDetail.jsx       用户端团队编辑薄包装
  MyTeams.jsx            我的团队列表
  TeamSquare.jsx         团队广场
  JoinTeam.jsx           加入团队
  Profile.jsx            个人信息

hooks/    useBrainData.js, useTeamData.js
context/  AuthContext.jsx
services/ api.js (axios + JWT interceptor)
```
