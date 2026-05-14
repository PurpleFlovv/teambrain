# TeamBrain 后台管理 & 连接策略重设计 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重设计后台管理界面（仪表盘/用户/团队/脑区/日志）并实现基于策略的自动连接系统，替换手动逐条连接。

**Architecture:** 后端新增 AuditLog、ConnectionType 两张表，TeamNode 加 tags 字段，新增 ConnectionStrategyService 按四种策略自动生成连接。前端 AdminPage 完全重写为侧边栏+子页面架构，新增 MiniBrain 迷你 3D 组件，仪表盘嵌入 3D 预览和脑区分布图。BrainPointCloud 加 LOD 渲染优化。

**Tech Stack:** Spring Boot 3.4 + JPA + MySQL, React 18 + Three.js 0.183 + Tailwind CSS

---

### Task 1: 创建 AuditLog 和 ConnectionType 实体，修改 TeamNode 加 tags

**Files:**
- Create: `backend/src/main/java/com/teambrain/entity/AuditLog.java`
- Create: `backend/src/main/java/com/teambrain/entity/ConnectionType.java`
- Modify: `backend/src/main/java/com/teambrain/entity/TeamNode.java`

- [ ] **Step 1: 创建 AuditLog.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(length = 200)
    private String target;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String username, String action, String target) {
        this.username = username;
        this.action = action;
        this.target = target;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 2: 创建 ConnectionType.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "connection_type")
public class ConnectionType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Column(nullable = false)
    private Double lineWidth;

    @Column(nullable = false)
    private Double opacity;

    public ConnectionType() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public void setLineWidth(Double lineWidth) { this.lineWidth = lineWidth; }
    public Double getOpacity() { return opacity; }
    public void setOpacity(Double opacity) { this.opacity = opacity; }
}
```

- [ ] **Step 3: 修改 TeamNode.java — 加 tags 字段**

Read the current TeamNode.java, add this field after `nodeType`:

```java
@Column(length = 200)
private String tags;  // comma-separated: "leader", "bridge:3,4"
```

Add getter/setter:
```java
public String getTags() { return tags; }
public void setTags(String tags) { this.tags = tags; }
```

- [ ] **Step 4: 编译验证**

```bash
cd backend && mvn compile
```
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/teambrain/entity/AuditLog.java backend/src/main/java/com/teambrain/entity/ConnectionType.java backend/src/main/java/com/teambrain/entity/TeamNode.java
git commit -m "feat: add AuditLog, ConnectionType entities, tags field on TeamNode"
```

---

### Task 2: 创建 Repository 层

**Files:**
- Create: `backend/src/main/java/com/teambrain/repository/AuditLogRepository.java`
- Create: `backend/src/main/java/com/teambrain/repository/ConnectionTypeRepository.java`

- [ ] **Step 1: 创建两个 Repository**

```java
// AuditLogRepository.java
package com.teambrain.repository;

import com.teambrain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
```

```java
// ConnectionTypeRepository.java
package com.teambrain.repository;

import com.teambrain.entity.ConnectionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConnectionTypeRepository extends JpaRepository<ConnectionType, Long> {
    List<ConnectionType> findByTeamId(Long teamId);
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/com/teambrain/repository/AuditLogRepository.java backend/src/main/java/com/teambrain/repository/ConnectionTypeRepository.java
git commit -m "feat: add AuditLogRepository and ConnectionTypeRepository"
```

---

### Task 3: 创建 ConnectionStrategyService

**Files:**
- Create: `backend/src/main/java/com/teambrain/service/ConnectionStrategyService.java`

- [ ] **Step 1: 创建 ConnectionStrategyService.java**

