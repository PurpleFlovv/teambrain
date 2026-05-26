# TeamBrain 部署设计与安全修复

## 概述

将 TeamBrain 部署到公网用于研究生面试展示。采用**方案 A**（最小改动），架构为 Render（后端+前端 JAR）+ Aiven（MySQL）。

## 架构

```
用户浏览器
    │
    ▼
┌──────────────────────┐
│  Render Web Service  │
│  Docker 容器         │
│  ┌────────────────┐  │
│  │  前端 React     │  │  ← 打包在 JAR /static
│  │  后端 Spring    │  │
│  └───────┬────────┘  │
└──────────┼───────────┘
           │ MySQL SSL
           ▼
┌──────────────────────┐
│  Aiven for MySQL     │
│  tb-mysql-teambrain  │
│  .h.aivencloud.com   │
└──────────────────────┘
```

## 平台信息

- **Aiven**: host=tb-mysql-teambrain.h.aivencloud.com, port=13660, user=avnadmin
- **Render**: 已连接 GitHub 仓库 git@github.com:PurpleFlovv/teambrain.git
- **GitHub**: PurpleFlovv/teambrain

## 代码修改（6项）

### 1. application.yml — 数据库 + JWT 环境变量化
- 数据库连接改为 Aiven 地址，SSL 开启
- JWT secret 改为 `${JWT_SECRET}` 环境变量

### 2. application-prod.yml — 新建生产配置
- SSL 模式 REQUIRED
- JPA ddl-auto 改为 validate（生产不自动建表）

### 3. CorsConfig.java — 限制来源
- 从 `*` 改为 Render 分配的具体域名

### 4. build.sh — 移除硬编码路径
- JAVA_HOME 和 Maven 路径改为环境变量检测

### 5. Dockerfile — 容器化
- 基于 eclipse-temurin:21-jre
- 拷贝 JAR 和 Aiven CA 证书
- 暴露 8080 端口

### 6. ca.pem — Aiven SSL 证书
- 放入 backend/src/main/resources/，Docker 构建时拷贝到镜像

## 安全修复（方案 A）

| # | 优先级 | 问题 | 修复 |
|---|--------|------|------|
| 1 | 高 | JWT 密钥硬编码 + 弱密钥 | `${JWT_SECRET}` 环境变量 |
| 2 | 高 | CORS 允许所有来源 + 凭据 | 限制 Render 域名 |
| 3 | 高 | 默认管理员 admin/admin123 | 部署后提示修改 |
| 4 | 中 | build.sh 硬编码路径 | 改为环境变量 |
| 5 | 中 | CSRF 关闭 | 保留（无状态 JWT API），方案 B 加 Referer 校验 |
| 6 | 低 | 无速率限制 | 方案 B 处理 |
| 7 | 待查 | 依赖漏洞 | npm audit + Maven OWASP check |

## 部署流程

1. 本地修改代码（本次会话）
2. 用 build.sh 构建 JAR
3. Docker build → 本地验证
4. git push 到 GitHub
5. Render 自动构建 Docker 镜像并部署
6. 验证公网可访问

## 方案 B 预留（后续）

- 速率限制（Spring Rate Limiter）
- 安全响应头（Helmet 等价配置）
- 日志与健康检查端点
- CSRF Referer 校验
- 依赖版本全面升级
