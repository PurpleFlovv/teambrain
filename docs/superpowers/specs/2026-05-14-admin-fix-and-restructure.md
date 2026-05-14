# TeamBrain 管理后台修复与重构

## 一、仪表盘修复

### 1.1 MiniBrain 方向修复
当前 MiniBrain 未做 Y/Z 坐标交换。需在 MiniBrain 组件中增加与 BrainPointCloud 相同的坐标交换：
```javascript
sphere.position.set(p.x, p[2], p[1]); // Y/Z swap
```
同步修改：`gen_points.py` 输出时不做 Y/Z swap（已改为 native），MiniBrain 和 BrainPointCloud 各自处理。

### 1.2 仪表盘布局自适应
- 仪表盘容器 `max-h-[calc(100vh-56px)]`（56px 留给顶部导航栏），`max-h` 上限 `min(100vh-56px, 960px)`
- MiniBrain 尺寸 `height: min(50vh, 420px)`，宽度 100% 自适应容器
- 节点分布区 `overflow-y-auto`，内部 `flex` 自动分配
- KPI 卡片 `p-3`，最小宽 `min-w-[120px]`，`flex-wrap`
- 全局 `space-y-3` 替代 `space-y-6`
- 不同分辨率下均一屏显示，不成比例拉伸

---

## 二、用户管理

### 2.1 表单验证
新建/编辑用户保存时检查必填项（用户名、密码（新建时）、邮箱），缺项时显示红色提示文字而非保存。

### 2.2 用户团队列
表格新增"团队"列，调用 `/api/admin/users` 时返回 `teamId` 和 `teamName`。无团队用户显示"未加入"并附带"选择团队"按钮。

### 2.3 团队选择页面
路由 `/#/join-team`：卡片网格展示所有团队（团队名 + 描述）。点击"加入"弹出模态框，显示团队详情（名称、描述、脑区节点分布条）。确认加入调用 `POST /api/teams/{id}/join`。

### 2.4 用户管理筛选
用户管理页增加团队筛选下拉框（按 teamId 筛选）。

---

## 三、团队管理

### 3.1 新增团队
"新建团队"按钮 → 弹窗输入团队名 + 描述 → `POST /api/admin/teams`。创建时从模板复制 6 个脑区。

### 3.2 团队编辑改为子页面
"编辑"按钮路由到 `/#/admin/teams/:id/edit`。子页面顶部居中三个选项卡（风格同原模态框"手动编辑 / 导入 JSON"）：

```
        [编辑信息]  [编辑节点]  [导入 JSON]
```

**选项卡"编辑信息"：**
- 团队名称输入框
- 团队描述输入框
- 底部保存按钮

**选项卡"编辑节点"：**
- 左侧：节点列表（搜索、脑区筛选、增删改、拖拽手柄）
- 右侧：脑区列表（可切换迷你大脑视图），可拖拽节点到脑区卡片或迷你大脑
- 底部保存按钮

**选项卡"导入 JSON"：**
- 文件选择按钮 + JSON 格式说明 + 预览区
- 导入后替换当前团队全部节点（保持原脑区映射）

### 3.3 节点拖拽
- 左侧节点项高度增大（`p-4`、`min-h-[56px]`）
- 拖拽手柄 `⋮⋮` 图标
- 拖拽时浮层提示："拖到脑区卡片或迷你大脑上即可移动"
- 拖动源节点半透明
- 目标脑区卡片悬停：边框高亮该脑区颜色 + 脉冲动画
- 迷你大脑悬停目标脑区：该脑区全部点 emissive 强度增强（高亮整个脑区）
- 释放到脑区 → `PUT /api/nodes/:id/region {brainRegionId}`（可为 null = 未分配）
- **释放位置不在任何脑区 → 取消拖拽，节点回到原位**

### 3.4 团队详情查看修复
修复"查看"一直显示加载中的问题：`useTeamData` 在 admin 模式下请求路径为 `/admin/teams/{id}/nodes`，但当前 `useBrainData` loading 未正确联动。

### 3.5 团队描述显示
Team 表的 `description` 字段需在前端正确取回。`GET /admin/teams` 返回中增加 `description` 字段。

---

## 四、脑区管理重构

### 4.1 数据模型变更

**brain_region 表新增列：**

| 列 | 类型 | 说明 |
|----|------|------|
| team_id | BIGINT NULL | NULL=全局模板；非NULL=团队专属 |
| template_region_id | BIGINT NULL | 映射到模板脑区ID |

**brain_point 不变：** 始终引用全局模板脑区。

**data.sql 调整：** 6 条模板脑区 team_id=NULL，默认 6 个模板。创建团队时从模板复制 6 条脑区（team_id=团队ID）。

### 4.2 脑区 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/teams/{teamId}/regions` | 团队脑区列表（含映射的模板脑区点云数据） |
| POST | `/api/teams/{teamId}/regions` | 新增脑区（必选 templateRegionId） |
| PUT | `/api/teams/{teamId}/regions/{id}` | 修改名称/颜色 |
| DELETE | `/api/teams/{teamId}/regions/{id}` | 删除（最少保留1个，节点重新分配） |
| PUT | `/api/teams/{teamId}/regions/reorder` | 排序 |
| POST | `/api/teams/{teamId}/regions/merge` | 合并（多对一/多对多） |

