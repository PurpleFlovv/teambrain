# TeamBrain 全栈系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于现有 3D 脑部可视化前端，构建完整的 Spring Boot + React 全栈系统，实现坐标空间脑区分区、用户认证、团队管理。

**Architecture:** Spring Boot 三层架构提供 REST API，JWT 无状态认证，React 前端接管 Three.js 渲染与用户交互。前后端整合部署为单一 jar 包。

**Tech Stack:** Spring Boot 3.4, Spring Security, Spring Data JPA, jjwt, MySQL 8, React 18, Vite 5, Three.js 0.183, Tailwind CSS 3.4

---

### Task 1: 初始化 Spring Boot 项目

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/teambrain/TeamBrainApplication.java`

- [ ] **Step 1: 创建 pom.xml**

在 `backend/pom.xml` 中创建：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.0</version>
    </parent>
    <groupId>com.teambrain</groupId>
    <artifactId>teambrain</artifactId>
    <version>0.0.1</version>
    <name>TeamBrain</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/teambrain?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  sql:
    init:
      mode: always
      data-locations: classpath:data.sql

server:
  port: 8080

jwt:
  secret: teambrain-jwt-secret-key-2026-this-is-a-course-project
  expiration: 86400000
```

- [ ] **Step 3: 创建启动类**

```java
package com.teambrain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TeamBrainApplication {
    public static void main(String[] args) {
        SpringApplication.run(TeamBrainApplication.class, args);
    }
}
```

- [ ] **Step 4: 构建测试**

```bash
cd backend && mvn compile
```
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
cd /home/mpt/projects/TeamBrain && git add backend/pom.xml backend/src/main/resources/application.yml backend/src/main/java/com/teambrain/TeamBrainApplication.java && git commit -m "feat: initialize Spring Boot project with dependencies"
```

---

### Task 2: 创建 JPA 实体类

**Files:**
- Create: `backend/src/main/java/com/teambrain/entity/User.java`
- Create: `backend/src/main/java/com/teambrain/entity/Role.java`
- Create: `backend/src/main/java/com/teambrain/entity/Team.java`
- Create: `backend/src/main/java/com/teambrain/entity/BrainRegion.java`
- Create: `backend/src/main/java/com/teambrain/entity/BrainPoint.java`
- Create: `backend/src/main/java/com/teambrain/entity/TeamNode.java`
- Create: `backend/src/main/java/com/teambrain/entity/NodeConnection.java`

- [ ] **Step 1: 创建 User.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sys_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 100)
    private String email;

    private Boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "sys_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    public User() {}

    public User(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
}
```

- [ ] **Step 2: 创建 Role.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sys_role")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String name;

    public Role() {}

    public Role(String name) { this.name = name; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

- [ ] **Step 3: 创建 Team.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "team")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String teamName;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Team() {}

    public Team(String teamName, String description, User user) {
        this.teamName = teamName;
        this.description = description;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
```

- [ ] **Step 4: 创建 BrainRegion.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "brain_region")
public class BrainRegion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 7)
    private String colorHex;

    private Integer sortOrder;

    public BrainRegion() {}

    public BrainRegion(String name, String colorHex, Integer sortOrder) {
        this.name = name;
        this.colorHex = colorHex;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
```

- [ ] **Step 5: 创建 BrainPoint.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "brain_point")
public class BrainPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brain_region_id", nullable = false)
    private BrainRegion brainRegion;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double z;

    public BrainPoint() {}

    public BrainPoint(BrainRegion brainRegion, Double x, Double y, Double z) {
        this.brainRegion = brainRegion;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BrainRegion getBrainRegion() { return brainRegion; }
    public void setBrainRegion(BrainRegion brainRegion) { this.brainRegion = brainRegion; }
    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }
    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }
    public Double getZ() { return z; }
    public void setZ(Double z) { this.z = z; }
}
```

- [ ] **Step 6: 创建 TeamNode.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "team_node")
public class TeamNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brain_region_id", nullable = false)
    private BrainRegion brainRegion;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NodeType nodeType;

    public enum NodeType { MEMBER, PROJECT }

    public TeamNode() {}

    public TeamNode(Team team, BrainRegion brainRegion, String name, String description, NodeType nodeType) {
        this.team = team;
        this.brainRegion = brainRegion;
        this.name = name;
        this.description = description;
        this.nodeType = nodeType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public BrainRegion getBrainRegion() { return brainRegion; }
    public void setBrainRegion(BrainRegion brainRegion) { this.brainRegion = brainRegion; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public NodeType getNodeType() { return nodeType; }
    public void setNodeType(NodeType nodeType) { this.nodeType = nodeType; }
}
```

- [ ] **Step 7: 创建 NodeConnection.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "node_connection")
public class NodeConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_node_id", nullable = false)
    private TeamNode fromNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_node_id")
    private TeamNode toNode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TargetType targetType;

    @Column(nullable = false, length = 30)
    private String connectionType;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Column(nullable = false)
    private Double lineWidth;

    @Column(nullable = false, length = 7)
    private String flowColorHex;

    @Column(nullable = false)
    private Double opacity;

    public enum TargetType { SINGLE, ALL }

    public NodeConnection() {}

    // getters and setters (compact for plan brevity)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public TeamNode getFromNode() { return fromNode; }
    public void setFromNode(TeamNode fromNode) { this.fromNode = fromNode; }
    public TeamNode getToNode() { return toNode; }
    public void setToNode(TeamNode toNode) { this.toNode = toNode; }
    public TargetType getTargetType() { return targetType; }
    public void setTargetType(TargetType targetType) { this.targetType = targetType; }
    public String getConnectionType() { return connectionType; }
    public void setConnectionType(String connectionType) { this.connectionType = connectionType; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public void setLineWidth(Double lineWidth) { this.lineWidth = lineWidth; }
    public String getFlowColorHex() { return flowColorHex; }
    public void setFlowColorHex(String flowColorHex) { this.flowColorHex = flowColorHex; }
    public Double getOpacity() { return opacity; }
    public void setOpacity(Double opacity) { this.opacity = opacity; }
}
```

- [ ] **Step 8: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 9: 提交**

```bash
git add backend/src/main/java/com/teambrain/entity/ && git commit -m "feat: add JPA entities for all 8 tables"
```

---

### Task 3: 创建 Repository 层

**Files:**
- Create: `backend/src/main/java/com/teambrain/repository/UserRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/RoleRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/TeamRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/BrainRegionRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/BrainPointRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/TeamNodeRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/NodeConnectionRepository.java`

- [ ] **Step 1: 创建全部 Repository**

```java
// UserRepository.java
package com.teambrain.repository;

