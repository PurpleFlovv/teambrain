# TeamBrain 后台管理 & 连接策略重设计

## 一、仪表盘

**布局：** 团队选择器 → KPI 卡片行 → 双栏核心（迷你 3D 大脑 + 脑区节点分布条形图）→ 底部系统概览

**3D 迷你大脑：** 无连接线，仅脑区分色渲染。可旋转但无交互（点击/悬停不触发高亮）。使用独立的小 canvas。

**脑区分布条形图：** 横条图，每个脑区一行：颜色块 + 名称 + 节点数。点击可跳转到团队详情。

**系统概览横条：** 用户总数 | 团队总数 | 日志条数。点击跳转对应管理页。

---

## 二、用户管理

| 功能 | 说明 |
|------|------|
| 搜索 | 用户名/邮箱实时筛选 |
| 新建 | 弹窗表单（用户名、密码、邮箱、角色勾选） |
| 编辑 | 弹窗表单（用户名、邮箱、角色、密码可选重置） |
| 删除 | 确认弹窗 → 级联删除该用户的团队和节点 |
| 启用/禁用 | 行内切换 |

**表格列：** 状态 · 用户名 · 邮箱 · 角色 · 团队 · 创建时间 · 操作

---

## 三、团队管理

**表格列：** 团队名 · 所有者 · 成员数 · 项目数 · 创建时间 · 操作

| 功能 | 说明 |
|------|------|
| 搜索 | 团队名/所有者筛选 |
| 查看详情 | 全屏 3D 大脑 + 右侧节点/连接列表 |
| 编辑 | 弹窗（团队名、描述） |
| 删除 | 确认弹窗 → 级联删除节点和连接 |

---

## 四、脑区管理

**表格列：** 名称 · 颜色 · 点云数量 · 操作

- 编辑弹窗：名称 + 颜色选择器
- 只读（不可增删脑区，6 个固定）

---

## 五、操作日志

**audit_log 表：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| username | VARCHAR(50) | 操作者 |
| action | VARCHAR(30) | CREATE_USER / DELETE_USER / DELETE_TEAM / UPDATE_REGION 等 |
| target | VARCHAR(200) | 操作对象描述 |
| created_at | TIMESTAMP | 时间 |

**前端：** 只读列表，可按 action 类型筛选，分页

**后端记录时机：** AdminService 的增删改方法中自动写入日志

---

## 六、连接策略重设计

### 当前问题
- 逐条手动 from→to，不可维护
- 通配 `*` 导致连接爆炸（29 条文化连接）
- 连接类型硬编码，切换团队无意义
- 无 LOD，渲染性能差

### 新增 `connection_type` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| team_id | BIGINT FK | 所属团队 |
| name | VARCHAR(30) | 如"管理""协作" |
| color_hex | VARCHAR(7) | 连线颜色 |
| line_width | DOUBLE | 线宽 |
| opacity | DOUBLE | 透明度 |

每个团队可自定义自己的连接类型。

### 四种自动连接策略

**策略 A：同区协作**
同一脑区内的节点两两连接。密度控制：每节点最多连 5 个同区邻居。

**策略 B：负责关系**
标记为 `leader` 的节点 → 同脑区所有项目节点。

**策略 C：跨区桥接**
标记为 `bridge:<区域ID>` 的节点 → 连接到指定脑区所有节点。

**策略 D：手动连接**
用户自定义的 from→to（优先级最高，不被策略覆盖）。

### 节点模型变更

`team_node` 新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| tags | VARCHAR(200) | `leader` / `bridge:3,4`（逗号分隔） |

### 策略执行流程

后端新增 `ConnectionStrategyService`：根据 team node 的 tags 和脑区归属，动态计算连接列表。前端获取连接时调用此服务。

### 渲染优化

- LOD：距离相机 >5 时用简单 Line 替代 TubeGeometry，>10 不渲染
- 流动粒子仅在高亮节点时激活

---

## 七、后端新增 API 汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/users | 新建用户 |
| PUT | /api/admin/users/{id} | 编辑用户 |
| DELETE | /api/admin/users/{id} | 删除用户（级联团队+节点） |
| PUT | /api/admin/teams/{id} | 编辑团队 |
| DELETE | /api/admin/teams/{id} | 删除团队 |
| PUT | /api/admin/regions/{id} | 编辑脑区 |
| GET | /api/admin/logs | 操作日志列表（分页+筛选） |
| GET | /api/teams/{id}/connections/computed | 策略计算的连接 + 手动连接 |
| GET | /api/connection-types | 连接类型列表 |
| POST | /api/connection-types | 新建连接类型 |
| PUT | /api/connection-types/{id} | 编辑连接类型 |
| DELETE | /api/connection-types/{id} | 删除连接类型 |

---

## 八、涉及文件

| 层 | 文件 | 操作 |
|----|------|------|
| 后端 | `entity/AuditLog.java` | 新建 |
| 后端 | `entity/ConnectionType.java` | 新建 |
| 后端 | `entity/TeamNode.java` | 修改：加 tags 字段 |
| 后端 | `repository/AuditLogRepository.java` | 新建 |
| 后端 | `repository/ConnectionTypeRepository.java` | 新建 |
| 后端 | `service/ConnectionStrategyService.java` | 新建 |
| 后端 | `service/AdminService.java` | 修改：CRUD + 日志 |
| 后端 | `controller/AdminController.java` | 修改：新端点 |
| 后端 | `controller/ConnectionTypeController.java` | 新建 |
| 前端 | `pages/AdminPage.jsx` | 重写 |
| 前端 | `components/MiniBrain.jsx` | 新建 |
| 前端 | `components/BrainPointCloud.jsx` | 修改：LOD 策略 |
| 前端 | `App.jsx` | 不变 |