```java
package com.teambrain.service;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.entity.NodeConnection;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.NodeConnectionRepository;
import com.teambrain.repository.TeamNodeRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ConnectionStrategyService {

    private final TeamNodeRepository nodeRepository;
    private final NodeConnectionRepository connectionRepository;

    public ConnectionStrategyService(TeamNodeRepository nodeRepository,
                                     NodeConnectionRepository connectionRepository) {
        this.nodeRepository = nodeRepository;
        this.connectionRepository = connectionRepository;
    }

    /**
     * Compute connections for a team using 4 strategies.
     * Strategy priority: D (manual) > C (bridge) > B (leader) > A (same-region)
     */
    public List<Map<String, Object>> computeConnections(Long teamId) {
        List<TeamNode> allNodes = nodeRepository.findByTeamId(teamId);
        Set<String> connectionSet = new HashSet<>(); // "fromId_toId" for dedup
        List<Map<String, Object>> result = new ArrayList<>();

        // Strategy D: Manual connections (highest priority)
        List<NodeConnection> manual = connectionRepository.findByTeamId(teamId);
        for (NodeConnection mc : manual) {
            String key = mc.getFromNode().getId() + "_" + (mc.getToNode() != null ? mc.getToNode().getId() : "*");
            if (connectionSet.add(key)) {
                result.add(Map.<String, Object>of(
                    "fromNodeId", mc.getFromNode().getId(),
                    "fromNodeName", mc.getFromNode().getName(),
                    "toNodeId", mc.getToNode() != null ? mc.getToNode().getId() : null,
                    "toNodeName", mc.getToNode() != null ? mc.getToNode().getName() : "*",
                    "connectionType", mc.getConnectionType(),
                    "colorHex", mc.getColorHex(),
                    "lineWidth", mc.getLineWidth(),
                    "flowColorHex", mc.getFlowColorHex(),
                    "opacity", mc.getOpacity(),
                    "strategy", "manual"
                ));
            }
        }

        // Group nodes by brain region
        Map<Long, List<TeamNode>> byRegion = new HashMap<>();
        for (TeamNode n : allNodes) {
            byRegion.computeIfAbsent(n.getBrainRegion().getId(), k -> new ArrayList<>()).add(n);
        }

        // Strategy A: Same-region collaboration (max 5 neighbors per node)
        for (List<TeamNode> regionNodes : byRegion.values()) {
            for (TeamNode node : regionNodes) {
                List<TeamNode> others = new ArrayList<>(regionNodes);
                others.remove(node);
                Collections.shuffle(others);
                int count = 0;
                for (TeamNode other : others) {
                    if (count >= 5) break;
                    String key = Math.min(node.getId(), other.getId()) + "_" + Math.max(node.getId(), other.getId());
                    if (connectionSet.add(key)) {
                        result.add(Map.<String, Object>of(
                            "fromNodeId", node.getId(), "fromNodeName", node.getName(),
                            "toNodeId", other.getId(), "toNodeName", other.getName(),
                            "connectionType", "collaboration", "colorHex", "#888888",
                            "lineWidth", 0.01, "flowColorHex", "#aaaaaa", "opacity", 0.5,
                            "strategy", "same_region"
                        ));
                    }
                    count++;
                }
            }
        }

        // Strategy B & C: Leader and Bridge (tag-based)
        for (TeamNode node : allNodes) {
            String tags = node.getTags();
            if (tags == null || tags.isEmpty()) continue;

            boolean isLeader = tags.contains("leader");

            // Bridge tags: "bridge:3,4"
            List<Long> bridgeRegions = new ArrayList<>();
            for (String part : tags.split(",")) {
                part = part.trim();
                if (part.startsWith("bridge:")) {
                    String[] ids = part.substring(7).split(",");
                    for (String sid : ids) {
                        try { bridgeRegions.add(Long.parseLong(sid.trim())); } catch (NumberFormatException e) {}
                    }
                }
            }

            for (Map.Entry<Long, List<TeamNode>> entry : byRegion.entrySet()) {
                Long rid = entry.getKey();
                boolean sameRegion = rid.equals(node.getBrainRegion().getId());

                if (isLeader && sameRegion) {
                    // Strategy B: leader → projects in same region
                    for (TeamNode target : entry.getValue()) {
                        if (target.getNodeType() == TeamNode.NodeType.PROJECT) {
                            String key = node.getId() + "_" + target.getId();
                            if (connectionSet.add(key)) {
                                result.add(Map.<String, Object>of(
                                    "fromNodeId", node.getId(), "fromNodeName", node.getName(),
                                    "toNodeId", target.getId(), "toNodeName", target.getName(),
                                    "connectionType", "leadership", "colorHex", "#ffaa44",
                                    "lineWidth", 0.03, "flowColorHex", "#ffaa44", "opacity", 0.8,
                                    "strategy", "leader"
                                ));
                            }
                        }
                    }
                }

                if (bridgeRegions.contains(rid) && !sameRegion) {
                    // Strategy C: bridge → all nodes in target region
                    for (TeamNode target : entry.getValue()) {
                        String key = node.getId() + "_" + target.getId();
                        if (connectionSet.add(key)) {
                            result.add(Map.<String, Object>of(
                                "fromNodeId", node.getId(), "fromNodeName", node.getName(),
                                "toNodeId", target.getId(), "toNodeName", target.getName(),
                                "connectionType", "bridge", "colorHex", "#44aaff",
                                "lineWidth", 0.02, "flowColorHex", "#44aaff", "opacity", 0.7,
                                "strategy", "bridge"
                            ));
                        }
                    }
                }
            }
        }

        return result;
    }
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/ConnectionStrategyService.java
git commit -m "feat: add ConnectionStrategyService with 4 auto-connection strategies"
```

---

### Task 4: 扩展 AdminService（用户/团队/脑区 CRUD + 日志）

**Files:**
- Modify: `backend/src/main/java/com/teambrain/service/AdminService.java`

- [ ] **Step 1: 重写 AdminService.java**