import com.teambrain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
```

```java
// RoleRepository.java
package com.teambrain.repository;

import com.teambrain.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
```

```java
// TeamRepository.java
package com.teambrain.repository;

import com.teambrain.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByUserId(Long userId);
}
```

```java
// BrainRegionRepository.java
package com.teambrain.repository;

import com.teambrain.entity.BrainRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrainRegionRepository extends JpaRepository<BrainRegion, Long> {
    List<BrainRegion> findAllByOrderBySortOrderAsc();
}
```

```java
// BrainPointRepository.java
package com.teambrain.repository;

import com.teambrain.entity.BrainPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrainPointRepository extends JpaRepository<BrainPoint, Long> {
    List<BrainPoint> findByBrainRegionId(Long regionId);
}
```

```java
// TeamNodeRepository.java
package com.teambrain.repository;

import com.teambrain.entity.TeamNode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamNodeRepository extends JpaRepository<TeamNode, Long> {
    List<TeamNode> findByTeamId(Long teamId);
    List<TeamNode> findByTeamIdAndBrainRegionId(Long teamId, Long regionId);
}
```

```java
// NodeConnectionRepository.java
package com.teambrain.repository;

import com.teambrain.entity.NodeConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NodeConnectionRepository extends JpaRepository<NodeConnection, Long> {
    List<NodeConnection> findByTeamId(Long teamId);
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/com/teambrain/repository/ && git commit -m "feat: add JPA repositories"
```

---

### Task 4: 创建 DTO 类

**Files:**
- Create: `backend/src/main/java/com/teambrain/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/teambrain/dto/RegisterRequest.java`
- Create: `backend/src/main/java/com/teambrain/dto/LoginResponse.java`
- Create: `backend/src/main/java/com/teambrain/dto/TeamDto.java`
- Create: `backend/src/main/java/com/teambrain/dto/TeamNodeDto.java`
- Create: `backend/src/main/java/com/teambrain/dto/NodeConnectionDto.java`
- Create: `backend/src/main/java/com/teambrain/dto/BrainRegionDto.java`
- Create: `backend/src/main/java/com/teambrain/dto/BrainPointDto.java`

- [ ] **Step 1: 创建全部 DTO**

```java
// LoginRequest.java
package com.teambrain.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

```java
// RegisterRequest.java
package com.teambrain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;
    @NotBlank @Size(min = 6, max = 100)
    private String password;
    private String email;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

```java
// LoginResponse.java
package com.teambrain.dto;

public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private Long teamId;

    public LoginResponse(String token, Long userId, String username, Long teamId) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.teamId = teamId;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public Long getTeamId() { return teamId; }
}
```

```java
// TeamDto.java
package com.teambrain.dto;

public class TeamDto {
    private Long id;
    private String teamName;
    private String description;

    public TeamDto(Long id, String teamName, String description) {
        this.id = id;
        this.teamName = teamName;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getTeamName() { return teamName; }
    public String getDescription() { return description; }
}
```

```java
// TeamNodeDto.java
package com.teambrain.dto;

public class TeamNodeDto {
    private Long id;
    private String name;
    private String description;
    private String nodeType;
    private Long brainRegionId;
    private String brainRegionName;
    private String brainRegionColor;

    public TeamNodeDto(Long id, String name, String description, String nodeType,
                       Long brainRegionId, String brainRegionName, String brainRegionColor) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.nodeType = nodeType;
        this.brainRegionId = brainRegionId;
        this.brainRegionName = brainRegionName;
        this.brainRegionColor = brainRegionColor;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getNodeType() { return nodeType; }
    public Long getBrainRegionId() { return brainRegionId; }
    public String getBrainRegionName() { return brainRegionName; }
    public String getBrainRegionColor() { return brainRegionColor; }
}
```

```java
// NodeConnectionDto.java
package com.teambrain.dto;

public class NodeConnectionDto {
    private Long id;
    private Long fromNodeId;
    private String fromNodeName;
    private Long toNodeId;
    private String toNodeName;
    private String targetType;
    private String connectionType;
    private String colorHex;
    private Double lineWidth;
    private String flowColorHex;
    private Double opacity;

    public NodeConnectionDto(Long id, Long fromNodeId, String fromNodeName, Long toNodeId,
                             String toNodeName, String targetType, String connectionType,
                             String colorHex, Double lineWidth, String flowColorHex, Double opacity) {
        this.id = id;
        this.fromNodeId = fromNodeId;
        this.fromNodeName = fromNodeName;
        this.toNodeId = toNodeId;
        this.toNodeName = toNodeName;
        this.targetType = targetType;
        this.connectionType = connectionType;
        this.colorHex = colorHex;
        this.lineWidth = lineWidth;
        this.flowColorHex = flowColorHex;
        this.opacity = opacity;
    }

    // getters
    public Long getId() { return id; }
    public Long getFromNodeId() { return fromNodeId; }
    public String getFromNodeName() { return fromNodeName; }
    public Long getToNodeId() { return toNodeId; }
    public String getToNodeName() { return toNodeName; }
    public String getTargetType() { return targetType; }
    public String getConnectionType() { return connectionType; }
    public String getColorHex() { return colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public String getFlowColorHex() { return flowColorHex; }
    public Double getOpacity() { return opacity; }
}
```

```java
// BrainRegionDto.java
package com.teambrain.dto;

public class BrainRegionDto {
    private Long id;
    private String name;
    private String colorHex;
    private Integer sortOrder;

    public BrainRegionDto(Long id, String name, String colorHex, Integer sortOrder) {
        this.id = id;
        this.name = name;
        this.colorHex = colorHex;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getColorHex() { return colorHex; }
    public Integer getSortOrder() { return sortOrder; }
}
```

```java
// BrainPointDto.java
package com.teambrain.dto;

public class BrainPointDto {
    private Long regionId;
    private String regionName;
    private String colorHex;
    private double x;
    private double y;
    private double z;

