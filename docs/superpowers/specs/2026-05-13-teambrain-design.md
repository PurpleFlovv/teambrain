# TeamBrain 全栈系统设计文档

## 概述

基于现有 React + Vite + Three.js 3D 脑部点云可视化应用，构建完整的 Java Spring Boot 全栈系统。保持前端视觉风格不变，将脑区分区逻辑改为基于真实神经解剖学坐标的算法分区，前端逻辑合理转移至后端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite 5 + Three.js 0.183 + Tailwind CSS 3.4 + shadcn/ui |
| 后端 | Spring Boot 3.x + Spring Security + Spring Data JPA |
| 认证 | JWT（jjwt） |
| 数据库 | MySQL 8.x |
| 部署 | 整合部署（Vite build → static/ + java -jar） |

## 项目结构

```
TeamBrain/
├── nocode/                  # 旧项目（不动，供参考）
├── util_scripts/            # Python 脚本（更新 gen_points.py）
├── backend/                 # Spring Boot（新建）
│   └── src/main/java/com/teambrain/
│       ├── controller/      # AuthController, TeamController, TeamNodeController,
│       │                    #   BrainRegionController, ConnectionController, AdminController
│       ├── service/         # 业务逻辑层（含 BrainRegionService 分区算法）
│       ├── repository/      # JPA Repository
│       ├── entity/          # JPA Entity
│       ├── dto/             # 数据传输对象
│       ├── config/          # SecurityConfig, CorsConfig
│       └── util/            # JwtUtil
└── frontend/                # React（新建，基于 nocode 代码重构）
    └── src/
        ├── components/
        │   ├── brain/       # BrainScene, PointCloud, Connections, StarBackground, BrainLighting
        │   ├── ui/          # InfoPanel, NodePanel, EditModal, LoginForm
        │   └── shared/      # shadcn/ui 组件
        ├── hooks/           # useBrainData, useTeamData, useAuth
        ├── services/        # api.js (axios 实例)
        ├── pages/           # BrainPage, LoginPage
        └── context/         # AuthContext
```

## 数据库设计（8 张表）

### sys_user — 用户账号
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| password | VARCHAR(255) | BCrypt 加密 |
| email | VARCHAR(100) | 邮箱 |
| enabled | BOOLEAN | 是否启用 |

### sys_role — 角色
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(20) UNIQUE | USER / ADMIN |

### sys_user_role — 用户-角色关联
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | BIGINT FK | 关联 sys_user |
| role_id | BIGINT FK | 关联 sys_role |

### team — 团队
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| team_name | VARCHAR(100) | 团队名称 |
| description | VARCHAR(500) | 简介 |
| user_id | BIGINT FK | 所有者（关联 sys_user） |

### brain_region — 脑区定义
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(50) | 前额叶/额叶/顶叶/颞叶/枕叶/小脑脑干 |
| color_hex | VARCHAR(7) | 显示颜色 |
| sort_order | INT | 排序 |

脑区预设数据：

| 脑区 | 颜色 |
|------|------|
| 前额叶 | #FFB347 |
| 额叶 | #44AAFF |
| 顶叶 | #AA44FF |
| 颞叶 | #44FFAA |
| 枕叶 | #FF8844 |
| 小脑/脑干 | #FF4477 |

### brain_point — 点云数据
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| brain_region_id | BIGINT FK | 关联 brain_region |
| x | DOUBLE | X 坐标 |
| y | DOUBLE | Y 坐标 |
| z | DOUBLE | Z 坐标 |

### team_node — 团队成员/项目节点
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| team_id | BIGINT FK | 关联 team |
| brain_region_id | BIGINT FK | 所属脑区 |
| name | VARCHAR(100) | 名称 |
| description | TEXT | 描述 |
| node_type | ENUM | MEMBER / PROJECT |

### node_connection — 连接规则
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| team_id | BIGINT FK | 关联 team |
| from_node_id | BIGINT FK | 起始节点 |
| to_node_id | BIGINT FK | 目标节点（NULL 表示通配 *） |
| target_type | ENUM | SINGLE / ALL（ALL=toward *） |
| connection_type | VARCHAR(30) | management/creative/production/business/culture |
| color_hex | VARCHAR(7) | 连线颜色 |
| line_width | DOUBLE | 线宽 |
| flow_color_hex | VARCHAR(7) | 流动粒子颜色 |
| opacity | DOUBLE | 透明度 |

