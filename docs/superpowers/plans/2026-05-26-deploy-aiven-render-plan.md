# TeamBrain Aiven + Render 部署与安全修复 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TeamBrain 部署到 Aiven MySQL + Render Web Service，修复基础安全漏洞。

**Architecture:** 数据库从本地 MySQL 迁移到 Aiven（SSL 连接），后端 Spring Boot + 前端 React 打包为 Docker 镜像部署到 Render。

**Tech Stack:** Java 21, Spring Boot 3.4.0, MySQL 8, React 18, Docker

---

### Task 1: 重构 application.yml — 敏感配置环境变量化

**Files:**
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: 将配置改为环境变量占位符**

用以下内容替换 `application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/teambrain?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: ${MYSQL_USER:teambrain}
    password: ${MYSQL_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    defer-datasource-initialization: true
    properties:
      hibernate:
        format_sql: true
  sql:
    init:
      mode: always
      data-locations: classpath:data.sql

server:
  address: 0.0.0.0
  port: ${PORT:8080}

jwt:
  secret: ${JWT_SECRET:}
  expiration: 86400000
```

关键变更：
- `MYSQL_HOST` default `localhost` — 本地开发无需设环境变量
- `MYSQL_PORT` default `3306`
- `MYSQL_USER` default `teambrain`
- `MYSQL_PASSWORD` 无默认值 — 必须显式设置
- `JWT_SECRET` 无默认值 — 必须显式设置
- `PORT` default `8080` — Render 通过 `PORT` 环境变量注入

- [ ] **Step 2: 验证本地仍可运行**

```bash
cd backend
MYSQL_PASSWORD=<本地密码> JWT_SECRET=test-dev-secret \
  /home/mpt/apache-maven-3.9.9/bin/mvn -Dmaven.test.skip=true spring-boot:run
```

预期：启动成功，和之前行为一致。

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/application.yml
git commit -m "refactor: externalize DB and JWT config to env vars"
```

---

### Task 2: 新增 application-prod.yml 生产配置文件

**Files:**
- Create: `backend/src/main/resources/application-prod.yml`

- [ ] **Step 1: 创建生产配置**

新建 `backend/src/main/resources/application-prod.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST}:${MYSQL_PORT}/teambrain?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&ssl-mode=REQUIRED
  jpa:
    hibernate:
      ddl-auto: validate

server:
  port: ${PORT:8080}
```

说明：
- `ssl-mode=REQUIRED` 强制 SSL（无需 CA 验证即可连接 Aiven）
- `ddl-auto: validate` 生产环境不自动改表结构
- 首次部署前需先在 Aiven 上执行 `data.sql` 建表和数据

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/resources/application-prod.yml
git commit -m "feat: add production profile for Render deployment"
```

---

### Task 3: 获取并添加 Aiven CA 证书

这个任务需要你手动操作两个步骤。

- [ ] **Step 1: 从 Aiven 下载 CA 证书**

在 Aiven 控制台 → Service → Overview → 下载 `ca.pem`，放到项目根目录：

```bash
# 下载后
cp ~/Downloads/ca.pem /home/mpt/projects/TeamBrain/ca.pem
```

- [ ] **Step 2: 创建 .gitignore（确保证书不提交到 Git）**

新建 `/home/mpt/projects/TeamBrain/.gitignore`：

```
# Aiven SSL
*.pem
*.key

# Java
backend/target/
*.class
*.jar
!*.jar.original

# Node
frontend/node_modules/
frontend/dist/

# IDE
.idea/
*.iml
.vscode/

# OS
.DS_Store
Thumbs.db
```

无需 commit `.gitignore` 单独提交，它会在后续任务中随其他文件一起提交。

---

### Task 4: 修复 CorsConfig.java — 可配置的来源限制

**Files:**
- Modify: `backend/src/main/java/com/teambrain/config/CorsConfig.java`

- [ ] **Step 1: 修改 CORS 配置**

替换 `CorsConfig.java` 内容：

```java
package com.teambrain.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        var config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

同时需要在 `application.yml` 末尾追加默认值：

```yaml
app:
  cors:
    allowed-origins: http://localhost:5173