    public BrainPointDto(Long regionId, String regionName, String colorHex, double x, double y, double z) {
        this.regionId = regionId;
        this.regionName = regionName;
        this.colorHex = colorHex;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Long getRegionId() { return regionId; }
    public String getRegionName() { return regionName; }
    public String getColorHex() { return colorHex; }
    public double getX() { return x; }
    public double getY() { return y; }
    public double getZ() { return z; }
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/com/teambrain/dto/ && git commit -m "feat: add DTO classes"
```

---

### Task 5: 实现 JWT 工具类和 Spring Security 配置

**Files:**
- Create: `backend/src/main/java/com/teambrain/util/JwtUtil.java`
- Create: `backend/src/main/java/com/teambrain/config/JwtAuthFilter.java`
- Create: `backend/src/main/java/com/teambrain/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/teambrain/config/CorsConfig.java`

- [ ] **Step 1: 创建 JwtUtil.java**

```java
package com.teambrain.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiration;

    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.expiration}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    public String generateToken(Long userId, String username, List<String> roles) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return getClaims(token).get("userId", Long.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return getClaims(token).get("roles", List.class);
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }
}
```

- [ ] **Step 2: 创建 JwtAuthFilter.java**

```java
package com.teambrain.config;

import com.teambrain.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                List<String> roles = jwtUtil.getRolesFromToken(token);
                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .toList();
                var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 3: 创建 SecurityConfig.java**

```java
package com.teambrain.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/brain/points", "/api/brain/regions").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 4: 创建 CorsConfig.java**

```java
package com.teambrain.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        var config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

- [ ] **Step 5: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/com/teambrain/util/ backend/src/main/java/com/teambrain/config/ && git commit -m "feat: add JWT auth and Spring Security config"
```

---

### Task 6: 实现认证服务

**Files:**
- Create: `backend/src/main/java/com/teambrain/service/AuthService.java`
- Create: `backend/src/main/java/com/teambrain/controller/AuthController.java`

- [ ] **Step 1: 创建 AuthService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.LoginRequest;
import com.teambrain.dto.LoginResponse;
import com.teambrain.dto.RegisterRequest;
import com.teambrain.entity.Role;
import com.teambrain.entity.Team;
import com.teambrain.entity.User;
import com.teambrain.repository.RoleRepository;
import com.teambrain.repository.TeamRepository;
import com.teambrain.repository.UserRepository;
import com.teambrain.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       TeamRepository teamRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("默认角色未配置"));
        user.setRoles(Set.of(userRole));
        user = userRepository.save(user);

        Team team = new Team(request.getUsername() + "的团队", "团队大脑", user);
        teamRepository.save(team);

        List<String> roles = List.of("USER");
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), team.getId());
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!user.getEnabled()) {
            throw new RuntimeException("账号已被禁用");
        }

        Team team = teamRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("团队未找到"));

        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), team.getId());
    }
}
```

- [ ] **Step 2: 创建 AuthController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.LoginRequest;
import com.teambrain.dto.LoginResponse;
import com.teambrain.dto.RegisterRequest;
import com.teambrain.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            LoginResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/AuthService.java backend/src/main/java/com/teambrain/controller/AuthController.java && git commit -m "feat: implement auth service and controller"
```

---

### Task 7: 实现业务服务层

**Files:**
- Create: `backend/src/main/java/com/teambrain/service/TeamService.java`
- Create: `backend/src/main/java/com/teambrain/service/TeamNodeService.java`
- Create: `backend/src/main/java/com/teambrain/service/ConnectionService.java`
- Create: `backend/src/main/java/com/teambrain/service/BrainRegionService.java`
- Create: `backend/src/main/java/com/teambrain/service/AdminService.java`

- [ ] **Step 1: 创建 TeamService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.TeamDto;
import com.teambrain.entity.Team;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public TeamDto getTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }

    public TeamDto updateTeam(Long id, String teamName, String description) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        if (teamName != null) team.setTeamName(teamName);
        if (description != null) team.setDescription(description);
        teamRepository.save(team);
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }
}
```

- [ ] **Step 2: 创建 TeamNodeService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.BrainRegion;
import com.teambrain.entity.Team;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.BrainRegionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamNodeService {

    private final TeamNodeRepository nodeRepository;
    private final TeamRepository teamRepository;
    private final BrainRegionRepository regionRepository;

    public TeamNodeService(TeamNodeRepository nodeRepository, TeamRepository teamRepository,
                           BrainRegionRepository regionRepository) {
        this.nodeRepository = nodeRepository;
        this.teamRepository = teamRepository;
        this.regionRepository = regionRepository;
    }

    public List<TeamNodeDto> getTeamNodes(Long teamId) {
        return nodeRepository.findByTeamId(teamId).stream()
                .map(n -> new TeamNodeDto(n.getId(), n.getName(), n.getDescription(),
                        n.getNodeType().name(), n.getBrainRegion().getId(),
                        n.getBrainRegion().getName(), n.getBrainRegion().getColorHex()))
                .toList();
    }

    public TeamNodeDto addNode(Long teamId, String name, String description,
                                String nodeType, Long brainRegionId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        BrainRegion region = regionRepository.findById(brainRegionId)
                .orElseThrow(() -> new RuntimeException("脑区不存在"));
        TeamNode node = new TeamNode(team, region, name, description,
                TeamNode.NodeType.valueOf(nodeType));
        node = nodeRepository.save(node);
        return new TeamNodeDto(node.getId(), node.getName(), node.getDescription(),
                node.getNodeType().name(), region.getId(), region.getName(), region.getColorHex());
    }

    public TeamNodeDto updateNode(Long nodeId, String name, String description,
                                   String nodeType, Long brainRegionId) {
        TeamNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("节点不存在"));
        if (name != null) node.setName(name);
        if (description != null) node.setDescription(description);
        if (nodeType != null) node.setNodeType(TeamNode.NodeType.valueOf(nodeType));
        if (brainRegionId != null) {
            BrainRegion region = regionRepository.findById(brainRegionId)
                    .orElseThrow(() -> new RuntimeException("脑区不存在"));
            node.setBrainRegion(region);
        }
        node = nodeRepository.save(node);
        return new TeamNodeDto(node.getId(), node.getName(), node.getDescription(),
                node.getNodeType().name(), node.getBrainRegion().getId(),
                node.getBrainRegion().getName(), node.getBrainRegion().getColorHex());
    }

