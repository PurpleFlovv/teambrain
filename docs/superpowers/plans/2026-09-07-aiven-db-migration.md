# TeamBrain 数据库迁移到 Aiven 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让生产环境能对着一个**全新的空 PostgreSQL（Aiven）**一键自引导（Hibernate 建表 → data.sql 种子 → MockDataSeeder 演示团队），并让 JDBC 走显式可配的 TLS，从而把数据库从 Render 托管切换到 Aiven。

**Architecture:** 改动仅为 Spring 配置。`application.yml` 的 datasource URL 追加 `?sslmode=${PG_SSL_MODE:prefer}`；`application-prod.yml` 删除 `datasource.url` 与 `database-platform` 两处重复覆盖，并把 `ddl-auto: validate` 改为 `update`，让空库首次启动由 Hibernate 建表。种子逻辑（`data.sql`、`MockDataSeeder`、`DataInitializer`）不改，仍按 `defer-datasource-initialization: true` 在建表后执行。部署与连通性通过 Render/Aiven 控制台完成。

**Tech Stack:** Spring Boot 3.4 / Hibernate 6.6 / PostgreSQL 驱动 / Render / Aiven for PostgreSQL

**关联设计文档:** `docs/superpowers/specs/2026-09-07-aiven-db-migration-design.md`

## Global Constraints

- 只允许改两个配置文件：`backend/src/main/resources/application.yml`、`backend/src/main/resources/application-prod.yml`；**不得**改动任何 `.java`、`data.sql`、前端代码。
- `spring.sql.init.mode: always` + `defer-datasource-initialization: true` + `continue-on-error: true` 维持现状，禁止改动。
- 生产 profile 名称保持 `prod`（Render 上由 `SPRING_PROFILES_ACTIVE=prod` 激活）。
- 生产服务仍监听 `${PORT:8080}`；`JWT_SECRET` 仍是必需环境变量。
- SSL 行为：未设置 `PG_SSL_MODE` 时保持原有 `prefer`（本地不变）；切到 Aiven 时由用户在 Render 环境变量设 `PG_SSL_MODE=require`。
- 环境事实（影响验证方式）：本机有 Java 21，但**无 mvn、无 docker、无 psql、无运行中的 PostgreSQL**；因此空库冒烟无法在本沙箱直接执行，见 Task 3 的目标库选项。

---

### Task 1: 修改生产数据库配置（空库自引导 + 显式 TLS）

**Files:**
- Modify: `backend/src/main/resources/application.yml:3`（datasource url 追加 sslmode 参数）
- Modify: `backend/src/main/resources/application-prod.yml`（整文件重写为精简版）

**Interfaces:**
- Consumes: 无（纯配置改动）
- Produces: 生产 profile 在空库上能自建 schema；`PG_SSL_MODE` 环境变量成为可用的连接开关

- [ ] **Step 1: 修改 `application.yml` 数据源 URL**

将 `application.yml` 第 3 行：

```yaml
    url: jdbc:postgresql://${PG_HOST:localhost}:${PG_PORT:5432}/${PG_DATABASE:teambrain}
```

改为（仅追加 `?sslmode=${PG_SSL_MODE:prefer}`，其余不动）：

```yaml
    url: jdbc:postgresql://${PG_HOST:localhost}:${PG_PORT:5432}/${PG_DATABASE:teambrain}?sslmode=${PG_SSL_MODE:prefer}
```

- [ ] **Step 2: 重写 `application-prod.yml`**

当前内容：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${PG_HOST}:${PG_PORT:5432}/${PG_DATABASE:teambrain}
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate

server:
  port: ${PORT:8080}
```

替换为（删除重复的 `datasource.url` 覆盖与 `database-platform` 覆盖，`ddl-auto` 改为 `update`；URL/方言从 `application.yml` 继承）：

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update

server:
  port: ${PORT:8080}
```

- [ ] **Step 3: 静态校验改动符合预期**

Run（三处断言都应命中对应内容，否则回查）：

```bash
grep -n "sslmode=\${PG_SSL_MODE:prefer}" backend/src/main/resources/application.yml
grep -n "ddl-auto: update" backend/src/main/resources/application-prod.yml
! grep -nE "validate|database-platform|jdbc:postgresql" backend/src/main/resources/application-prod.yml
```

Expected:
- 第 1 条输出 `application.yml` 中带 `sslmode` 的那一行；
- 第 2 条输出 `application-prod.yml:3  ddl-auto: update`（或相应行号）；
- 第 3 条**无任何输出**（`grep -v` 命中即失败）。

- [ ] **Step 4: 编译打包不破坏构建**

本机无 mvn，改用 Dockerfile 同路径验证不可行 → 至少确保资源文件是合法 YAML。Run（用 python 快速校验 YAML 语法，若环境无 pyyaml 则跳过）：