```java
package com.teambrain.service;

import com.teambrain.entity.*;
import com.teambrain.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamNodeRepository teamNodeRepository;
    private final NodeConnectionRepository connectionRepository;
    private final BrainRegionRepository regionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, TeamRepository teamRepository,
                        TeamNodeRepository teamNodeRepository, NodeConnectionRepository connectionRepository,
                        BrainRegionRepository regionRepository, AuditLogRepository auditLogRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamNodeRepository = teamNodeRepository;
        this.connectionRepository = connectionRepository;
        this.regionRepository = regionRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private void log(String username, String action, String target) {
        auditLogRepository.save(new AuditLog(username, action, target));
    }

    // ---- Stats ----
    public Map<String, Long> getStats() {
        return Map.of(
            "userCount", userRepository.count(),
            "teamCount", teamRepository.count(),
            "nodeCount", teamNodeRepository.count()
        );
    }

    // ---- Users ----
    public List<User> getAllUsers() { return userRepository.findAll(); }

    public User createUser(String username, String password, String email, List<String> roles,
                           String adminUsername) {
        if (userRepository.existsByUsername(username))
            throw new RuntimeException("用户名已存在");
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        Set<Role> roleSet = new HashSet<>();
        for (String r : roles) {
            roleRepository.findByName(r).ifPresent(roleSet::add);
        }
        user.setRoles(roleSet);
        user = userRepository.save(user);
        // Auto-create team
        teamRepository.save(new Team(user.getUsername() + "的团队", "团队大脑", user));
        log(adminUsername, "CREATE_USER", username);
        return user;
    }

    public User updateUser(Long id, String username, String email, List<String> roles,
                           String password, String adminUsername) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
        if (username != null) user.setUsername(username);
        if (email != null) user.setEmail(email);
        if (password != null && !password.isEmpty()) user.setPassword(passwordEncoder.encode(password));
        if (roles != null && !roles.isEmpty()) {
            Set<Role> roleSet = new HashSet<>();
            for (String r : roles) roleRepository.findByName(r).ifPresent(roleSet::add);
            user.setRoles(roleSet);
        }
        userRepository.save(user);
        log(adminUsername, "UPDATE_USER", user.getUsername());
        return user;
    }

    public void deleteUser(Long id, String adminUsername) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
        String uname = user.getUsername();
        // Cascade: delete user's team, nodes, connections
        teamRepository.findByUserId(id).ifPresent(team -> {
            connectionRepository.findByTeamId(team.getId()).forEach(c -> connectionRepository.delete(c));
            teamNodeRepository.findByTeamId(team.getId()).forEach(n -> teamNodeRepository.delete(n));
            teamRepository.delete(team);
        });
        userRepository.delete(user);
        log(adminUsername, "DELETE_USER", uname);
    }

    public void setUserEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    // ---- Teams ----
    public List<Map<String, Object>> getAllTeams() {
        return teamRepository.findAll().stream().map(t -> Map.<String, Object>of(
            "id", t.getId(), "teamName", t.getTeamName(),
            "ownerUsername", t.getUser().getUsername(),
            "memberCount", teamNodeRepository.findByTeamId(t.getId()).stream()
                .filter(n -> n.getNodeType() == TeamNode.NodeType.MEMBER).count(),
            "projectCount", teamNodeRepository.findByTeamId(t.getId()).stream()
                .filter(n -> n.getNodeType() == TeamNode.NodeType.PROJECT).count(),
            "createdAt", t.getUser().getUsername() // simplified
        )).toList();
    }

    public void updateTeam(Long teamId, String teamName, String description, String adminUsername) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("团队不存在"));
        if (teamName != null) team.setTeamName(teamName);
        if (description != null) team.setDescription(description);
        teamRepository.save(team);
        log(adminUsername, "UPDATE_TEAM", team.getTeamName());
    }

    public void deleteTeam(Long teamId, String adminUsername) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("团队不存在"));
        String tname = team.getTeamName();
        connectionRepository.findByTeamId(teamId).forEach(c -> connectionRepository.delete(c));
        teamNodeRepository.findByTeamId(teamId).forEach(n -> teamNodeRepository.delete(n));
        teamRepository.delete(team);
        log(adminUsername, "DELETE_TEAM", tname);
    }

    // ---- Regions ----
    public void updateRegion(Long regionId, String name, String colorHex, String adminUsername) {
        BrainRegion region = regionRepository.findById(regionId)
            .orElseThrow(() -> new RuntimeException("脑区不存在"));
        if (name != null) region.setName(name);
        if (colorHex != null) region.setColorHex(colorHex);
        regionRepository.save(region);
        log(adminUsername, "UPDATE_REGION", region.getName());
    }

    // ---- Audit Logs ----
    public Page<AuditLog> getLogs(String action, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (action != null && !action.isEmpty())
            return auditLogRepository.findByAction(action, pageable);
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
```

- [ ] **Step 2: Add RoleRepository import** — AdminService now uses RoleRepository. Update constructor and imports.

- [ ] **Step 3: 编译验证并修复**