    public void deleteNode(Long nodeId) {
        nodeRepository.deleteById(nodeId);
    }
}
```

- [ ] **Step 3: 创建 ConnectionService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.entity.NodeConnection;
import com.teambrain.entity.Team;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.NodeConnectionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectionService {

    private final NodeConnectionRepository connectionRepository;
    private final TeamNodeRepository nodeRepository;
    private final TeamRepository teamRepository;

    public ConnectionService(NodeConnectionRepository connectionRepository,
                             TeamNodeRepository nodeRepository, TeamRepository teamRepository) {
        this.connectionRepository = connectionRepository;
        this.nodeRepository = nodeRepository;
        this.teamRepository = teamRepository;
    }

    public List<NodeConnectionDto> getTeamConnections(Long teamId) {
        return connectionRepository.findByTeamId(teamId).stream()
                .map(c -> new NodeConnectionDto(c.getId(),
                        c.getFromNode().getId(), c.getFromNode().getName(),
                        c.getToNode() != null ? c.getToNode().getId() : null,
                        c.getToNode() != null ? c.getToNode().getName() : "*",
                        c.getTargetType().name(), c.getConnectionType(),
                        c.getColorHex(), c.getLineWidth(), c.getFlowColorHex(), c.getOpacity()))
                .toList();
    }

    public NodeConnectionDto addConnection(Long teamId, Long fromNodeId, Long toNodeId,
                                            String targetType, String connectionType,
                                            String colorHex, Double lineWidth,
                                            String flowColorHex, Double opacity) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        TeamNode fromNode = nodeRepository.findById(fromNodeId)
                .orElseThrow(() -> new RuntimeException("起始节点不存在"));
        TeamNode toNode = toNodeId != null ? nodeRepository.findById(toNodeId).orElse(null) : null;

        NodeConnection conn = new NodeConnection();
        conn.setTeam(team);
        conn.setFromNode(fromNode);
        conn.setToNode(toNode);
        conn.setTargetType(NodeConnection.TargetType.valueOf(targetType));
        conn.setConnectionType(connectionType);
        conn.setColorHex(colorHex);
        conn.setLineWidth(lineWidth);
        conn.setFlowColorHex(flowColorHex);
        conn.setOpacity(opacity);
        conn = connectionRepository.save(conn);

        return new NodeConnectionDto(conn.getId(),
                conn.getFromNode().getId(), conn.getFromNode().getName(),
                conn.getToNode() != null ? conn.getToNode().getId() : null,
                conn.getToNode() != null ? conn.getToNode().getName() : "*",
                conn.getTargetType().name(), conn.getConnectionType(),
                conn.getColorHex(), conn.getLineWidth(), conn.getFlowColorHex(), conn.getOpacity());
    }

    public void deleteConnection(Long connectionId) {
        connectionRepository.deleteById(connectionId);
    }
}
```

- [ ] **Step 4: 创建 BrainRegionService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.entity.BrainPoint;
import com.teambrain.repository.BrainPointRepository;
import com.teambrain.repository.BrainRegionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BrainRegionService {

    private final BrainRegionRepository regionRepository;
    private final BrainPointRepository pointRepository;

    public BrainRegionService(BrainRegionRepository regionRepository,
                              BrainPointRepository pointRepository) {
        this.regionRepository = regionRepository;
        this.pointRepository = pointRepository;
    }

    public List<BrainRegionDto> getAllRegions() {
        return regionRepository.findAllByOrderBySortOrderAsc().stream()
                .map(r -> new BrainRegionDto(r.getId(), r.getName(), r.getColorHex(), r.getSortOrder()))
                .toList();
    }

    public List<BrainPointDto> getAllPoints() {
        return pointRepository.findAll().stream()
                .map(p -> new BrainPointDto(
                        p.getBrainRegion().getId(),
                        p.getBrainRegion().getName(),
                        p.getBrainRegion().getColorHex(),
                        p.getX(), p.getY(), p.getZ()))
                .toList();
    }
}
```

- [ ] **Step 5: 创建 AdminService.java**

```java
package com.teambrain.service;

import com.teambrain.entity.User;
import com.teambrain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void setUserEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(enabled);
        userRepository.save(user);
    }
}
```

- [ ] **Step 6: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 7: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/ && git commit -m "feat: implement all business services"
```

---

### Task 8: 实现 REST 控制器

**Files:**
- Create: `backend/src/main/java/com/teambrain/controller/TeamController.java`
- Create: `backend/src/main/java/com/teambrain/controller/TeamNodeController.java`
- Create: `backend/src/main/java/com/teambrain/controller/ConnectionController.java`
- Create: `backend/src/main/java/com/teambrain/controller/BrainRegionController.java`
- Create: `backend/src/main/java/com/teambrain/controller/AdminController.java`

- [ ] **Step 1: 创建 TeamController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.TeamDto;
import com.teambrain.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateTeam(id, body.get("teamName"), body.get("description")));
    }
}
```

- [ ] **Step 2: 创建 TeamNodeController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.TeamNodeDto;
import com.teambrain.service.TeamNodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TeamNodeController {

    private final TeamNodeService nodeService;

    public TeamNodeController(TeamNodeService nodeService) {
        this.nodeService = nodeService;
    }

    @GetMapping("/teams/{teamId}/nodes")
    public ResponseEntity<List<TeamNodeDto>> getNodes(@PathVariable Long teamId) {
        return ResponseEntity.ok(nodeService.getTeamNodes(teamId));
    }

    @PostMapping("/teams/{teamId}/nodes")
    public ResponseEntity<TeamNodeDto> addNode(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String nodeType = (String) body.get("nodeType");
        Long brainRegionId = ((Number) body.get("brainRegionId")).longValue();
        return ResponseEntity.ok(nodeService.addNode(teamId, name, description, nodeType, brainRegionId));
    }

    @PutMapping("/nodes/{id}")
    public ResponseEntity<TeamNodeDto> updateNode(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String nodeType = (String) body.get("nodeType");
        Long brainRegionId = body.containsKey("brainRegionId") ? ((Number) body.get("brainRegionId")).longValue() : null;
        return ResponseEntity.ok(nodeService.updateNode(id, name, description, nodeType, brainRegionId));
    }

    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<?> deleteNode(@PathVariable Long id) {
        nodeService.deleteNode(id);
        return ResponseEntity.ok(Map.of("message", "删除成功"));
    }
}
```