### 4.3 脑区映射规则
- 创建脑区时必须选择映射的模板脑区（下拉6个）
- 多个团队脑区可映射到同一模板（拆分）
- 合并：选择多个源脑区 → 选择目标脑区 → 确认。源脑区节点全部移入目标，源脑区删除
- 点云数据查询：`GET /api/brain/points?teamId=` 根据团队脑区的 template_region_id 映射颜色和名称

### 4.4 删除脑区
弹窗选择节点去向：移到指定脑区 或 标记为"未分配"（brainRegionId = null）

### 4.5 前端脑区管理页面重构
- 脑区管理页移到团队编辑子页面下（不再独立顶级菜单）
- 独立菜单项"脑区管理"保留但跳转到当前用户默认团队的编辑子页面，或移除
- 脑区列表每项显示：颜色 · 名称 · 映射模板 · 节点数 · 操作

---

## 五、导航栏重构

### 5.1 顶部导航栏
```
┌──────────────────────────────────────────────────────┐
│  TeamBrain         我的团队 团队广场 个人信息  [admin]│
└──────────────────────────────────────────────────────┘
```

- 导航栏向右对齐
- **移除大脑首页右上角"编辑团队信息"按钮**：原模态框的手动编辑（团队名称、各脑区增删改）和导入 JSON，合并到"我的团队 → 对应团队 → 编辑"子页面中的两个选项卡（编辑信息 / 编辑节点）

### 5.2 路由

| 路径 | 页面 | 权限 |
|------|------|------|
| `/#/` | 大脑首页 | 需登录 |
| `/#/login` | 登录 | 公开 |
| `/#/my-teams` | 我的团队列表 | 需登录 |
| `/#/my-teams/:id` | 我的团队详情/编辑 | 需登录 |
| `/#/teams` | 团队广场 | 需登录 |
| `/#/profile` | 个人信息 | 需登录 |
| `/#/join-team` | 加入团队 | 需登录 |
| `/#/admin` | 管理仪表盘 | ADMIN |
| `/#/admin/users` | 用户管理 | ADMIN |
| `/#/admin/teams` | 团队管理 | ADMIN |
| `/#/admin/teams/:id` | 团队详情 | ADMIN |
| `/#/admin/teams/:id/edit` | 团队编辑 | ADMIN or 团队管理员 |
| `/#/admin/logs` | 操作日志 | ADMIN |

### 5.3 首页大脑逻辑
- 用户有多团队 → 使用标记为"首页"的团队（第一个）
- 用户无团队 → 使用默认影视飓风数据（teamId=1）
- "我的团队"页面可设置首页大脑

---

## 六、后端新增 API 汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/teams` | 创建团队（含复制模板脑区） |
| GET | `/api/teams/{teamId}/regions` | 团队脑区列表 |
| POST | `/api/teams/{teamId}/regions` | 新增脑区 |
| PUT | `/api/teams/{teamId}/regions/{id}` | 修改脑区 |
| DELETE | `/api/teams/{teamId}/regions/{id}` | 删除脑区 |
| PUT | `/api/teams/{teamId}/regions/reorder` | 排序 |
| POST | `/api/teams/{teamId}/regions/merge` | 合并脑区 |
| PUT | `/api/nodes/{id}/region` | 节点移脑区 |
| POST | `/api/teams/{id}/join` | 加入团队 |
| GET | `/api/brain/points?teamId=` | 点云（映射团队脑区） |

---

## 七、涉及文件

| 层 | 文件 | 操作 |
|----|------|------|
| 后端 | `entity/BrainRegion.java` | 修改：加 team_id, template_region_id |
| 后端 | `entity/Team.java` | 修改：确认 description 字段存在 |
| 后端 | `service/AdminService.java` | 修改：创团队、脑区CRUD |
| 后端 | `service/BrainRegionService.java` | 新建/重写：脑区CRUD+映射 |
| 后端 | `controller/AdminController.java` | 修改：新端点 |
| 后端 | `controller/BrainRegionController.java` | 新建/重写 |
| 后端 | `controller/TeamController.java` | 修改：join端点 |
| 后端 | `config/BrainDataImporter.java` | 修改：支持 teamId 查询点云 |
| 后端 | `resources/data.sql` | 修改：模板脑区 team_id=NULL |
| 前端 | `components/MiniBrain.jsx` | 修改：Y/Z swap、拖拽高亮 |
| 前端 | `components/BrainPointCloud.jsx` | 修改：坐标 |
| 前端 | `pages/AdminPage.jsx` | 重写 |
| 前端 | `pages/MyTeams.jsx` | 新建 |
| 前端 | `pages/TeamSquare.jsx` | 新建 |
| 前端 | `pages/JoinTeam.jsx` | 新建 |
| 前端 | `pages/Profile.jsx` | 新建 |
| 前端 | `hooks/useBrainData.js` | 修改：接受 teamId |
| 前端 | `hooks/useTeamData.js` | 不修改 |
| 前端 | `App.jsx` | 修改：导航栏+新路由 |
| 前端 | `Index.jsx` | 修改：顶部导航栏 |
