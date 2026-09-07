# TeamBrain 数据库迁移到 Aiven 设计文档

- 日期：2026-09-07
- 状态：已批准（等待实施）
- 范围：数据库托管从 Render PostgreSQL 切换到 Aiven PostgreSQL，并修复空库无法自引导的问题

## 一、背景与目标

### 现状

- 应用：Java 21 + Spring Boot 3.4 后端 + React/Vite 前端，Docker 构建，**部署在 Render**（teambrain.onrender.com）
- 数据库：PostgreSQL，当前托管在 Render 管理的 PostgreSQL 实例上，通过环境变量 `PG_HOST/PG_PORT/PG_DATABASE/PG_USER/PG_PASSWORD` 连接
- 生产 profile 固定 `ddl-auto: validate`，连接 URL 无任何 SSL 参数（依赖 JDBC 默认 `sslmode=prefer`）

### 问题

1. **空库无法自引导**：Render 免费 Postgres 实例 30 天过期/数据被重置后，再次部署空库时生产 `ddl-auto: validate` 只校验不建表，而 `data.sql` 只做 `INSERT` 不建表 → 启动即崩（典型报错 `Schema-management: missing table [audit_log]`，见 `docs/rebuild_logs/log1.txt`）。
2. **Render 免费 Postgres 不稳定**：实例会过期、数据可能丢失，托管体验差。
3. 需要迁移到 Aiven PostgreSQL（应用继续留在 Render）。

### 目标

- 数据库切换到 Aiven PostgreSQL，空库可一键自引导（建表 + 种子数据）。
- **全新开始**：不做旧数据迁移。
- **演示团队保留**：`MockDataSeeder` 生成的 8 个演示团队 + user10~17 在全新库中重新完整生成。
- 生产登录账号 admin/admin123、影视飓风团队 + 自定义节点来自 `data.sql` 种子。

### 非目标

- 不迁移 Render 现有数据库里的任何业务数据。
- 不引入 Flyway/Liquibase。
- 不做 `verify-full` 证书校验（采用 `sslmode=require`）。
- 不修改 `data.sql`、`MockDataSeeder` 的内容。

## 二、方案与权衡

### Schema 引导

- **选定方案 A：prod `ddl-auto` 由 `validate` 改为 `update`**
  - Aiven 空库首次启动时 Hibernate 自动建全表 → `data.sql` 排在其后种数据 → `MockDataSeeder` 补演示团队。
  - 之后新增实体表不会再崩。
  - 代价：schema 无版本管理、只能加不能删改列；本项目实体表小且稳定，可接受。
- 备选方案 B（Flyway）未采用：需新增迁移文件并维护实体与 DDL 同步，当前规模收益低。

### SSL

- **选定：JDBC URL 追加 `?sslmode=${PG_SSL_MODE:prefer}`**，本地默认不变；生产设 `PG_SSL_MODE=require`（传输加密、不校验证书）。
- 理由：Render 免费实例出口 IP 动态，`verify-full` 需要固定 CA/出口，免费档易踩坑；`require` 已满足加密诉求。

## 三、代码改动清单

| 文件 | 改动 |
|------|------|
| `backend/src/main/resources/application.yml` | datasource URL 追加 `?sslmode=${PG_SSL_MODE:prefer}`，其余不变 |
| `backend/src/main/resources/application-prod.yml` | `hibernate.ddl-auto: validate` → `update`；删除冗余的 `database-platform` 覆盖（继承 application.yml 的 PostgreSQLDialect） |
| `backend/src/main/resources/data.sql` | 不改 |
| `backend/src/main/java/com/teambrain/config/MockDataSeeder.java` | 不改 |
| `docs/ca_013929.pem` | 旧证书，不提交、不使用；Aiven 证书从控制台重新获取 |

> 说明：`spring.sql.init.mode: always` + `defer-datasource-initialization: true` 已保证 data.sql 在 Hibernate 建表之后执行（沿用现有配置，无需改动）。

## 四、控制台操作（用户执行，非代码）

### Aiven 侧（服务新建后）

1. 开启 **Public 访问**（服务不能是仅内网/仅 VPC 模式）。
2. **IP allowlist 留空**（放行所有公网 IP）。Render 免费实例出口 IP 动态，设置白名单会导致随机断连——这是本迁移的关键连通点。
3. 从控制台连接信息中拆出 `HOST / PORT / DB / USER / PASSWORD`（连接串形如 `postgresql://USER:PASS@HOST:PORT/DB?sslmode=require`）。
4. 如有需要，下载新的 Aiven CA 证书（当前默认不校验证书，可不下载）。

### Render 侧

5. 在 Render 的**后端 Web Service**（运行 jar 的应用）环境变量中设置：
   - `PG_HOST` / `PG_PORT` / `PG_DATABASE` / `PG_USER` / `PG_PASSWORD` → Aiven 的值
   - `PG_SSL_MODE=require`
   - （保留既有 `JWT_SECRET`）
6. Redeploy 触发新构建。
7. 验证新库跑通后，可下线旧的 Render PostgreSQL 服务（先确认不再被引用）。

## 五、验证

代码改完后（Aiven 已就绪并配好环境变量时）：

1. 本地以 `PG_*` 指向 Aiven + `SPRING_PROFILES_ACTIVE=prod` 启动，确认：
   - 应用成功启动（不再 `missing table` 崩溃）
   - 表自动创建齐全
   - `curl` 登录 admin/admin123 成功
   - admin + 影视飓风 + 8 个演示团队均有节点/连接数据
2. Render redeploy 后访问 https://teambrain.onrender.com 复测登录、团队切换、节点展示无报错。

## 六、风险与边界

- `update` 无法处理删列/改约束这类破坏性 DDL；本项目当前无此需求。
- 切换瞬间 Aiven 库为空，先自建再对外；此前注册的临时账号不会保留（已确认可接受）。
- Aiven 免费档存在资源上限/可能的休眠，若连接慢或中断，依据 Render 日志再调（如换付费档、加连接池参数）。