- [ ] **Step 3: 创建 ConnectionController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.service.ConnectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping("/teams/{teamId}/connections")
    public ResponseEntity<List<NodeConnectionDto>> getConnections(@PathVariable Long teamId) {
        return ResponseEntity.ok(connectionService.getTeamConnections(teamId));
    }

    @PostMapping("/teams/{teamId}/connections")
    public ResponseEntity<NodeConnectionDto> addConnection(@PathVariable Long teamId,
                                                            @RequestBody Map<String, Object> body) {
        Long fromNodeId = ((Number) body.get("fromNodeId")).longValue();
        Long toNodeId = body.get("toNodeId") != null ? ((Number) body.get("toNodeId")).longValue() : null;
        String targetType = (String) body.get("targetType");
        String connectionType = (String) body.get("connectionType");
        String colorHex = (String) body.get("colorHex");
        Double lineWidth = ((Number) body.get("lineWidth")).doubleValue();
        String flowColorHex = (String) body.get("flowColorHex");
        Double opacity = ((Number) body.get("opacity")).doubleValue();
        return ResponseEntity.ok(connectionService.addConnection(
                teamId, fromNodeId, toNodeId, targetType, connectionType,
                colorHex, lineWidth, flowColorHex, opacity));
    }

    @DeleteMapping("/connections/{id}")
    public ResponseEntity<?> deleteConnection(@PathVariable Long id) {
        connectionService.deleteConnection(id);
        return ResponseEntity.ok(Map.of("message", "删除成功"));
    }
}
```

- [ ] **Step 4: 创建 BrainRegionController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.service.BrainRegionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/brain")
public class BrainRegionController {

    private final BrainRegionService brainRegionService;

    public BrainRegionController(BrainRegionService brainRegionService) {
        this.brainRegionService = brainRegionService;
    }

    @GetMapping("/regions")
    public ResponseEntity<List<BrainRegionDto>> getRegions() {
        return ResponseEntity.ok(brainRegionService.getAllRegions());
    }

    @GetMapping("/points")
    public ResponseEntity<List<BrainPointDto>> getPoints() {
        return ResponseEntity.ok(brainRegionService.getAllPoints());
    }
}
```

- [ ] **Step 5: 创建 AdminController.java**

```java
package com.teambrain.controller;

import com.teambrain.entity.User;
import com.teambrain.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = adminService.getAllUsers().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "email", u.getEmail() != null ? u.getEmail() : "",
                        "enabled", u.getEnabled()))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/state")
    public ResponseEntity<?> setUserState(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        adminService.setUserEnabled(id, body.get("enabled"));
        return ResponseEntity.ok(Map.of("message", "状态已更新"));
    }
}
```

- [ ] **Step 6: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 7: 提交**

```bash
git add backend/src/main/java/com/teambrain/controller/ && git commit -m "feat: implement all REST controllers"
```

---

### Task 9: 创建数据初始化脚本

**Files:**
- Create: `backend/src/main/resources/data.sql`

- [ ] **Step 1: 创建 data.sql**

```sql
-- 角色初始化（使用 IGNORE 避免重复插入）
INSERT IGNORE INTO sys_role (id, name) VALUES (1, 'USER');
INSERT IGNORE INTO sys_role (id, name) VALUES (2, 'ADMIN');

-- 脑区初始化
INSERT IGNORE INTO brain_region (id, name, color_hex, sort_order) VALUES
(1, '前额叶', '#FFB347', 1),
(2, '额叶', '#44AAFF', 2),
(3, '顶叶', '#AA44FF', 3),
(4, '颞叶', '#44FFAA', 4),
(5, '枕叶', '#FF8844', 5),
(6, '小脑/脑干', '#FF4477', 6);

-- 管理员账号 (admin / admin123) - BCrypt 加密
-- 仅在不存在时插入
INSERT INTO sys_user (id, username, password, email, enabled)
SELECT 1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@teambrain.com', true
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'admin');

INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 2);

-- 管理员团队的默认 team（仅在不存时才插入）
INSERT INTO team (id, team_name, description, user_id)
SELECT 1, 'TeamBrain 管理', '系统管理团队', 1
WHERE NOT EXISTS (SELECT 1 FROM team WHERE user_id = 1);
```

注意：上述 BCrypt 哈希值 `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` 对应明文密码 `admin123`。实际运行时如果 JPA ddl-auto 为 create，需要确保密码哈希有效。可以先注释掉 admin 插入，运行时通过 ApplicationRunner 动态创建。

- [ ] **Step 2: 创建 ApplicationRunner 做动态初始化**

创建 `backend/src/main/java/com/teambrain/config/DataInitializer.java`：

```java
package com.teambrain.config;

import com.teambrain.entity.Role;
import com.teambrain.entity.User;
import com.teambrain.repository.RoleRepository;
import com.teambrain.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.findByName("USER").isEmpty()) {
            roleRepository.save(new Role("USER"));
        }
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            roleRepository.save(new Role("ADMIN"));
        }
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin@teambrain.com");
            Role adminRole = roleRepository.findByName("ADMIN").get();
            Role userRole = roleRepository.findByName("USER").get();
            admin.setRoles(Set.of(adminRole, userRole));
            userRepository.save(admin);
        }
    }
}
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/resources/data.sql backend/src/main/java/com/teambrain/config/DataInitializer.java && git commit -m "feat: add data initialization scripts"
```

---

### Task 10: 更新脑区分区 Python 脚本

**Files:**
- Modify: `util_scripts/gen_points.py`（完全重写）

- [ ] **Step 1: 重写 gen_points.py，实现基于坐标的分区算法**

