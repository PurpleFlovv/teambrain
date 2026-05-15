# TeamBrain 用户团队归属 & 关于页面 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 UserTeam 关联表实现多团队归属，三级权限模型，导航栏新增"关于"页面，我的团队只显示已加入团队。

**Architecture:** 后端新增 UserTeam 实体（复合主键），通过 UserTeamRepository 隔离依赖（User/Team 实体不持有关系映射）。前端 AuthContext 改用 teamIds 数组，首页默认展示所有者团队优先。

**Tech Stack:** Spring Boot 3.4 + JPA + MySQL, React 18 + Tailwind CSS + shadcn/ui

---

### Task 1: 后端 — UserTeam 实体 + 仓库

**Files:**
- Create: `backend/src/main/java/com/teambrain/entity/UserTeam.java`
- Create: `backend/src/main/java/com/teambrain/entity/UserTeamId.java`
- Create: `backend/src/main/java/com/teambrain/repository/UserTeamRepository.java`

- [ ] **Step 1: Write UserTeamId.java**

```java
package com.teambrain.entity;

import java.io.Serializable;
import java.util.Objects;

public class UserTeamId implements Serializable {
    private Long userId;
    private Long teamId;

    public UserTeamId() {}
    public UserTeamId(Long userId, Long teamId) { this.userId = userId; this.teamId = teamId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    @Override public boolean equals(Object o) {
        if (!(o instanceof UserTeamId)) return false;
        UserTeamId that = (UserTeamId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(teamId, that.teamId);
    }
    @Override public int hashCode() { return Objects.hash(userId, teamId); }
}
```

- [ ] **Step 2: Write UserTeam.java**

```java
package com.teambrain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_team")
@IdClass(UserTeamId.class)
public class UserTeam {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "team_id")
    private Long teamId;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    public UserTeam() {}
    public UserTeam(Long userId, Long teamId) { this.userId = userId; this.teamId = teamId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
```

- [ ] **Step 3: Write UserTeamRepository.java**

```java
package com.teambrain.repository;

import com.teambrain.entity.UserTeam;
import com.teambrain.entity.UserTeamId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserTeamRepository extends JpaRepository<UserTeam, UserTeamId> {
    List<UserTeam> findByUserId(Long userId);
    List<UserTeam> findByTeamId(Long teamId);
    void deleteByUserIdAndTeamId(Long userId, Long teamId);
}
```

- [ ] **Step 4: 编译**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/teambrain/entity/UserTeam.java backend/src/main/java/com/teambrain/entity/UserTeamId.java backend/src/main/java/com/teambrain/repository/UserTeamRepository.java
git commit -m "feat: add UserTeam entity and repository for multi-team membership"
```

---

### Task 2: 后端 — LoginResponse + AuthService 修改

**Files:**
- Modify: `backend/src/main/java/com/teambrain/dto/LoginResponse.java`
- Modify: `backend/src/main/java/com/teambrain/service/AuthService.java`

- [ ] **Step 1: 修改 LoginResponse.java**

Read the file, replace the `teamId` field with `teamIds`:

```java
// Replace: private Long teamId;
private List<Long> teamIds;
private Long ownedTeamId;

// Replace constructor parameter: Long teamId → Long ownedTeamId, List<Long> teamIds
public LoginResponse(String token, Long userId, String username, Long ownedTeamId, List<Long> teamIds, List<String> roles) {
    this.token = token;
    this.userId = userId;
    this.username = username;
    this.ownedTeamId = ownedTeamId;
    this.teamIds = teamIds;
    this.roles = roles;
}

// Replace getter: getTeamId() → getTeamIds() and add getOwnedTeamId()
public List<Long> getTeamIds() { return teamIds; }
public Long getOwnedTeamId() { return ownedTeamId; }
```

- [ ] **Step 2: 修改 AuthService.java**

Read the file. Inject `UserTeamRepository` into the constructor. Modify `login()`:

```java
// In login() method, after finding the user:
Long ownedTeamId = teamRepository.findByUserId(user.getId())
    .map(Team::getId).orElse(null);