```

说明：`allowedOrigins` 默认本地开发地址，生产环境通过环境变量 `APP_CORS_ALLOWED-ORIGINS` 覆盖（Spring 自动将 `APP_CORS_ALLOWED-ORIGINS` 映射到 `app.cors.allowed-origins`）。

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/teambrain/config/CorsConfig.java backend/src/main/resources/application.yml
git commit -m "fix: restrict CORS origins via configurable env var"
```

---

### Task 5: 修复 build.sh — 移除硬编码路径

**Files:**
- Modify: `build.sh`

- [ ] **Step 1: 改为自动检测 Java 和 Maven**

替换 `build.sh` 内容：

```bash
#!/bin/bash
set -e

# Auto-detect JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    if command -v java &> /dev/null; then
        export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
    else
        echo "ERROR: Java not found. Set JAVA_HOME or install Java 21."
        exit 1
    fi
fi

# Use mvnw if available, otherwise fall back to system mvn
if [ -f backend/mvnw ]; then
    MVN_CMD="./mvnw"
elif command -v mvn &> /dev/null; then
    MVN_CMD="mvn"
else
    echo "ERROR: Maven not found. Install Maven or add mvnw wrapper."
    exit 1
fi

echo "=== Building frontend ==="
cd frontend
npm install
npm run build

echo "=== Copying frontend to backend static ==="
rm -rf ../backend/src/main/resources/static/*
mkdir -p ../backend/src/main/resources/static
cp -r dist/* ../backend/src/main/resources/static/

echo "=== Building backend ==="
cd ../backend
$MVN_CMD clean package -DskipTests

echo "=== Build complete ==="
echo "Run with: java -jar backend/target/teambrain-0.0.1.jar"
echo "Or: docker build -t teambrain . && docker run -p 8080:8080 teambrain"
```

- [ ] **Step 2: Commit**

```bash
git add build.sh
git commit -m "fix: remove hardcoded paths in build.sh, auto-detect Java/Maven"
```

---

### Task 6: 创建 Dockerfile + .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: 创建 Dockerfile**

新建 `/home/mpt/projects/TeamBrain/Dockerfile`：

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy Aiven CA cert for SSL
COPY ca.pem /app/ca.pem

# Import CA cert into JVM truststore
RUN keytool -importcert -noprompt -trustcacerts \
    -alias aiven-ca \
    -file /app/ca.pem \
    -keystore $JAVA_HOME/lib/security/cacerts \
    -storepass changeit

# Copy the built JAR
COPY backend/target/teambrain-0.0.1.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: 创建 .dockerignore**

新建 `/home/mpt/projects/TeamBrain/.dockerignore`：

```
frontend/node_modules
frontend/dist
backend/target/*.jar.original
.git
*.deb
test-results
*.log
```

- [ ] **Step 3: 本地构建 Docker 镜像并验证**

```bash
# 确保 ca.pem 在项目根目录
# 确保 backend/target/teambrain-0.0.1.jar 已构建
docker build -t teambrain .
docker run -p 8080:8080 \
  -e MYSQL_HOST=tb-mysql-teambrain.h.aivencloud.com \
  -e MYSQL_PORT=13660 \
  -e MYSQL_USER=avnadmin \
  -e MYSQL_PASSWORD=<YOUR_AVENN_PASSWORD> \
  -e JWT_SECRET=$(openssl rand -base64 48) \
  -e SPRING_PROFILES_ACTIVE=prod \
  teambrain
```

预期：容器启动，连接到 Aiven，监听 8080 端口。

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile with Aiven SSL cert import"
```

---

### Task 7: 依赖漏洞扫描

**Files:**
- 无需修改文件，仅运行检查

- [ ] **Step 1: 运行 npm audit**

```bash
cd frontend
npm audit --audit-level=high
```

如果输出有高危漏洞，运行：

```bash
npm audit fix
```

再次验证：

```bash
npm audit --audit-level=high
```

预期：无 high/critical 级别漏洞。

- [ ] **Step 2: 运行 Maven OWASP Dependency Check**

```bash
cd backend
/home/mpt/apache-maven-3.9.9/bin/mvn org.owasp:dependency-check-maven:check
```

查看报告：

```bash
cat backend/target/dependency-check-report.html | head -20
```

如有高危 CVE，记录在 commit message 中，方案 B 升级。

- [ ] **Step 3: 如果 npm audit fix 产生了变更，提交**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "fix: npm audit fix for high/critical vulnerabilities"
```