```python
import json
import trimesh
import numpy as np
from pathlib import Path

# 加载模型
script_dir = Path(__file__).resolve().parent
model_path = script_dir / 'brain.glb'
scene = trimesh.load(str(model_path))

# 脑区定义
REGIONS = {
    'prefrontal': {'name': '前额叶', 'color': [255, 179, 71, 255], 'sort': 1},
    'frontal':    {'name': '额叶',   'color': [68, 170, 255, 255], 'sort': 2},
    'parietal':   {'name': '顶叶',   'color': [170, 68, 255, 255], 'sort': 3},
    'temporal':   {'name': '颞叶',   'color': [68, 255, 170, 255], 'sort': 4},
    'occipital':  {'name': '枕叶',   'color': [255, 136, 68, 255], 'sort': 5},
    'cerebellum': {'name': '小脑/脑干', 'color': [255, 68, 119, 255], 'sort': 6},
}

def sample_points(vertices, n_surface, n_internal, centroid):
    """采样表面点和内部填充点"""
    if len(vertices) < n_surface:
        n_surface = len(vertices)
    indices = np.random.choice(len(vertices), n_surface, replace=False)
    surface = vertices[indices]

    if n_internal > 0:
        scales = np.random.uniform(0.1, 0.9, (n_surface, 1))
        internal = centroid + (surface - centroid) * scales
        all_pts = np.vstack((surface, internal))
    else:
        all_pts = surface

    np.random.shuffle(all_pts)
    return all_pts

def classify_point(x, y, z, z_min, z_max, y_min, y_max):
    """
    根据坐标分类脑区。
    Z轴：前(正) → 后(负)，对应额叶→枕叶
    Y轴：上(高) → 下(低)，对应顶叶→颞叶/脑干
    X轴：左(负) → 右(正)
    """
    z_norm = (z - z_min) / (z_max - z_min)  # 0=后 1=前
    y_norm = (y - y_min) / (y_max - y_min)  # 0=下 1=上
    x_abs = abs(x)

    # 颞叶：侧下方，不在最末端
    if y_norm < 0.35 and x_abs > 0.12 and z_norm > 0.25:
        return 'temporal'

    # 前后轴划分
    if z_norm > 0.75:
        return 'prefrontal'
    elif z_norm > 0.48:
        return 'frontal'
    elif z_norm > 0.22:
        return 'parietal'
    else:
        return 'occipital'

def process_model():
    # Part_04 (右半球) 和 Part_06 (左半球)
    rh = scene.geometry.get('Brain_Part_04_Colour_Brain_Texture_0')
    lh = scene.geometry.get('Brain_Part_06_Colour_Brain_Texture_0')
    # Part_02 = 小脑, Part_05 = 脑干
    cb = scene.geometry.get('Brain_Part_02_Colour_Brain_Texture_0')
    bs = scene.geometry.get('Brain_Part_05_Colour_Brain_Texture_0')

    # 获取半球 Z/Y 范围用于分类（使用两个半球的并集范围）
    hemi_verts = np.vstack([rh.vertices, lh.vertices])
    z_min, z_max = hemi_verts[:, 2].min(), hemi_verts[:, 2].max()
    y_min, y_max = hemi_verts[:, 1].min(), hemi_verts[:, 1].max()

    region_points = {k: [] for k in REGIONS}

    # 处理右半球
    rh_centroid = rh.vertices.mean(axis=0)
    points = sample_points(rh.vertices, 2000, 1000, rh_centroid)
    for pt in points:
        region = classify_point(pt[0], pt[1], pt[2], z_min, z_max, y_min, y_max)
        region_points[region].append(pt.tolist())

    # 处理左半球
    lh_centroid = lh.vertices.mean(axis=0)
    points = sample_points(lh.vertices, 2000, 1000, lh_centroid)
    for pt in points:
        region = classify_point(pt[0], pt[1], pt[2], z_min, z_max, y_min, y_max)
        region_points[region].append(pt.tolist())

    # 小脑
    if cb:
        cb_centroid = cb.vertices.mean(axis=0)
        cb_pts = sample_points(cb.vertices, 1000, 500, cb_centroid)
        region_points['cerebellum'].extend(cb_pts.tolist())

    # 脑干
    if bs:
        bs_centroid = bs.vertices.mean(axis=0)
        bs_pts = sample_points(bs.vertices, 300, 200, bs_centroid)
        region_points['cerebellum'].extend(bs_pts.tolist())

    # 输出 JSON（适配后端 BrainRegion 导入格式）
    output = []
    for region_key, info in REGIONS.items():
        output.append({
            'region_name': info['name'],
            'color': info['color'],
            'sort_order': info['sort'],
            'points': region_points[region_key]
        })

    output_path = script_dir / 'brain_points_labeled.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"分区完成，共 {sum(len(r['points']) for r in output)} 个点")
    for r in output:
        print(f"  {r['region_name']}: {len(r['points'])} 个点")
    print(f"输出: {output_path}")

if __name__ == '__main__':
    process_model()
```

- [ ] **Step 2: 运行脚本生成分区数据**

```bash
cd util_scripts && python3 gen_points.py
```

- [ ] **Step 3: 验证输出**

```bash
python3 -c "
import json
with open('util_scripts/brain_points_labeled.json') as f:
    data = json.load(f)
for r in data:
    print(f\"{r['region_name']}: {len(r['points'])} points, color={r['color']}\")
"
```

Expected: 6 个脑区，每个有数百到数千个点。

- [ ] **Step 4: 提交**

```bash
git add util_scripts/gen_points.py util_scripts/brain_points_labeled.json && git commit -m "feat: implement coordinate-based brain region partitioning"
```

---

### Task 11: 创建点云数据导入服务

**Files:**
- Create: `backend/src/main/java/com/teambrain/config/BrainDataImporter.java`

- [ ] **Step 1: 创建 BrainDataImporter.java**（Spring Boot 启动时从 JSON 导入点云到 DB）

```java
package com.teambrain.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teambrain.entity.BrainPoint;
import com.teambrain.entity.BrainRegion;
import com.teambrain.repository.BrainPointRepository;
import com.teambrain.repository.BrainRegionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@Order(2) // 在 DataInitializer 之后执行
public class BrainDataImporter implements CommandLineRunner {

    private final BrainRegionRepository regionRepository;
    private final BrainPointRepository pointRepository;

    public BrainDataImporter(BrainRegionRepository regionRepository,
                             BrainPointRepository pointRepository) {
        this.regionRepository = regionRepository;
        this.pointRepository = pointRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 只在点云表为空时导入
        if (pointRepository.count() > 0) return;

        List<BrainRegion> regions = regionRepository.findAllByOrderBySortOrderAsc();
        if (regions.size() < 6) return; // 脑区数据未就绪

        // 从 classpath 读取分区 JSON
        InputStream is = getClass().getClassLoader().getResourceAsStream("brain_points_labeled.json");
        if (is == null) {
            System.out.println("brain_points_labeled.json not found, skipping brain point import");
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(is);

        for (JsonNode regionNode : root) {
            String regionName = regionNode.get("region_name").asText();
            JsonNode points = regionNode.get("points");

            BrainRegion region = regions.stream()
                    .filter(r -> r.getName().equals(regionName))
                    .findFirst().orElse(null);
            if (region == null) continue;

            for (JsonNode pt : points) {
                BrainPoint bp = new BrainPoint(region,
                        pt.get(0).asDouble(), pt.get(1).asDouble(), pt.get(2).asDouble());
                pointRepository.save(bp);
            }
        }
        System.out.println("Brain point cloud imported: " + pointRepository.count() + " points");
    }
}
```

- [ ] **Step 2: 复制分区 JSON 到 backend resources**