## 脑区坐标分区算法

### 模型结构分析

brain.glb 含 6 个几何体：
- Part_04 (19991v)：右大脑半球，X=[-0.006, 0.529], Y=[0.287, 1.124], Z=[-0.658, 0.658]
- Part_06 (19991v)：左大脑半球，X=[-0.529, 0.006], Y=[0.287, 1.124], Z=[-0.658, 0.658]
- Part_02 (6911v)：小脑，Z=[-0.502, -0.036], Y=[0.144, 0.519]
- Part_05 (1664v)：脑干，Z=[-0.240, 0.315], Y=[0.001, 0.817]
- Part_01, 03：小型附件（并入邻近区域）

坐标系：**X=左右，Y=上下（低=下），Z=前后（负=后/枕叶，正=前/额叶）**

### 分类流程

1. Part_02 + Part_05 顶点直接标记为「小脑/脑干」
2. Part_04 + Part_06 半球顶点，采样表面+内部填充点，逐点分类：

```
z_norm = (z - z_min) / (z_max - z_min)   # 0=后部  1=前部
y_norm = (y - y_min) / (y_max - y_min)   # 0=下部  1=上部
x_abs  = |x|                              # 距中线距离

if y_norm < 0.35 and x_abs > 0.12 and z_norm > 0.25:
    → 颞叶（侧下方，Sylvian fissure 下方区域）
elif z_norm > 0.75:
    → 前额叶（最前 ~25%）
elif z_norm > 0.48:
    → 额叶（中部偏前 ~27%）
elif z_norm > 0.22:
    → 顶叶（中部偏后 ~26%）
else:
    → 枕叶（最后 ~22%）
```

### 采样策略

- 半球顶点采样：每半球 ~3000 点（表面采样 + 内部收缩填充）
- 小脑/脑干：~2000 点
- 总计 ~8000 点，确保体积感

## REST API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 公开 |
| POST | /api/auth/login | 登录，返回 JWT | 公开 |
| GET | /api/teams/{id} | 获取团队信息 | USER |
| PUT | /api/teams/{id} | 更新团队 | USER（本人） |
| POST | /api/teams | 创建团队 | USER |
| GET | /api/teams/{id}/nodes | 节点列表 | USER |
| POST | /api/teams/{id}/nodes | 添加节点 | USER |
| PUT | /api/nodes/{id} | 编辑节点 | USER |
| DELETE | /api/nodes/{id} | 删除节点 | USER |
| GET | /api/teams/{id}/connections | 连接规则 | USER |
| POST | /api/teams/{id}/connections | 添加连接 | USER |
| PUT | /api/connections/{id} | 编辑连接 | USER |
| DELETE | /api/connections/{id} | 删除连接 | USER |
| GET | /api/brain/points | 点云数据 | 公开 |
| GET | /api/brain/regions | 脑区元数据 | 公开 |
| GET | /api/admin/users | 用户列表 | ADMIN |
| PUT | /api/admin/users/{id}/state | 启用/禁用 | ADMIN |

## 数据初始化

1. JPA ddl-auto: update 自动建表
2. data.sql 预置：admin/admin 账号、USER/ADMIN 角色、6 个脑区记录、脑区分区脚本产出的点云数据
3. 示例团队数据（影视飓风作为 seed 数据）

## 认证流程

1. 用户 POST /api/auth/login 提交 username + password
2. 后端验证 BCrypt 密码，签发 JWT（含 userId + roles，24h 有效期）
3. 前端 axios 拦截器自动附加 `Authorization: Bearer <token>`
4. Spring Security Filter 校验 JWT，注入 SecurityContext

## 前端逻辑转移

| 原来（前端硬编码） | 改为（后端 API） |
|---|---|
| brainRegionInfo 对象 | GET /api/teams/{id}/nodes |
| connectionRules 数组 | GET /api/teams/{id}/connections |
| 远程 gist URL 取点云 | GET /api/brain/points |
| 团队名称硬编码 | GET /api/teams/{id} |

前端仅负责：Three.js 渲染、交互（悬停/点击/拖拽/旋转缩放）、UI 面板展示。

## 部署

开发模式：前后端分离，Vite :5173 + Spring Boot :8080
生产模式：`vite build → static/ → mvn package → java -jar teambrain.jar`，单端口 :8080