List<Long> teamIds = userTeamRepository.findByUserId(user.getId())
    .stream().map(UserTeam::getTeamId).toList();
// Also include owned team if not already in the list
if (ownedTeamId != null && !teamIds.contains(ownedTeamId)) {
    teamIds = new java.util.ArrayList<>(teamIds);
    teamIds.add(0, ownedTeamId);
}

return new LoginResponse(token, user.getId(), user.getUsername(), ownedTeamId, teamIds, roles);
```

Modify `register()`: **Remove** the `teamRepository.save(...)` line. Also remove the `brainRegionService` dependency if only used for team creation. If `brainRegionService` is used elsewhere, keep the injection.

- [ ] **Step 3: 编译**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/com/teambrain/dto/LoginResponse.java backend/src/main/java/com/teambrain/service/AuthService.java
git commit -m "feat: LoginResponse teamId→teamIds, remove auto-create team on register"
```

---

### Task 3: 后端 — TeamService + TeamController 成员管理

**Files:**
- Modify: `backend/src/main/java/com/teambrain/service/TeamService.java`
- Modify: `backend/src/main/java/com/teambrain/controller/TeamController.java`

- [ ] **Step 1: 修改 TeamService.java**

Read the file. Inject `UserTeamRepository` and `UserRepository` into constructor. Add methods:

```java
private final UserTeamRepository userTeamRepo;
private final UserRepository userRepo;
// Add to constructor

public boolean isOwner(Long teamId, Long userId) {
    return teamRepository.findById(teamId)
        .map(t -> t.getUser().getId().equals(userId))
        .orElse(false);
}

public boolean isOwner(Long teamId, String username) {
    User user = userRepo.findByUsername(username).orElse(null);
    if (user == null) return false;
    return isOwner(teamId, user.getId());
}

public List<Map<String, Object>> getMyTeams(Long userId) {
    List<UserTeam> memberships = userTeamRepo.findByUserId(userId);
    return memberships.stream().map(ut -> {
        Team t = teamRepository.findById(ut.getTeamId()).orElse(null);
        if (t == null) return null;
        long nodeCount = teamNodeRepository.findByTeamId(t.getId()).size();
        return Map.<String, Object>of(
            "id", t.getId(), "teamName", t.getTeamName(),
            "description", t.getDescription() != null ? t.getDescription() : "",
            "ownerUsername", t.getUser().getUsername(),
            "nodeCount", nodeCount,
            "isOwner", t.getUser().getId().equals(userId)
        );
    }).filter(Objects::nonNull).toList();
}

public List<Map<String, Object>> getMembers(Long teamId) {
    List<UserTeam> memberships = userTeamRepo.findByTeamId(teamId);
    return memberships.stream().map(ut -> {
        User u = userRepo.findById(ut.getUserId()).orElse(null);
        if (u == null) return null;
        return Map.<String, Object>of(
            "id", u.getId(), "username", u.getUsername(),
            "isOwner", isOwner(teamId, u.getId())
        );
    }).filter(Objects::nonNull).toList();
}

public void joinTeam(Long teamId, Long userId) {
    userTeamRepo.save(new UserTeam(userId, teamId));
}

public void leaveTeam(Long teamId, Long userId) {
    userTeamRepo.deleteByUserIdAndTeamId(userId, teamId);
}

public void removeMember(Long teamId, Long userId) {
    userTeamRepo.deleteByUserIdAndTeamId(userId, teamId);
}
```

- [ ] **Step 2: 修改 TeamController.java**

Read the file. Add new endpoints and inject UserRepository:

```java
private final UserRepository userRepo;
// Add to constructor

@GetMapping("/my")
public ResponseEntity<List<Map<String, Object>>> getMyTeams(@AuthenticationPrincipal UserDetails ud) {
    User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
    return ResponseEntity.ok(teamService.getMyTeams(user.getId()));
}

@GetMapping("/{id}/members")
public ResponseEntity<List<Map<String, Object>>> getMembers(@PathVariable Long id) {
    return ResponseEntity.ok(teamService.getMembers(id));
}

// Update existing join endpoint:
@PostMapping("/{id}/join")
public ResponseEntity<?> joinTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
    User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
    teamService.joinTeam(id, user.getId());
    return ResponseEntity.ok(Map.of("message", "已加入"));
}

@DeleteMapping("/{id}/leave")
public ResponseEntity<?> leaveTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
    User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
    teamService.leaveTeam(id, user.getId());
    return ResponseEntity.ok(Map.of("message", "已退出"));
}

@DeleteMapping("/{id}/members/{userId}")
public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable Long userId,
                                       @AuthenticationPrincipal UserDetails ud) {
    User currentUser = userRepo.findByUsername(ud.getUsername()).orElseThrow();
    if (!teamService.isOwner(id, currentUser.getId())) {
        return ResponseEntity.status(403).body(Map.of("error", "无权操作"));
    }
    teamService.removeMember(id, userId);
    return ResponseEntity.ok(Map.of("message", "已移除"));
}
```

- [ ] **Step 3: Add `/api/user/teams` endpoint**

The `/api/teams/my` endpoint above serves this purpose. But the spec wants `/api/user/teams`. Map it in TeamController:

```java
@GetMapping("/api/user/teams")
public ResponseEntity<List<Map<String, Object>>> getUserTeams(@AuthenticationPrincipal UserDetails ud) {
    User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
    return ResponseEntity.ok(teamService.getMyTeams(user.getId()));
}
```

- [ ] **Step 4: 编译**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/TeamService.java backend/src/main/java/com/teambrain/controller/TeamController.java
git commit -m "feat: team membership management endpoints (join/leave/members/my-teams)"
```

---

### Task 4: 后端 — AdminService + AdminController 调整

**Files:**
- Modify: `backend/src/main/java/com/teambrain/service/AdminService.java`
- Modify: `backend/src/main/java/com/teambrain/controller/AdminController.java`

- [ ] **Step 1: 修改 AdminService.createUser() — 移除自动创建团队**

Read the file. In `createUser()`, find the line `Team team = teamRepository.save(...)` and `brainRegionService.copyTemplatesForTeam(...)`. Remove both lines.

- [ ] **Step 2: 修改 AdminService.getAllUsers() — 增加 ownedTeamName 和 teamCount**

Read the file. `getAllUsers()` is at line ~57. Inject `UserTeamRepository`:

```java
private final UserTeamRepository userTeamRepo;
// Add to constructor

// In getAllUsers(), add:
String ownedTeamName = null;
Team owned = teamRepository.findByUserId(u.getId()).orElse(null);
if (owned != null) ownedTeamName = owned.getTeamName();
int teamCount = userTeamRepo.findByUserId(u.getId()).size();

m.put("ownedTeamName", ownedTeamName);
m.put("teamCount", teamCount);
```

- [ ] **Step 3: 修改 AdminController — 允许 TEAM_ADMIN 访问团队端点**

Read the file. In endpoints `GET /teams/{id}/nodes` and `PUT /teams/{id}`, add `@AuthenticationPrincipal` and check `teamService.isOwner()`:

```java
@GetMapping("/teams/{id}/nodes")
public ResponseEntity<List<TeamNodeDto>> getTeamNodes(@PathVariable Long id,
    @AuthenticationPrincipal UserDetails ud) {
    if (!teamService.isOwner(id, ud.getUsername()) && !isAdmin(ud)) {
        return ResponseEntity.status(403).build();
    }
    return ResponseEntity.ok(teamNodeService.getTeamNodes(id));
}
```

- [ ] **Step 4: 编译**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/AdminService.java backend/src/main/java/com/teambrain/controller/AdminController.java
git commit -m "feat: remove auto-create team, add teamCount to users, TEAM_ADMIN access"
```

---

### Task 5: 后端 — MockDataSeeder user_team 数据