```bash
cp util_scripts/brain_points_labeled.json backend/src/main/resources/
```

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/com/teambrain/config/BrainDataImporter.java backend/src/main/resources/brain_points_labeled.json && git commit -m "feat: add brain point cloud data importer"
```

---

### Task 12: 初始化前端项目

**Files:**
- 复制 `nocode/` 到 `frontend/`
- 修改 `frontend/package.json` 移除 nocode 专用插件
- 修改 `frontend/vite.config.js` 添加后端代理

- [ ] **Step 1: 复制项目并清理**

```bash
cp -r /home/mpt/projects/TeamBrain/nocode /home/mpt/projects/TeamBrain/frontend
cd /home/mpt/projects/TeamBrain/frontend
rm -rf node_modules yarn.lock
# 清理 Zone.Identifier 文件
find . -name "*Zone.Identifier" -delete
```

- [ ] **Step 2: 更新 package.json，移除 nocode 专用依赖**

修改 `frontend/package.json`：
- 删除 `@meituan-nocode/vite-plugin-dev-logger` 和 `@meituan-nocode/vite-plugin-nocode-html-transformer`
- 删除 `@supabase/supabase-js`（使用自己的后端）
- 添加 `axios`（已存在，确认版本）

最终 `frontend/package.json` 保留关键依赖：
```json
{
  "name": "teambrain-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1",
    "react-modal": "^3.16.3",
    "three": "^0.183.2",
    "axios": "^1.6.8",
    "lucide-react": "^0.417.0",
    "sonner": "^1.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "4.3.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "5.4.11"
  }
}
```

- [ ] **Step 3: 更新 vite.config.js，添加 API 代理**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 4: 安装依赖并测试启动**

```bash
cd frontend && npm install && npm run dev
```

访问 `http://localhost:5173` 确认空项目可启动（此时页面可能有错误，因为旧数据源已被移除）。

- [ ] **Step 5: 提交**

```bash
git add frontend/ && git commit -m "feat: initialize frontend project from nocode template"
```

---

### Task 13: 创建前端 API 服务层和认证上下文

**Files:**
- Create: `frontend/src/services/api.js`
- Create: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: 创建 api.js**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：自动附加 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 时跳转登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: 创建 AuthContext.jsx**

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    const userData = { id: data.userId, username: data.username, teamId: data.teamId };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (username, password, email) => {
    const { data } = await api.post('/auth/register', { username, password, email });
    localStorage.setItem('token', data.token);
    const userData = { id: data.userId, username: data.username, teamId: data.teamId };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/services/ frontend/src/context/ && git commit -m "feat: add API service layer and auth context"
```

---

### Task 14: 创建登录注册页面

**Files:**
- Create: `frontend/src/pages/LoginPage.jsx`
- Modify: `frontend/src/App.jsx`（添加登录路由和 AuthProvider）
- Modify: `frontend/src/main.jsx`（包裹 AuthProvider）

- [ ] **Step 1: 创建 LoginPage.jsx**

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, password, email);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-black bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {isRegister ? '注册 TeamBrain' : '登录 TeamBrain'}
        </h1>
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1">用户名</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-white text-sm mb-1">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-white text-sm mb-1">密码</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <button type="submit"
            className="w-full bg-blue-500 bg-opacity-50 hover:bg-opacity-70 rounded py-2 text-white font-bold">
            {isRegister ? '注册' : '登录'}
          </button>
        </form>
        <p className="text-white text-sm mt-4 text-center opacity-60 cursor-pointer"
           onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
```

- [ ] **Step 2: 更新 App.jsx**

```jsx
import { Toaster } from "@/components/ui/sonner";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import BrainPage from "./pages/BrainPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><BrainPage /></ProtectedRoute>} />
    </Routes>
  </HashRouter>
);

const App = () => (
  <AuthProvider>
    <Toaster />
    <AppRoutes />
  </AuthProvider>
);

export default App;
```

- [ ] **Step 3: 更新 main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/LoginPage.jsx frontend/src/App.jsx frontend/src/main.jsx && git commit -m "feat: add login/register page with auth routing"
```

---

### Task 15: 创建 BrainPage — 脑区可视化主页面

**Files:**
- Create: `frontend/src/pages/BrainPage.jsx`
- Create: `frontend/src/hooks/useBrainData.js`
- Create: `frontend/src/hooks/useTeamData.js`

- [ ] **Step 1: 创建 useBrainData.js**

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useBrainData() {
  const [regions, setRegions] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsRes, pointsRes] = await Promise.all([
          api.get('/brain/regions'),
          api.get('/brain/points'),
        ]);
        setRegions(regionsRes.data);
        setPoints(pointsRes.data);
      } catch (err) {
        console.error('Failed to fetch brain data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { regions, points, loading };
}
```

- [ ] **Step 2: 创建 useTeamData.js**

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useTeamData() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      const [teamRes, nodesRes, connRes] = await Promise.all([
        api.get(`/teams/${user.teamId}`),
        api.get(`/teams/${user.teamId}/nodes`),
        api.get(`/teams/${user.teamId}/connections`),
      ]);
      setTeam(teamRes.data);
      setNodes(nodesRes.data);
      setConnections(connRes.data);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { team, nodes, connections, loading, refresh: fetchData };
}
```

- [ ] **Step 3: 创建 BrainPage.jsx**

BrainPage 是页面编排组件。它直接使用旧 BrainPointCloud.jsx 的核心逻辑（从 nocode 复制过来并适配 API 数据源），暂不拆散（避免影响视觉效果），只做以下改动：

1. 数据获取从 gist URL → API calls（useBrainData, useTeamData）
2. 脑区分区数据从 brainRegionInfo state → `nodes` from API
3. 连接规则从 connectionRules state → `connections` from API
4. 删除冗余的 connections 数组（只保留 connectionRules → 已由 connections API 替代）

复制 `nocode/src/components/BrainPointCloud.jsx` 到 `frontend/src/pages/BrainPage.jsx`，然后做以下修改：

**关键修改 1：数据获取逻辑**（替换 fetchBrainData useEffect）

```jsx
const { regions, points: brainPoints, loading: brainLoading } = useBrainData();
const { team, nodes, connections: connRules, loading: teamLoading, refresh } = useTeamData();
```

**关键修改 2：点云创建逻辑**（替换 createPointCloud 中的数据遍历）

原有逻辑遍历 `brainData`（格式 `[{color, points}, ...]`），新的 API 返回格式扁平化（每个点含 regionId, colorHex, x, y, z）。

修改 `createPointCloud`：按 `regionId` 分组 `brainPoints` 后再创建：

```jsx
// 将 API 返回的扁平点列表按 brainRegionId 分组
const pointsByRegion = {};
brainPoints.forEach(p => {
  if (!pointsByRegion[p.regionId]) {
    pointsByRegion[p.regionId] = { points: [], color: p.colorHex, name: p.regionName };
  }
  pointsByRegion[p.regionId].points.push([p.x, p.y, p.z]);
});
```

然后用 `Object.entries(pointsByRegion)` 替代原有的 `brainData.forEach(...)`。

**关键修改 3：节点信息分配**

原代码从 `brainRegionInfo[partitionIndex]` 随机取信息分配给点。改为从 API 的 `nodes` 获取：

```jsx
const regionNodes = nodes.filter(n => n.brainRegionId === regionId);
const randomNode = regionNodes[Math.floor(Math.random() * regionNodes.length)];
sphere.userData = {
  partitionIndex: regionId,
  partitionName: regionName,
  partitionColor: pointColor,
  infoName: randomNode?.name || '未分配',
  infoDescription: randomNode?.description || '',
  infoKey: randomNode?.name || '未分配',
};
```

**关键修改 4：连接规则**

将硬编码的 `connectionRules` 数组替换为 `connRules`（从 API 获取），格式转换：

```jsx
const connectionRules = connRules.map(c => ({
  from: [c.fromNodeName],
  to: c.targetType === 'ALL' ? '*' : [c.toNodeName],
  type: c.connectionType,
  color: parseInt(c.colorHex.replace('#', ''), 16),
  width: c.lineWidth,
  flowColor: parseInt(c.flowColorHex.replace('#', ''), 16),
  opacity: c.opacity,
}));
```

**关键修改 5：控制面板中的脑区图例**

从 `regions` API 数据动态生成图例，而不是硬编码：

```jsx
{regions.map(r => (
  <div key={r.id} className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }}></div>
    <span className="text-xs">{r.name}</span>
  </div>
))}
```

修改后的 BrainPage.jsx 约为 ~1400 行（比原来略少，去掉了冗余数据结构和部分 console.log）。

- [ ] **Step 4: 确保前端编译通过**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/BrainPage.jsx frontend/src/hooks/ && git commit -m "feat: create BrainPage with API data integration"
```