```bash
cd backend && mvn compile
```
Fix any compilation errors (missing imports, etc.).

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/AdminService.java
git commit -m "feat: expand AdminService with user/team/region CRUD and audit logging"
```

---

### Task 5: 扩展 AdminController，创建 ConnectionTypeController，添加策略端点

**Files:**
- Modify: `backend/src/main/java/com/teambrain/controller/AdminController.java`
- Create: `backend/src/main/java/com/teambrain/controller/ConnectionTypeController.java`
- Modify: `backend/src/main/java/com/teambrain/controller/TeamController.java` (add computed connections endpoint)

- [ ] **Step 1: 重写 AdminController.java**

```java
package com.teambrain.controller;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.AuditLog;
import com.teambrain.service.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final TeamNodeService teamNodeService;
    private final ConnectionService connectionService;
    private final ConnectionStrategyService strategyService;

    public AdminController(AdminService adminService, TeamNodeService teamNodeService,
                           ConnectionService connectionService, ConnectionStrategyService strategyService) {
        this.adminService = adminService;
        this.teamNodeService = teamNodeService;
        this.connectionService = connectionService;
        this.strategyService = strategyService;
    }

    private String username(UserDetails ud) { return ud != null ? ud.getUsername() : "system"; }

    // Stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    // Users
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        var users = adminService.getAllUsers().stream().map(u -> Map.<String, Object>of(
            "id", u.getId(), "username", u.getUsername(),
            "email", u.getEmail() != null ? u.getEmail() : "",
            "enabled", u.getEnabled(),
            "roles", u.getRoles().stream().map(r -> r.getName()).toList()
        )).toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        String uname = (String) body.get("username");
        String pwd = (String) body.get("password");
        String email = (String) body.get("email");
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        adminService.createUser(uname, pwd, email, roles, username(ud));
        return ResponseEntity.ok(Map.of("message", "用户已创建"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        adminService.updateUser(id,
            (String) body.get("username"), (String) body.get("email"),
            (List<String>) body.get("roles"), (String) body.get("password"), username(ud));
        return ResponseEntity.ok(Map.of("message", "用户已更新"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        adminService.deleteUser(id, username(ud));
        return ResponseEntity.ok(Map.of("message", "用户已删除"));
    }

    @PutMapping("/users/{id}/state")
    public ResponseEntity<?> setUserState(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        adminService.setUserEnabled(id, body.get("enabled"));
        return ResponseEntity.ok(Map.of("message", "状态已更新"));
    }

    // Teams
    @GetMapping("/teams")
    public ResponseEntity<List<Map<String, Object>>> getTeams() {
        return ResponseEntity.ok(adminService.getAllTeams());
    }

    @PutMapping("/teams/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        adminService.updateTeam(id, body.get("teamName"), body.get("description"), username(ud));
        return ResponseEntity.ok(Map.of("message", "团队已更新"));
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        adminService.deleteTeam(id, username(ud));
        return ResponseEntity.ok(Map.of("message", "团队已删除"));
    }

    @GetMapping("/teams/{id}/nodes")
    public ResponseEntity<List<TeamNodeDto>> getTeamNodes(@PathVariable Long id) {
        return ResponseEntity.ok(teamNodeService.getTeamNodes(id));
    }

    @GetMapping("/teams/{id}/connections")
    public ResponseEntity<List<NodeConnectionDto>> getTeamConnections(@PathVariable Long id) {
        return ResponseEntity.ok(connectionService.getTeamConnections(id));
    }

    // Regions
    @PutMapping("/regions/{id}")
    public ResponseEntity<?> updateRegion(@PathVariable Long id, @RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal UserDetails ud) {
        adminService.updateRegion(id, body.get("name"), body.get("colorHex"), username(ud));
        return ResponseEntity.ok(Map.of("message", "脑区已更新"));
    }

    // Audit Logs
    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getLogs(
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditLog> logs = adminService.getLogs(action.isEmpty() ? null : action, page, size);
        return ResponseEntity.ok(Map.of(
            "content", logs.getContent().stream().map(l -> Map.of(
                "id", l.getId(), "username", l.getUsername(),
                "action", l.getAction(), "target", l.getTarget(),
                "createdAt", l.getCreatedAt().toString()
            )).toList(),
            "totalPages", logs.getTotalPages(),
            "totalElements", logs.getTotalElements()
        ));
    }
}
```

- [ ] **Step 2: 创建 ConnectionTypeController.java**

```java
package com.teambrain.controller;

import com.teambrain.entity.ConnectionType;
import com.teambrain.entity.Team;
import com.teambrain.repository.ConnectionTypeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connection-types")
public class ConnectionTypeController {

    private final ConnectionTypeRepository ctRepo;
    private final TeamRepository teamRepo;

    public ConnectionTypeController(ConnectionTypeRepository ctRepo, TeamRepository teamRepo) {
        this.ctRepo = ctRepo;
        this.teamRepo = teamRepo;
    }

    @GetMapping
    public ResponseEntity<List<ConnectionType>> list(@RequestParam Long teamId) {
        return ResponseEntity.ok(ctRepo.findByTeamId(teamId));
    }

    @PostMapping
    public ResponseEntity<ConnectionType> create(@RequestBody Map<String, Object> body) {
        Long teamId = ((Number) body.get("teamId")).longValue();
        Team team = teamRepo.findById(teamId).orElseThrow();
        ConnectionType ct = new ConnectionType();
        ct.setTeam(team);
        ct.setName((String) body.get("name"));
        ct.setColorHex((String) body.get("colorHex"));
        ct.setLineWidth(((Number) body.get("lineWidth")).doubleValue());
        ct.setOpacity(((Number) body.get("opacity")).doubleValue());
        return ResponseEntity.ok(ctRepo.save(ct));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConnectionType> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ConnectionType ct = ctRepo.findById(id).orElseThrow();
        if (body.containsKey("name")) ct.setName((String) body.get("name"));
        if (body.containsKey("colorHex")) ct.setColorHex((String) body.get("colorHex"));
        if (body.containsKey("lineWidth")) ct.setLineWidth(((Number) body.get("lineWidth")).doubleValue());
        if (body.containsKey("opacity")) ct.setOpacity(((Number) body.get("opacity")).doubleValue());
        return ResponseEntity.ok(ctRepo.save(ct));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        ctRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已删除"));
    }
}
```

- [ ] **Step 3: 添加策略端点** — 在 TeamController 或 AdminController 中添加：

```java
@GetMapping("/teams/{id}/connections/computed")
public ResponseEntity<List<Map<String, Object>>> getComputedConnections(@PathVariable Long id) {
    return ResponseEntity.ok(strategyService.computeConnections(id));
}
```

将此端点放在 `AdminController` 中（路径 `/api/admin/teams/{id}/connections/computed`）或新建 `TeamConnectionController`。

- [ ] **Step 4: 编译验证**

```bash
cd backend && mvn compile
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/teambrain/controller/
git commit -m "feat: expand admin API with CRUD endpoints, connection types, and strategy endpoint"
```

---

### Task 6: 创建 MiniBrain 组件

**Files:**
- Create: `frontend/src/components/MiniBrain.jsx`

- [ ] **Step 1: 创建 MiniBrain.jsx**

```jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MiniBrain = ({ brainPoints, regions, width = 400, height = 400 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!brainPoints?.length || !mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00aaff, 2, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // Group points by region
    const pointsByRegion = {};
    brainPoints.forEach(p => {
      if (!pointsByRegion[p.regionId]) pointsByRegion[p.regionId] = { points: [], color: p.colorHex };
      pointsByRegion[p.regionId].points.push(p);
    });

    Object.values(pointsByRegion).forEach(region => {
      const r = parseInt(region.color.slice(1, 3), 16);
      const g = parseInt(region.color.slice(3, 5), 16);
      const b = parseInt(region.color.slice(5, 7), 16);
      const color = new THREE.Color(r / 255, g / 255, b / 255);

      region.points.forEach(p => {
        const geom = new THREE.SphereGeometry(0.02, 8, 8);
        const mat = new THREE.MeshPhongMaterial({ color, emissive: color.clone().multiplyScalar(0.5), transparent: true, opacity: 0.85 });
        const sphere = new THREE.Mesh(geom, mat);
        sphere.position.set(p.x, p.y, p.z);
        scene.add(sphere);
      });
    });

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [brainPoints, width, height]);

  return <div ref={mountRef} style={{ width, height, borderRadius: 12, overflow: 'hidden' }} />;
};

export default MiniBrain;
```

- [ ] **Step 2: 编译验证**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/MiniBrain.jsx
git commit -m "feat: add MiniBrain component for dashboard 3D preview"
```

---

### Task 7: 重写 AdminPage — 布局和仪表盘

**Files:**
- Create: `frontend/src/pages/AdminPage.jsx` (完全重写)

- [ ] **Step 1: 编写侧边栏 + 子路由框架 + 仪表盘组件**

完整代码较长，核心结构如下：

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import MiniBrain from '../components/MiniBrain';
import BrainPointCloud from '../components/BrainPointCloud';
import api from '../services/api';

const MENU = [
  { key: '', label: '仪表盘', icon: '📊' },
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'teams', label: '团队管理', icon: '🏢' },
  { key: 'regions', label: '脑区管理', icon: '🧠' },
  { key: 'logs', label: '操作日志', icon: '📝' },
];

// ---- Dashboard ----
const Dashboard = () => { /* 内容见下方 */ };

// ... (后续 Task 中实现其他子页面)

// ---- Main AdminPage ----
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const subPath = location.pathname.replace('/admin/', '').replace('/admin', '');

  const menuKey = subPath.startsWith('teams/') ? 'teams' : (subPath || '');

  const content = (() => {
    if (subPath.startsWith('teams/')) return <TeamDetail />;
    switch (subPath) {
      case 'users': return <UserList />;
      case 'teams': return <TeamList />;
      case 'regions': return <RegionList />;
      case 'logs': return <LogList />;
      default: return <Dashboard />;
    }
  })();

  return (
    <div className="flex h-screen bg-black">
      <div className="w-56 border-r border-white border-opacity-10 flex flex-col shrink-0">
        <div className="p-4 border-b border-white border-opacity-10">
          <h1 className="text-white font-bold text-lg">TeamBrain 管理</h1>
        </div>
        <div className="flex-1 py-4">
          {MENU.map(m => (
            <button key={m.key} onClick={() => navigate(m.key ? `/admin/${m.key}` : '/admin')}
              className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 transition-colors
                ${menuKey === m.key ? 'bg-white bg-opacity-10 text-white border-r-2 border-blue-400' : 'text-white text-opacity-60 hover:bg-white hover:bg-opacity-5'}`}>
              <span>{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white border-opacity-10">
          <button onClick={() => navigate('/')} className="w-full text-left px-3 py-2 text-sm text-white text-opacity-60 hover:bg-white hover:bg-opacity-5 rounded flex items-center space-x-2">
            <span>←</span><span>返回大脑</span>
          </button>
          <div className="text-white text-xs opacity-40 px-3 mt-2">{user?.username}</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );
};

export default AdminPage;
```

- [ ] **Step 2: 仪表盘内容 — Dashboard 组件**

```jsx
const Dashboard = () => {
  const navigate = useNavigate();
  const { regions, points: brainPoints } = useBrainData();
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const { team, nodes, connections } = useTeamData(selectedTeamId);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data));
    api.get('/admin/teams').then(r => setTeams(r.data));
  }, []);

  // Auto-select first team
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  // Region distribution for selected team
  const regionDist = {};
  if (nodes) {
    nodes.forEach(n => {
      const name = n.brainRegionName || '未知';
      regionDist[name] = (regionDist[name] || 0) + 1;
    });
  }
  const maxDist = Math.max(1, ...Object.values(regionDist));

  return (
    <div className="p-6 space-y-6">
      {/* Team selector */}
      <div className="flex items-center space-x-3">
        <label className="text-white text-sm opacity-60">选择团队：</label>
        <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(parseInt(e.target.value))}
          className="bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-1.5 text-white text-sm">
          {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '成员', value: nodes.filter(n => n.nodeType === 'MEMBER').length, color: '#44aaff' },
          { label: '项目', value: nodes.filter(n => n.nodeType === 'PROJECT').length, color: '#aa44ff' },
          { label: '脑区', value: new Set(nodes.map(n => n.brainRegionId)).size, color: '#44ffaa' },
          { label: '连接', value: connections.length, color: '#ffaa44' },
        ].map(c => (
          <div key={c.label} className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs opacity-60 text-white mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Dual panel: Mini 3D + Region distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4">
          <h3 className="text-white text-sm font-bold mb-3">3D 脑区预览</h3>
          <MiniBrain brainPoints={brainPoints} regions={regions} width={380} height={380} />
        </div>
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4">
          <h3 className="text-white text-sm font-bold mb-3">脑区节点分布</h3>
          <div className="space-y-3 mt-2">
            {Object.entries(regionDist).map(([name, count]) => {
              const region = regions.find(r => r.name === name);
              const pct = Math.round(count / maxDist * 100);
              return (
                <div key={name} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                  onClick={() => navigate(`/admin/teams/${selectedTeamId}`)}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: region?.colorHex || '#888' }} />
                  <span className="text-white text-xs w-16 shrink-0">{name}</span>
                  <div className="flex-1 h-4 bg-white bg-opacity-5 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: region?.colorHex || '#888', opacity: 0.6 }} />
                  </div>
                  <span className="text-white text-xs w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System overview */}
      {stats && (
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4 flex justify-around">
          <button onClick={() => navigate('/admin/users')} className="text-white text-sm hover:underline">
            👥 {stats.userCount} 用户
          </button>
          <button onClick={() => navigate('/admin/teams')} className="text-white text-sm hover:underline">
            🏢 {stats.teamCount} 团队
          </button>
          <button onClick={() => navigate('/admin/logs')} className="text-white text-sm hover:underline">
            📝 {stats.nodeCount} 节点
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/AdminPage.jsx
git commit -m "feat: rewrite AdminPage with dashboard, sidebar, team selector"
```

---

### Task 8: 用户管理、团队管理、脑区管理、日志页面

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (追加子页面组件)

- [ ] **Step 1: 用户管理 UserList 组件**

```jsx
const UserList = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | {id,...}
  const load = () => api.get('/admin/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form) => {
    if (modal === 'create') {
      await api.post('/admin/users', form);
    } else {
      await api.put(`/admin/users/${modal.id}`, form);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`确定删除用户 ${u.username}？此操作不可撤销。`)) return;
    await api.delete(`/admin/users/${u.id}`);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">用户管理</h2>
        <button onClick={() => setModal('create')} className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-4 py-2 rounded text-white text-sm">+ 新建用户</button>
      </div>
      <input type="text" placeholder="搜索用户名或邮箱..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm mb-4" />
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">状态</th><th className="p-3 opacity-60">用户名</th><th className="p-3 opacity-60">邮箱</th>
              <th className="p-3 opacity-60">角色</th><th className="p-3 opacity-60">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3">
                  <button onClick={async () => { await api.put(`/admin/users/${u.id}/state`, { enabled: !u.enabled }); load(); }}
                    className={`w-3 h-3 rounded-full ${u.enabled ? 'bg-green-400' : 'bg-red-400'}`} title={u.enabled ? '启用' : '禁用'} />
                </td>
                <td className="p-3">{u.username}</td><td className="p-3 opacity-60">{u.email}</td>
                <td className="p-3">{(u.roles || []).join(', ')}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => setModal(u)} className="text-blue-400 hover:underline text-xs">编辑</button>
                  {u.username !== me?.username && (
                    <button onClick={() => handleDelete(u)} className="text-red-400 hover:underline text-xs">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-black bg-opacity-80 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-bold mb-4">{modal === 'create' ? '新建用户' : '编辑用户'}</h3>
            <UserForm initial={modal === 'create' ? null : modal} onSave={handleSave} onCancel={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

const UserForm = ({ initial, onSave, onCancel }) => {
  const [username, setUsername] = useState(initial?.username || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(initial?.roles || ['USER']);
  const toggleRole = (r) => setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white text-sm mb-1">用户名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="block text-white text-sm mb-1">邮箱</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="block text-white text-sm mb-1">{initial ? '新密码（留空不修改）' : '密码'}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="block text-white text-sm mb-1">角色</label>
        <div className="flex space-x-4">
          {['USER', 'ADMIN'].map(r => (
            <label key={r} className="flex items-center space-x-2 text-white text-sm cursor-pointer">
              <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} className="w-4 h-4" />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50">取消</button>
        <button onClick={() => onSave({ username, email, password, roles })} className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50">保存</button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 团队管理 TeamList + TeamDetail 组件**

TeamList 类似用户管理的表格，加搜索、编辑弹窗、删除确认、查看详情跳转。
TeamDetail 复用现有逻辑（BrainPointCloud + 右侧节点列表），使用 `useTeamData(teamId)`。

```jsx
const TeamList = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { api.get('/admin/teams').then(r => setTeams(r.data)); }, []);

  const filtered = teams.filter(t =>
    t.teamName.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerUsername.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (t) => {
    if (!window.confirm(`确定删除团队 ${t.teamName}？节点和连接将一并删除。`)) return;
    await api.delete(`/admin/teams/${t.id}`);
    setTeams(prev => prev.filter(x => x.id !== t.id));
  };

  const handleEdit = async () => {
    await api.put(`/admin/teams/${editing.id}`, { teamName: editing.teamName, description: editing.description || '' });
    setEditing(null);
    api.get('/admin/teams').then(r => setTeams(r.data));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">团队管理</h2>
      <input type="text" placeholder="搜索团队名或所有者..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm mb-4" />
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">团队名</th><th className="p-3 opacity-60">所有者</th>
              <th className="p-3 opacity-60">成员</th><th className="p-3 opacity-60">项目</th><th className="p-3 opacity-60">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3">{t.teamName}</td><td className="p-3">{t.ownerUsername}</td>
                <td className="p-3">{t.memberCount}</td><td className="p-3">{t.projectCount}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => navigate(`/admin/teams/${t.id}`)} className="text-blue-400 hover:underline text-xs">查看</button>
                  <button onClick={() => setEditing(t)} className="text-blue-400 hover:underline text-xs">编辑</button>
                  <button onClick={() => handleDelete(t)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-black bg-opacity-80 border border-white border-opacity-20 rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-bold mb-4">编辑团队</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-1">团队名</label>
                <input type="text" value={editing.teamName} onChange={e => setEditing({ ...editing, teamName: e.target.value })}
                  className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded text-sm bg-gray-500 bg-opacity-50 text-white">取消</button>
                <button onClick={handleEdit} className="px-4 py-2 rounded text-sm bg-blue-500 bg-opacity-50 text-white">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 脑区管理 RegionList 组件**

```jsx
const RegionList = () => {
  const { regions } = useBrainData();
  const [editing, setEditing] = useState(null);
  const [list, setList] = useState([]);

  useEffect(() => { setList([...regions]); }, [regions]);

  const handleSave = async () => {
    await api.put(`/admin/regions/${editing.id}`, { name: editing.name, colorHex: editing.colorHex });
    setEditing(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">脑区管理</h2>
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">名称</th><th className="p-3 opacity-60">颜色</th><th className="p-3 opacity-60">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3 flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }} />
                  <span>{r.name}</span>
                </td>
                <td className="p-3 font-mono text-xs">{r.colorHex}</td>
                <td className="p-3">
                  <button onClick={() => setEditing({ ...r })} className="text-blue-400 hover:underline text-xs">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-black bg-opacity-80 border border-white border-opacity-20 rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-bold mb-4">编辑脑区</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-1">名称</label>
                <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">颜色</label>
                <div className="flex items-center space-x-2">
                  <input type="color" value={editing.colorHex} onChange={e => setEditing({ ...editing, colorHex: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" value={editing.colorHex} onChange={e => setEditing({ ...editing, colorHex: e.target.value })}
                    className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm font-mono" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded text-sm bg-gray-500 bg-opacity-50 text-white">取消</button>
                <button onClick={handleSave} className="px-4 py-2 rounded text-sm bg-blue-500 bg-opacity-50 text-white">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: 操作日志 LogList 组件**

```jsx
const LogList = () => {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = (p = 0) => {
    api.get('/admin/logs', { params: { action: action || undefined, page: p, size: 20 } })
      .then(r => { setLogs(r.data.content); setTotalPages(r.data.totalPages); });
  };
  useEffect(() => { load(page); }, [page, action]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">操作日志</h2>
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-white text-sm opacity-60">操作类型：</label>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}
          className="bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-1.5 text-white text-sm">
          <option value="">全部</option>
          <option value="CREATE_USER">CREATE_USER</option>
          <option value="UPDATE_USER">UPDATE_USER</option>
          <option value="DELETE_USER">DELETE_USER</option>
          <option value="DELETE_TEAM">DELETE_TEAM</option>
          <option value="UPDATE_TEAM">UPDATE_TEAM</option>
          <option value="UPDATE_REGION">UPDATE_REGION</option>
        </select>
      </div>
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">时间</th><th className="p-3 opacity-60">操作者</th>
              <th className="p-3 opacity-60">操作</th><th className="p-3 opacity-60">详情</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3 text-xs opacity-60">{l.createdAt}</td>
                <td className="p-3">{l.username}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-white bg-opacity-10">{l.action}</span></td>
                <td className="p-3 opacity-80">{l.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => { setPage(i); load(i); }}
              className={`px-3 py-1 rounded text-sm ${page === i ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-10 text-white'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: 编译验证**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/pages/AdminPage.jsx
git commit -m "feat: add user/team/region/log management to AdminPage"
```

---

### Task 9: 连接策略前端集成 + LOD 渲染优化

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (团队详情中用策略端点)
- Modify: `frontend/src/components/BrainPointCloud.jsx` (LOD)

- [ ] **Step 1: 团队详情使用策略端点**

在 TeamDetail 中，连接数据改用 `/admin/teams/{id}/connections/computed` 端点。修改 `useTeamData` 或直接在 TeamDetail 中单独请求。

```jsx
// 在 TeamDetail 中添加策略端点调用
const [strategyConns, setStrategyConns] = useState([]);
useEffect(() => {
  if (!teamId) return;
  api.get(`/admin/teams/${teamId}/connections/computed`).then(r => setStrategyConns(r.data));
}, [teamId]);
// 使用 strategyConns 替代 connRules
```

- [ ] **Step 2: BrainPointCloud LOD 优化**

在 `createDynamicConnections` 中，根据连接线的中点距离相机的远近选择不同的渲染精度：

```javascript
// 在 createDynamicConnections 中，每条连接线创建前检查距离
const midPoint = new THREE.Vector3(
  (startPoint.position.x + endPoint.position.x) / 2,
  (startPoint.position.y + endPoint.position.y) / 2,
  (startPoint.position.z + endPoint.position.z) / 2
);
const dist = cameraRef.current.position.distanceTo(midPoint);

if (dist > 10) return; // Skip far connections

if (dist > 5) {
  // Simple line instead of TubeGeometry
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    startPoint.position, endPoint.position
  ]);
  const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: opacity * 0.5 });
  const line = new THREE.Line(lineGeo, lineMat);
  sceneRef.current.add(line);
  connectionLinesRef.current.push(line);
  return; // Skip flow particles for LOD connections
}
```

- [ ] **Step 3: 编辑模态框中添加 tags 编辑**

在 BrainPointCloud 的 EditModal 中，为每个节点条目添加 tags 输入框：

```jsx
<input
  type="text"
  value={entry.tags || ''}
  onChange={(e) => updateEntry(partitionIndex, entryIndex, 'tags', e.target.value)}
  className="w-24 bg-transparent border border-white border-opacity-20 rounded px-2 py-1 text-white text-xs"
  placeholder="tags"
/>
```

并在 `updateEntry` 中支持 `tags` 字段。同时 API 更新节点时需要传 `tags`。

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/AdminPage.jsx frontend/src/components/BrainPointCloud.jsx
git commit -m "feat: integrate strategy connections, LOD rendering, node tags editing"
```

---

### Task 10: 后端编译修复 + 端到端验证

- [ ] **Step 1: 编译后端**

```bash
cd backend && mvn compile
```
Fix any compilation errors (missing imports, type mismatches). Key issues to check:
- AdminService imports for RoleRepository, PasswordEncoder, etc.
- ConnectionTypeController constructor parameters
- AdminController `@AuthenticationPrincipal` usage

- [ ] **Step 2: 编译前端**

```bash
cd frontend && npm run build
```
Fix any JSX errors.

- [ ] **Step 3: 清除旧数据并重建**

```bash
mysql --login-path=teambrain -e "DELETE FROM teambrain.audit_log;"
cd /home/mpt/projects/TeamBrain && ./build.sh
```

- [ ] **Step 4: 启动并验证**

```bash
fuser -k 8080/tcp
source ~/.bashrc && java -jar backend/target/teambrain-0.0.1.jar &
sleep 12
# Test admin APIs
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
curl -s http://localhost:8080/api/admin/users -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s "http://localhost:8080/api/admin/logs?page=0" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

- [ ] **Step 5: 浏览器验证清单**
  - `/` → 登录 → 大脑页面正常
  - `/#/admin` → 仪表盘显示团队选择器 + 迷你 3D + 分布图
  - `/#/admin/users` → 用户列表，新建/编辑/删除
  - `/#/admin/teams` → 团队列表，查看详情/编辑/删除
  - `/#/admin/regions` → 脑区列表，编辑名称/颜色
  - `/#/admin/logs` → 日志列表，筛选和分页
  - 团队详情中连接基于策略生成

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: complete admin redesign and connection strategy system"
```