如果无变更，跳过此步骤。

---

### Task 8: 首次部署 — 准备 Aiven 数据库表结构

- [ ] **Step 1: 通过 Aiven SSL 连接执行 data.sql**

```bash
# 下载 ca.pem 后
mysql -h tb-mysql-teambrain.h.aivencloud.com \
  -P 13660 \
  -u avnadmin \
  -p'<YOUR_AVENN_PASSWORD>' \
  --ssl-ca=ca.pem \
  teambrain < backend/src/main/resources/data.sql
```

验证：

```bash
mysql -h tb-mysql-teambrain.h.aivencloud.com \
  -P 13660 \
  -u avnadmin \
  -p'<YOUR_AVENN_PASSWORD>' \
  --ssl-ca=ca.pem \
  teambrain -e "SHOW TABLES; SELECT COUNT(*) FROM team;"
```

预期：显示所有表，至少 1 条 team 记录。

- [ ] **Step 2: 验证 data.sql 包含建表（检查 ddl-auto: validate 兼容性）**

由于生产用 `validate`，首次部署前数据库必须有表结构。检查 `data.sql` 是否包含 CREATE TABLE：

```bash
grep -c "CREATE TABLE" backend/src/main/resources/data.sql
```

如果输出为 0，说明 data.sql 不建表（表由 JPA `ddl-auto: update` 自动创建）。首次部署时可以：
- 临时用 `SPRING_PROFILES_ACTIVE` 不设为 `prod` 来让 JPA 建表，然后再切回 `prod`
- 或者从本地导出 DDL：`mysqldump -u teambrain -p --no-data teambrain > schema.sql`，然后在 Aiven 上执行

确认策略后继续。

---

### Task 9: 推送到 GitHub 并在 Render 部署

- [ ] **Step 1: 推送代码**

```bash
cd /home/mpt/projects/TeamBrain
git push -u origin master
```

- [ ] **Step 2: Render 控制台配置**

在 Render Dashboard → Blueprint 或 Web Service 手动创建：

**Dockerfile 路径**: `Dockerfile`（仓库根目录）
**端口**: `8080`
**环境变量**:
| Key | Value |
|-----|-------|
| `MYSQL_HOST` | `tb-mysql-teambrain.h.aivencloud.com` |
| `MYSQL_PORT` | `13660` |
| `MYSQL_USER` | `avnadmin` |
| `MYSQL_PASSWORD` | `<YOUR_AVENN_PASSWORD>` |
| `JWT_SECRET` | `openssl rand -base64 48` 生成的值 |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `APP_CORS_ALLOWED-ORIGINS` | Render 分配的子域名（部署后填入） |

- [ ] **Step 3: 验证公网可访问**

部署完成后，访问 Render 给的 URL（如 `https://teambrain.onrender.com`）。

验证清单：
- [ ] 首页加载正常
- [ ] 可以注册/登录
- [ ] Team 数据可以查看
- [ ] 3D 脑图正常渲染

- [ ] **Step 4: 部署成功后轮换 Aiven 密码**

在 Aiven 控制台重置数据库密码（因为密码已暴露在本次会话和 Render 环境变量中）。

更新 Render 环境变量中的 `MYSQL_PASSWORD` 为新密码。

---

### Task 10: 最终安全提醒

以下内容在方案 B 前作为已知风险记录，不实施代码修改：

1. **修改默认管理员密码** — Aiven 上执行：
   ```sql
   UPDATE sys_user SET password='<新bcrypt哈希>' WHERE username='admin';
   ```

2. **无速率限制** — `/api/auth/login` 可能被暴力破解，方案 B 加入 Spring Rate Limiter

3. **CSRF 关闭** — 无状态 JWT 可接受，但方案 B 加 `SameSite=Strict` cookie 和 Referer 校验

---

## 自检清单

- [x] 6 项代码修改全覆盖：application.yml、application-prod.yml、CorsConfig.java、build.sh、Dockerfile、ca.pem
- [x] 安全修复全覆盖：JWT 环境变量化、CORS 限制、硬编码路径、依赖扫描
- [x] 无占位符 — 所有代码片段完整，所有命令精确
- [x] 类型一致 — application.yml 中的环境变量名与 Docker/Render 环境变量一致