```bash
python3 - <<'PY'
import yaml
for f in ("backend/src/main/resources/application.yml", "backend/src/main/resources/application-prod.yml"):
    with open(f) as fh:
        data = yaml.safe_load(fh)
    print(f, "OK, top keys:", list(data.keys()))
PY
```

Expected: 两个文件都打印 `OK`，无解析异常。若 `yaml` 模块缺失，直接 Read 两个文件人工核对缩进与键值。

- [ ] **Step 5: 提交配置改动 + 设计文档**

```bash
git add backend/src/main/resources/application.yml \
        backend/src/main/resources/application-prod.yml \
        docs/superpowers/specs/2026-09-07-aiven-db-migration-design.md
git commit -m "fix: prod self-bootstraps empty DB (ddl-auto update) and explicit sslmode

Empty Aiven/Render database previously crashed startup because prod used
ddl-auto: validate while data.sql only seeds. Switch prod to ddl-auto:
update so Hibernate creates tables on first boot; data.sql and
MockDataSeeder then populate. Add ?sslmode=\${PG_SSL_MODE:prefer} to the
JDBC URL so TLS can be toggled via env for Aiven (require)."
```

---

### Task 2: 空库启动冒烟（门禁——需要一个可达的空 PostgreSQL 目标）

**Files:**（无代码改动；纯验证）
- 运行对象：`backend/target/teambrain-0.0.1.jar`（由 Render 或 `./build.sh` 构建出）

**前置条件:** 存在一个**空的** PostgreSQL（schema 全空，无任何表）。二者选一：
- **A. Aiven 新服务（首选，与生产一致）**——用户已在其上创建 Aiven PostgreSQL；
- B. 本机临时 PostgreSQL——需要 mvn/docker，本沙箱不可用，供在用户机器复现：`docker run -d --name tb-pg -e POSTGRES_USER=teambrain -e POSTGRES_PASSWORD=teambrain -e POSTGRES_DB=teambrain -p 5432:5432 postgres:16`

- [ ] **Step 1: 用空库 + prod profile 启动应用**

以选项 A 为例，导出环境后启动（选项 B 时把 `PG_SSL_MODE` 留空或 `prefer`，因本地 PG 常无 TLS）：

```bash
export PG_HOST=<AIVEN_HOST>
export PG_PORT=<AIVEN_PORT>          # 常为 5432，以连接串为准
export PG_DATABASE=defaultdb         # 以连接串库名为准
export PG_USER=<AIVEN_USER>
export PG_PASSWORD='<AIVEN_PASSWORD>'
export PG_SSL_MODE=require
export JWT_SECRET=$(head -c 32 /dev/urandom | base64)
export SPRING_PROFILES_ACTIVE=prod
java -jar backend/target/teambrain-0.0.1.jar
```

Expected（决定性断言，**不再出现** `SchemaManagementException: missing table`）：
- 日志出现 `Started TeamBrainApplication`；
- 日志出现 `Mock data seeded: 8 teams, 18 users`（演示团队生成完成）；
- 无 `Exited with status 1`。

- [ ] **Step 2: 验证种子数据与登录**

新开终端，等应用起来后：

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: 返回 JSON 含 `token` 字段（HTTP 200）。
再确认 8 个演示团队存在（需带 `Authorization: Bearer <token>`，接口以登录返回 token 为准校验一次即可）：查询任意可见团队数据均不报 500。

- [ ] **Step 3: 停掉本地验证实例（如为本地临时 PG）**

```bash
# 若用了选项 B 的临时容器
docker rm -f tb-pg
```

- [ ] **Step 4: 记录冒烟结果**

在任务输出里记录：启动是否成功、登录是否返回 token、是否出现报错。结果不通过则回到 Task 1 复查配置。

---

### Task 3: Render 切换与上线后复测（用户手动执行，非代码）

**Files:**（无）

- [ ] **Step 1: Aiven 控制台确保公网连通**
  1. 服务开启 **Public 访问**（不能仅内网/VPC）。
  2. **IP allowlist 留空**（放行所有）。Render 免费实例出口 IP 动态，白名单会导致随机断连。
  3. 记下 `HOST/PORT/DB/USER/PASSWORD`。

- [ ] **Step 2: Render 后端 Web Service 环境变量切到 Aiven**
  设 `PG_HOST`、`PG_PORT`、`PG_DATABASE`、`PG_USER`、`PG_PASSWORD` 为 Aiven 值，新增 `PG_SSL_MODE=require`，保留 `JWT_SECRET` 与 `SPRING_PROFILES_ACTIVE=prod`。

- [ ] **Step 3: Redeploy 并复测线上**
  访问 https://teambrain.onrender.com ：admin/admin123 登录、影视飓风节点可见、8 个演示团队有节点/连接、无报错。确认后可将旧 Render PostgreSQL 服务下线。

---