---

### Task 16: 创建编辑模态框组件（提取自 BrainPage）

**Files:**
- Create: `frontend/src/components/ui/EditModal.jsx`

- [ ] **Step 1: 提取 EditModal.jsx**

从 BrainPage.jsx 中提取 Modal 渲染部分到独立组件。EditModal 接收 props：
- `isOpen`, `onClose`, `team`, `nodes`, `regions`, `onSave`

内部状态：
- `editingNodes`（按 brainRegionId 分组）
- `editingTeamName`

```jsx
import Modal from 'react-modal';
import React, { useState, useEffect } from 'react';

Modal.setAppElement('#root');

const EditModal = ({ isOpen, onClose, team, nodes, regions, onSave }) => {
  const [editingTeamName, setEditingTeamName] = useState(team?.teamName || '');
  const [editingNodes, setEditingNodes] = useState({});
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    if (!isOpen) return;
    setEditingTeamName(team?.teamName || '');
    // 按脑区分组节点
    const grouped = {};
    regions.forEach(r => {
      grouped[r.id] = nodes.filter(n => n.brainRegionId === r.id)
        .map(n => ({ name: n.name, description: n.description }));
    });
    setEditingNodes(grouped);
  }, [isOpen, team, nodes, regions]);

  const addEntry = (regionId) => {
    setEditingNodes(prev => ({
      ...prev,
      [regionId]: [...(prev[regionId] || []), { name: '新节点', description: '请添加描述' }],
    }));
  };

  // ... 其余 Modal 内容与原始 BrainPointCloud.jsx 中一致
  // 渲染 regions 下的节点编辑区域、导入 JSON tab、保存按钮等
  // 保持原始视觉效果不变

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}
      className="absolute inset-0 flex items-center justify-center p-4 z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40">
      {/* 保持原始样式 */}
    </Modal>
  );
};

export default EditModal;
```

完整代码按照原始 BrainPointCloud.jsx 中的 Modal JSX 复制，替换数据绑定即可。

- [ ] **Step 2: 编译验证和提交**

```bash
cd frontend && npm run build
git add frontend/src/components/ui/EditModal.jsx && git commit -m "feat: extract EditModal component"
```

---

### Task 17: 配置前后端整合部署

**Files:**
- Modify: `frontend/vite.config.js`（确认 build 输出）
- Modify: `backend/pom.xml`（添加 frontend-maven-plugin）

- [ ] **Step 1: 配置 Vite build 输出到 backend static**

在 `frontend/vite.config.js` 中添加：

```javascript
build: {
  outDir: 'dist',
  emptyOutDir: true,
},
```

- [ ] **Step 2: 创建构建脚本（手动）**

在项目根目录创建 `build.sh`：

```bash
#!/bin/bash
set -e
echo "=== Building frontend ==="
cd frontend && npm install && npm run build
echo "=== Copying to backend ==="
rm -rf ../backend/src/main/resources/static/*
cp -r dist/* ../backend/src/main/resources/static/
echo "=== Building backend ==="
cd ../backend && mvn clean package -DskipTests
echo "=== Done: backend/target/teambrain-0.0.1.jar ==="
```

- [ ] **Step 3: 测试构建**

```bash
chmod +x build.sh && ./build.sh
```

Expected: 最终产出 `backend/target/teambrain-0.0.1.jar`。

- [ ] **Step 4: 提交**

```bash
git add build.sh frontend/vite.config.js && git commit -m "feat: add integrated build script"
```

---

### Task 18: 端到端测试与视觉验证

- [ ] **Step 1: 启动 MySQL 并创建数据库**

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS teambrain DEFAULT CHARACTER SET utf8mb4"
```

- [ ] **Step 2: 启动 Spring Boot 后端**

```bash
cd backend && mvn spring-boot:run
```

验证：
- 访问 `http://localhost:8080/api/brain/regions` 返回 6 个脑区 JSON
- 访问 `http://localhost:8080/api/brain/points` 返回点云数据（带脑区标签）
- `POST http://localhost:8080/api/auth/register` 可注册新用户

- [ ] **Step 3: 启动前端开发服务器**

```bash
cd frontend && npm run dev
```

- [ ] **Step 4: 人工测试清单**

1. 访问 `http://localhost:5173`，应自动跳转到 `/login`
2. 使用 test/test123 注册新用户
3. 登录后看到 3D 脑部点云，6 种颜色对应 6 个脑区
4. 旋转、缩放、W/S 移动相机 — 正常
5. 悬停在光点上看到节点信息 tooltip
6. 右侧面板显示 6 个脑区图例和连接线开关
7. 点击"编辑团队信息"打开模态框，可增删改节点
8. 刷新页面后数据持久化（从 DB 读取）

- [ ] **Step 5: 记录并修复视觉问题**

对比 nocode 原版的视觉效果，记录任何差异并修复。

- [ ] **Step 6: 提交最终版本**

```bash
git add -A && git commit -m "feat: complete TeamBrain full-stack system"
```
