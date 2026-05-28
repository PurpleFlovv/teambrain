# TeamBrain — 团队组织可视化工具

将团队结构建模为可交互的 3D 脑图，直观展示成员、项目和协作关系。

## 在线演示

https://teambrain.onrender.com

## 技术栈

- **后端**：Java 21 + Spring Boot 3.4 + Spring Security (JWT)
- **前端**：React 18 + Vite + Three.js + Tailwind CSS
- **数据库**：PostgreSQL
- **部署**：Docker + Render

## 本地运行

### 前置条件

- Java 21+
- Maven 3.9+
- Node.js 18+
- PostgreSQL（或使用 Docker）

### 步骤

1. 创建 PostgreSQL 数据库：
```sql
CREATE DATABASE teambrain;
```

2. 配置环境变量：
```bash
export PG_HOST=localhost
export PG_PORT=5432
export PG_DATABASE=teambrain
export PG_USER=你的数据库用户
export PG_PASSWORD=你的数据库密码
export JWT_SECRET=一个随机的JWT密钥
```

3. 构建并运行：
```bash
cd frontend && npm install && npm run build
cd ../backend
rm -rf src/main/resources/static/*
mkdir -p src/main/resources/static
cp -r ../frontend/dist/* src/main/resources/static/
mvn clean package -DskipTests
java -jar target/teambrain-0.0.1.jar
```

4. 访问 http://localhost:8080

### Docker 运行

```bash
docker build -t teambrain .
docker run -p 8080:8080 \
  -e PG_HOST=host.docker.internal \
  -e PG_PORT=5432 \
  -e PG_DATABASE=teambrain \
  -e PG_USER=你的数据库用户 \
  -e PG_PASSWORD=你的数据库密码 \
  -e JWT_SECRET=一个随机的JWT密钥 \
  teambrain
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## 项目结构

```
├── backend/          # Spring Boot 后端
│   └── src/main/java/com/teambrain/
│       ├── config/        # 安全、JWT、数据初始化
│       ├── controller/    # REST API 控制器
│       ├── dto/           # 数据传输对象
│       ├── entity/        # JPA 实体
│       ├── repository/    # 数据访问层
│       ├── service/       # 业务逻辑层
│       └── util/          # 工具类
├── frontend/         # React 前端
│   └── src/
│       ├── components/    # UI 组件
│       ├── context/       # React Context
│       ├── pages/         # 页面组件
│       └── services/      # API 服务
├── util_scripts/     # 数据生成工具脚本
├── build.sh          # 构建脚本
└── Dockerfile        # Docker 构建文件
```

## GitHub

https://github.com/PurpleFlovv/teambrain



注：为方便部署到公网，数据库已由MySQL更改为PostgreSQL