**Files:**
- Modify: `backend/src/main/java/com/teambrain/config/MockDataSeeder.java`
- Modify: `backend/src/main/java/com/teambrain/config/SecurityConfig.java`

- [ ] **Step 1: 修改 MockDataSeeder.java**

Read the file. Inject `UserTeamRepository`. After creating all teams and users, add cross-memberships:

```java
private final UserTeamRepository userTeamRepo;
// Add to constructor

// After the team creation loop, add memberships:
// Each team owner is already set via team.user_id
// Add cross-memberships for richer demo data
userTeamRepo.save(new UserTeam(11L, 6L));  // user11 joins 星辰科技 (team owned by user10)
userTeamRepo.save(new UserTeam(12L, 6L));  // user12 joins 星辰科技
userTeamRepo.save(new UserTeam(13L, 7L));  // user13 joins 云帆教育
userTeamRepo.save(new UserTeam(14L, 7L));  // user14 joins 云帆教育
userTeamRepo.save(new UserTeam(10L, 8L));  // user10 joins 极光设计
```

- [ ] **Step 2: 修改 SecurityConfig.java**

Read the file. Add `/api/about` to permitAll if needed (the about page is frontend-only, but if there's an API endpoint):

Actually, the About page is pure frontend content. No backend API needed. Skip adding to SecurityConfig.

- [ ] **Step 3: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
git add backend/src/main/java/com/teambrain/config/MockDataSeeder.java
git commit -m "feat: add cross-team memberships to mock data"
```

---

### Task 6: 前端 — AuthContext teamId → teamIds

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Read and modify AuthContext.jsx**

Change the userData in login/register from single `teamId` to `teamIds` + `ownedTeamId`:

```jsx
const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    const userData = {
        id: data.userId,
        username: data.username,
        teamIds: data.teamIds || [],
        ownedTeamId: data.ownedTeamId || null,
        roles: data.roles || []
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
};

const register = async (username, password) => {
    const { data } = await api.post('/auth/register', { username, password });
    localStorage.setItem('token', data.token);
    const userData = {
        id: data.userId,
        username: data.username,
        teamIds: data.teamIds || [],
        ownedTeamId: data.ownedTeamId || null,
        roles: data.roles || []
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
};
```

- [ ] **Step 2: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: AuthContext teamId→teamIds+ownedTeamId"
```

---

### Task 7: 前端 — About 页面 + Navbar 更新 + 路由

**Files:**
- Create: `frontend/src/pages/About.jsx`
- Modify: `frontend/src/components/Navbar.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create About.jsx**

```jsx
import React from 'react';
import PageShell from '../components/shared/PageShell';
import GlassCard from '../components/shared/GlassCard';

const About = () => (
  <PageShell maxWidth="max-w-2xl">
    <GlassCard className="p-8 text-center">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">TeamBrain</h1>
      <p className="text-[var(--text-muted)] leading-relaxed mb-4">
        TeamBrain 是一个组织架构可视化平台。将团队的成员和项目映射到 3D 大脑模型的不同脑区，直观展示组织结构和协作关系。
      </p>
      <p className="text-[var(--text-muted)] leading-relaxed mb-4">
        支持多团队、角色权限（系统管理员 / 团队管理员 / 普通用户）、自动连接策略（同区协作、负责关系、跨区桥接）和拖拽交互。
      </p>
      <p className="text-[var(--text-muted)] text-sm mt-8">
        技术栈：Spring Boot 3.4 + React 18 + Three.js + Tailwind CSS
      </p>
    </GlassCard>
  </PageShell>
);

export default About;
```

- [ ] **Step 2: 修改 Navbar.jsx**

Read the file. Add "关于" link after "个人信息":

```jsx
<button onClick={() => navigate('/profile')} className={linkClass}>个人信息</button>
<button onClick={() => navigate('/about')} className={linkClass}>关于</button>
```

- [ ] **Step 3: 修改 App.jsx**

Read the file. Add About import and route:

```jsx
import About from "./pages/About";

// Add route (public, no ProtectedLayout needed):
<Route path="/about" element={<ProtectedLayout><About /></ProtectedLayout>} />
```

- [ ] **Step 4: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
git add frontend/src/pages/About.jsx frontend/src/components/Navbar.jsx frontend/src/App.jsx
git commit -m "feat: add About page, update Navbar and routing"
```

---

### Task 8: 前端 — Index.jsx 默认团队逻辑

**Files:**
- Modify: `frontend/src/pages/Index.jsx`

- [ ] **Step 1: 改写默认团队选择逻辑**

Read the file. Replace the `activeTeamId` selection:

```jsx
// After loading allTeams, compute default:
useEffect(() => {
    if (allTeams.length === 0 || activeTeamId) return;
    // 1. Owned team first
    const owned = allTeams.find(t => t.ownerId === user?.id);
    if (owned) { setActiveTeamId(owned.id); return; }
    // 2. First joined team
    if (user?.teamIds?.length > 0) { setActiveTeamId(user.teamIds[0]); return; }
    // 3. Default demo team
    setActiveTeamId(1);
}, [allTeams, activeTeamId, user]);
```

Also remove the `ownedTeamId` concept from the team selector dropdown — adapt to the `teamIds` array.

- [ ] **Step 2: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
git add frontend/src/pages/Index.jsx
git commit -m "feat: Index default team logic (owner→joined→demo)"
```

---

### Task 9: 前端 — MyTeams + MyTeamDetail 重构

**Files:**
- Modify: `frontend/src/pages/MyTeams.jsx`
- Modify: `frontend/src/pages/MyTeamDetail.jsx`

- [ ] **Step 1: 修改 MyTeams.jsx**

Read the file. Change from `api.get('/teams/public')` to `api.get('/user/teams')`:

```jsx
useEffect(() => {
    api.get('/user/teams').then(r => setTeams(r.data)).catch(() => {});
}, []);
```

Add `overflow-y-auto` class to the content container. Apply `scrollbar-glass` class.

- [ ] **Step 2: 修改 MyTeamDetail.jsx — 只读视图**

Read the file. Remove the TeamEditor component and its imports. Replace with a simple read-only view:

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import BrainPointCloud from '../components/BrainPointCloud';
import GlassCard from '../components/shared/GlassCard';
import PageShell from '../components/shared/PageShell';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';

const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();
  const { regions, points: brainPoints } = useBrainData(teamId);
  const { team, nodes, connections: connRules } = useTeamData(teamId);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get(`/teams/${teamId}/members`).then(r => setMembers(r.data)).catch(() => {});
  }, [teamId]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-[var(--glass-border)] flex items-center space-x-2 text-sm">
        <button onClick={() => navigate('/my-teams')} className="text-[var(--accent)] hover:underline flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>我的团队</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {/* Team info */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{team?.teamName}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{team?.description}</p>
          <div className="mt-3 text-sm text-[var(--text-muted)]">
            <span>所有者：</span>
            <span className="text-[var(--text-primary)]">{team?.ownerUsername || '—'}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-sm text-[var(--text-muted)]">团队成员（{members.length}人）：</span>
            {members.map(m => (
              <span key={m.id} className="px-2 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)]">
                {m.username}{m.isOwner ? '（所有者）' : ''}
              </span>
            ))}
          </div>
        </div>
        {/* 3D Brain (read-only) */}
        <div className="flex-1 relative">
          <BrainPointCloud brainPoints={brainPoints} regions={regions} team={team} nodes={nodes} connRules={connRules} onRefresh={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default MyTeamDetail;
```

- [ ] **Step 3: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
git add frontend/src/pages/MyTeams.jsx frontend/src/pages/MyTeamDetail.jsx
git commit -m "feat: MyTeams shows only joined teams, MyTeamDetail read-only with members"
```

---

### Task 10: 前端 — AdminPage 用户列表 + 团队数列 + scrollbar

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx`
- Modify: `frontend/src/pages/TeamSquare.jsx`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 修改 AdminPage.jsx — 用户列表**

Read the file. In the UserList table, add "团队" and "团队数" columns after "角色":

```jsx
<th className="p-3 opacity-60">角色</th>
<th className="p-3 opacity-60">团队</th>
<th className="p-3 opacity-60">团队数</th>
<th className="p-3 opacity-60">操作</th>

// In each row:
<td className="p-3">{(u.roles || []).join(', ')}</td>
<td className="p-3">{u.ownedTeamName || '—'}</td>
<td className="p-3">{u.teamCount || 0}</td>
<td className="p-3 space-x-2">
```

Also on the Dashboard, update `user?.teamId` references to use `user?.teamIds` if any exist.

- [ ] **Step 2: 修改 TeamSquare.jsx — 滚动**

Read the file. Add `overflow-y-auto scrollbar-glass` to the content container.

- [ ] **Step 3: 修改 index.css — 滚动条样式**

Read the file. Add at the end:

```css
.scrollbar-glass::-webkit-scrollbar { width: 6px; }
.scrollbar-glass::-webkit-scrollbar-track { background: transparent; }
.scrollbar-glass::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}
.scrollbar-glass::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
```

- [ ] **Step 4: 编译和提交**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
git add frontend/src/pages/AdminPage.jsx frontend/src/pages/TeamSquare.jsx frontend/src/index.css
git commit -m "feat: admin user list team columns, scrollbar styling"
```

---

### Task 11: 集成构建 + 端到端验证

- [ ] **Step 1: 清除旧数据（保留 admin + 影视飓风）**

```bash
mysql --login-path=teambrain teambrain -e "
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM user_team;
DELETE FROM node_connection WHERE team_id NOT IN (1);
DELETE FROM team_node WHERE team_id NOT IN (1);
DELETE FROM brain_region WHERE team_id IS NOT NULL AND team_id NOT IN (1);
DELETE FROM team WHERE id NOT IN (1);
DELETE FROM sys_user_role WHERE user_id NOT IN (1);
DELETE FROM sys_user WHERE id NOT IN (1);
SET FOREIGN_KEY_CHECKS=1;
" 2>&1
```

- [ ] **Step 2: 完整构建**

```bash
cd /home/mpt/projects/TeamBrain && ./build.sh
```

- [ ] **Step 3: 启动并验证**

```bash
fuser -k 8080/tcp
source ~/.bashrc && java -jar backend/target/teambrain-0.0.1.jar &
sleep 16
```

API 验证清单：
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# 1. Admin login → teamIds should be empty or have 1
curl -s http://localhost:8080/api/admin/users -H "Authorization: Bearer $TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(u['username'], 'teams:', u.get('teamCount',0)) for u in d]"

# 2. Register a new user
curl -s -X POST http://localhost:8080/api/auth/register -H 'Content-Type: application/json' -d '{"username":"newuser","password":"123456"}'

# 3. Login as new user → teamIds should be []
TOKEN2=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"newuser","password":"123456"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# 4. Join team 1
curl -s -X POST http://localhost:8080/api/teams/1/join -H "Authorization: Bearer $TOKEN2"

# 5. My teams
curl -s http://localhost:8080/api/user/teams -H "Authorization: Bearer $TOKEN2" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'teams')"

# 6. Team members
curl -s http://localhost:8080/api/teams/1/members -H "Authorization: Bearer $TOKEN2" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(m['username']) for m in d]"

# 7. Page loads
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/#/about
```

- [ ] **Step 4: 浏览器验证清单**
  - `http://localhost:8080/#/about` → 显示系统概述
  - `http://localhost:8080/#/my-teams` → 仅显示已加入团队，可滚动
  - `http://localhost:8080/#/my-teams/:id` → 只读（名称+描述+所有者+成员+3D大脑）
  - `http://localhost:8080/#/admin/users` → 用户列表含团队+团队数列
  - 新用户注册后首页显示影视飓风，可加入团队

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: complete user-team membership and about page"
```
