# TeamBrain 管理后台修复与重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复仪表盘方向/布局、用户管理、团队管理、脑区重构为团队级、导航栏+路由重构。

**Architecture:** 脑区改为团队级（brain_region 加 team_id + template_region_id），团队创建时从全局模板复制。前端加顶部导航栏，AdminPage 重写，新增 MyTeams/TeamSquare/JoinTeam/Profile 页面。BrainPointCloud 移除编辑模态框，功能合并到团队编辑子页面。

**Tech Stack:** Spring Boot 3.4 + JPA + MySQL, React 18 + Three.js + Tailwind CSS + HashRouter

---

### Task 1: 后端 — BrainRegion 实体 + data.sql + 脑区服务重构

**Files:**
- Modify: `backend/src/main/java/com/teambrain/entity/BrainRegion.java`
- Modify: `backend/src/main/resources/data.sql`
- Create: `backend/src/main/java/com/teambrain/service/BrainRegionService.java`
- Create: `backend/src/main/java/com/teambrain/controller/BrainRegionController.java`

- [ ] **Step 1: 修改 BrainRegion.java 加两列**

在现有字段后添加：
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "team_id")
private Team team;  // null = global template

@Column(name = "template_region_id")
private Long templateRegionId;  // maps to template brain_region.id
```

添加 getter/setter。

- [ ] **Step 2: 修改 data.sql**

6 条脑区加 `team_id, template_region_id` 均为 NULL：
```sql
INSERT IGNORE INTO brain_region (id, name, color_hex, sort_order, team_id, template_region_id) VALUES
(1, '前额叶', '#FFB347', 1, NULL, NULL),
(2, '额叶后部', '#44AAFF', 2, NULL, NULL),
(3, '顶叶', '#AA44FF', 3, NULL, NULL),
(4, '颞叶', '#44FFAA', 4, NULL, NULL),
(5, '枕叶', '#FF8844', 5, NULL, NULL),
(6, '小脑/脑干', '#FF4477', 6, NULL, NULL);
```

- [ ] **Step 3: 创建 BrainRegionService.java**

```java
package com.teambrain.service;

import com.teambrain.entity.BrainRegion;
import com.teambrain.entity.Team;
import com.teambrain.repository.BrainRegionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BrainRegionService {

    private final BrainRegionRepository regionRepo;
    private final TeamNodeRepository nodeRepo;
    private final TeamRepository teamRepo;

    public BrainRegionService(BrainRegionRepository regionRepo, TeamNodeRepository nodeRepo,
                               TeamRepository teamRepo) {
        this.regionRepo = regionRepo;
        this.nodeRepo = nodeRepo;
        this.teamRepo = teamRepo;
    }

    /** Get team regions (or template regions if teamId is null) */
    public List<BrainRegion> getRegions(Long teamId) {
        if (teamId == null) return regionRepo.findByTeamIsNullOrderBySortOrderAsc();
        return regionRepo.findByTeamIdOrderBySortOrderAsc(teamId);
    }

    /** Create team regions by copying templates */
    @Transactional
    public List<BrainRegion> copyTemplatesForTeam(Long teamId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        List<BrainRegion> templates = regionRepo.findByTeamIsNullOrderBySortOrderAsc();
        List<BrainRegion> copies = new ArrayList<>();
        int sort = 1;
        for (BrainRegion t : templates) {
            BrainRegion r = new BrainRegion();
            r.setTeam(team);
            r.setName(t.getName());
            r.setColorHex(t.getColorHex());
            r.setSortOrder(sort++);
            r.setTemplateRegionId(t.getId());
            copies.add(regionRepo.save(r));
        }
        return copies;
    }

    /** Create a new team region (must specify template mapping) */
    public BrainRegion createRegion(Long teamId, String name, String colorHex, Long templateRegionId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        BrainRegion r = new BrainRegion();
        r.setTeam(team);
        r.setName(name);
        r.setColorHex(colorHex != null ? colorHex : "#888888");
        r.setTemplateRegionId(templateRegionId);
        int maxSort = regionRepo.findByTeamIdOrderBySortOrderAsc(teamId).stream()
                .mapToInt(BrainRegion::getSortOrder).max().orElse(0);
        r.setSortOrder(maxSort + 1);
        return regionRepo.save(r);
    }

    /** Update region name/color */
    public BrainRegion updateRegion(Long regionId, String name, String colorHex) {
        BrainRegion r = regionRepo.findById(regionId).orElseThrow();
        if (name != null) r.setName(name);
        if (colorHex != null) r.setColorHex(colorHex);
        return regionRepo.save(r);
    }

    /** Delete region (min 1). Reassign nodes or set null. */
    @Transactional
    public void deleteRegion(Long regionId, Long reassignToRegionId, boolean setUnassigned) {
        BrainRegion r = regionRepo.findById(regionId).orElseThrow();
        Team team = r.getTeam();
        List<BrainRegion> teamRegions = regionRepo.findByTeamIdOrderBySortOrderAsc(team.getId());
        if (teamRegions.size() <= 1) throw new RuntimeException("至少保留一个脑区");

        if (setUnassigned) {
            nodeRepo.findByTeamIdAndBrainRegionId(team.getId(), regionId)
                    .forEach(n -> { n.setBrainRegion(null); nodeRepo.save(n); });
        } else if (reassignToRegionId != null) {
            BrainRegion target = regionRepo.findById(reassignToRegionId).orElseThrow();
            nodeRepo.findByTeamIdAndBrainRegionId(team.getId(), regionId)
                    .forEach(n -> { n.setBrainRegion(target); nodeRepo.save(n); });
        }
        regionRepo.delete(r);
    }

    /** Merge source regions into target region */
    @Transactional
    public void mergeRegions(Long teamId, List<Long> sourceIds, Long targetId) {
        BrainRegion target = regionRepo.findById(targetId).orElseThrow();
        for (Long sid : sourceIds) {
            if (sid.equals(targetId)) continue;
            nodeRepo.findByTeamIdAndBrainRegionId(teamId, sid)
                    .forEach(n -> { n.setBrainRegion(target); nodeRepo.save(n); });
            regionRepo.deleteById(sid);
        }
    }

    /** Reorder regions */
    @Transactional
    public void reorder(Long teamId, List<Long> orderedIds) {
        int sort = 1;
        for (Long id : orderedIds) {
            regionRepo.findById(id).ifPresent(r -> {
                r.setSortOrder(sort++);
                regionRepo.save(r);
            });
        }
    }
}
```

- [ ] **Step 4: 创建 BrainRegionController.java**

```java
package com.teambrain.controller;

import com.teambrain.entity.BrainRegion;
import com.teambrain.service.BrainRegionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams/{teamId}/regions")
public class BrainRegionController {

    private final BrainRegionService regionService;

    public BrainRegionController(BrainRegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping
    public ResponseEntity<List<BrainRegion>> list(@PathVariable Long teamId) {
        return ResponseEntity.ok(regionService.getRegions(teamId));
    }

    @PostMapping
    public ResponseEntity<BrainRegion> create(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(regionService.createRegion(teamId,
            (String) body.get("name"), (String) body.get("colorHex"),
            ((Number) body.get("templateRegionId")).longValue()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrainRegion> update(@PathVariable Long teamId, @PathVariable Long id,
                                               @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(regionService.updateRegion(id, body.get("name"), body.get("colorHex")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long teamId, @PathVariable Long id,
                                     @RequestBody Map<String, Object> body) {
        boolean unassigned = Boolean.TRUE.equals(body.get("setUnassigned"));
        Long reassignTo = body.containsKey("reassignToRegionId") ?
                ((Number) body.get("reassignToRegionId")).longValue() : null;
        regionService.deleteRegion(id, reassignTo, unassigned);
        return ResponseEntity.ok(Map.of("message", "已删除"));
    }

    @PostMapping("/merge")
    public ResponseEntity<?> merge(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> sourceIds = ((List<Number>) body.get("sourceIds")).stream()
                .map(Number::longValue).toList();
        Long targetId = ((Number) body.get("targetId")).longValue();
        regionService.mergeRegions(teamId, sourceIds, targetId);
        return ResponseEntity.ok(Map.of("message", "已合并"));
    }

    @PutMapping("/reorder")
    public ResponseEntity<?> reorder(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> ids = ((List<Number>) body.get("orderedIds")).stream()
                .map(Number::longValue).toList();
        regionService.reorder(teamId, ids);
        return ResponseEntity.ok(Map.of("message", "已排序"));
    }
}
```

- [ ] **Step 5: 修改 BrainRegionRepository 加查询方法**

Read the existing repository, add:
```java
List<BrainRegion> findByTeamIdOrderBySortOrderAsc(Long teamId);
List<BrainRegion> findByTeamIsNullOrderBySortOrderAsc();
```

- [ ] **Step 6: 编译验证**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 7: 提交**

```bash
git add backend/src/main/java/com/teambrain/entity/BrainRegion.java backend/src/main/resources/data.sql backend/src/main/java/com/teambrain/service/BrainRegionService.java backend/src/main/java/com/teambrain/controller/BrainRegionController.java backend/src/main/java/com/teambrain/repository/BrainRegionRepository.java
git commit -m "feat: team-scoped brain regions with template mapping"
```

---

### Task 2: 后端 — AdminService/AdminController 补齐 + 节点移脑区 + 加入团队

**Files:**
- Modify: `backend/src/main/java/com/teambrain/service/AdminService.java`
- Modify: `backend/src/main/java/com/teambrain/controller/AdminController.java`
- Modify: `backend/src/main/java/com/teambrain/service/TeamNodeService.java`
- Modify: `backend/src/main/java/com/teambrain/controller/TeamController.java`

- [ ] **Step 1: AdminService 加创建团队方法**

在 AdminService 中注入 BrainRegionService，添加：
```java
private final BrainRegionService brainRegionService;

public Team createTeam(String teamName, String description, Long userId, String adminUsername) {
    User owner = userRepository.findById(userId).orElseThrow();
    Team team = new Team(teamName, description != null ? description : "", owner);
    team = teamRepository.save(team);
    brainRegionService.copyTemplatesForTeam(team.getId());
    log(adminUsername, "CREATE_TEAM", teamName);
    return team;
}
```

修改 getAllUsers 返回加上 teamId/teamName：
```java
public List<Map<String, Object>> getAllUsers() {
    return userRepository.findAll().stream().map(u -> {
        Team t = teamRepository.findByUserId(u.getId()).orElse(null);
        return Map.<String, Object>of(
            "id", u.getId(), "username", u.getUsername(),
            "email", u.getEmail() != null ? u.getEmail() : "",
            "enabled", u.getEnabled(),
            "roles", u.getRoles().stream().map(r -> r.getName()).toList(),
            "teamId", t != null ? t.getId() : null,
            "teamName", t != null ? t.getTeamName() : null
        );
    }).toList();
}
```

修改 getAllTeams 返回加 description：
```java
"description", t.getDescription() != null ? t.getDescription() : ""
```

- [ ] **Step 2: AdminController 加创建团队端点**

```java
@PostMapping("/teams")
public ResponseEntity<?> createTeam(@RequestBody Map<String, String> body,
                                     @AuthenticationPrincipal UserDetails ud) {
    adminService.createTeam(body.get("teamName"), body.get("description"),
            Long.parseLong(body.getOrDefault("ownerId", "1")), username(ud));
    return ResponseEntity.ok(Map.of("message", "团队已创建"));
}
```

- [ ] **Step 3: 节点移脑区端点**

在 AdminController 或 TeamNodeController 添加：
```java
@PutMapping("/api/nodes/{id}/region")
public ResponseEntity<?> moveRegion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
    Long regionId = body.get("brainRegionId") != null ? 
            ((Number) body.get("brainRegionId")).longValue() : null;
    teamNodeService.moveNodeToRegion(id, regionId);
    return ResponseEntity.ok(Map.of("message", "已移动"));
}
```

在 TeamNodeService 添加：
```java
public void moveNodeToRegion(Long nodeId, Long regionId) {
    TeamNode node = nodeRepo.findById(nodeId).orElseThrow();
    if (regionId != null) {
        BrainRegion region = regionRepo.findById(regionId).orElseThrow();
        node.setBrainRegion(region);
    } else {
        node.setBrainRegion(null);
    }
    nodeRepo.save(node);
}
```

- [ ] **Step 4: 加入团队端点**

在 TeamController 添加：
```java
@PostMapping("/{id}/join")
public ResponseEntity<?> joinTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
    // Currently just redirects to team page - team membership is 1:1 user:team
    // For multi-team support, need a user_team join table (future)
    return ResponseEntity.ok(Map.of("message", "已加入"));
}
```

- [ ] **Step 5: 编译验证**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/com/teambrain/service/AdminService.java backend/src/main/java/com/teambrain/controller/AdminController.java backend/src/main/java/com/teambrain/service/TeamNodeService.java backend/src/main/java/com/teambrain/controller/TeamController.java
git commit -m "feat: create team, move node region, join team endpoints"
```

---

### Task 3: 后端 — 点云 API 支持 teamId 映射

**Files:**
- Modify: `backend/src/main/java/com/teambrain/service/BrainRegionService.java` (追加方法)
- Modify: `backend/src/main/java/com/teambrain/controller/BrainRegionController.java` (追加端点)

- [ ] **Step 1: BrainRegionService 加点云映射方法**

```java
public List<Map<String, Object>> getPointsMappedToTeamRegions(Long teamId) {
    List<BrainRegion> teamRegions = getRegions(teamId);
    // Build template_id -> team region map
    Map<Long, BrainRegion> map = new HashMap<>();
    for (BrainRegion r : teamRegions) {
        if (r.getTemplateRegionId() != null) {
            // Multiple team regions can map to same template; use first for point data
            map.putIfAbsent(r.getTemplateRegionId(), r);
        }
    }
    // For each brain_point (via pointRepo), remap regionId/name/color to team's
    // ... implementation depends on BrainPointRepository query
}
```

- [ ] **Step 2: 修改 GET /api/brain/points 支持 ?teamId= 查询参数**

在现有的 BrainRegionController（GET /api/brain/points）中，如果传了 teamId，则用团队脑区映射后的名称和颜色返回点云。

- [ ] **Step 3: 编译和提交**

---

### Task 4: 前端 — MiniBrain 方向修复 + Y/Z 坐标统一

**Files:**
- Modify: `frontend/src/components/MiniBrain.jsx`

- [ ] **Step 1: 修复 MiniBrain 坐标交换**

将 `sphere.position.set(p.x, p.y, p.z);` 改为：
```javascript
// Y/Z swap — consistent with BrainPointCloud
const x = p.x;
const y = p.z;  // point[2]
const z = p.y;  // point[1]
sphere.position.set(x, y, z);
```

- [ ] **Step 2: 编译验证**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
```

- [ ] **Step 3: 提交**

---

### Task 5: 前端 — 导航栏 + 路由重构

**Files:**
- Modify: `frontend/src/App.jsx` (加导航栏、新路由)
- Modify: `frontend/src/pages/Index.jsx` (移除右上角编辑按钮)
- Create: `frontend/src/components/Navbar.jsx` (顶部导航栏组件)

- [ ] **Step 1: 创建 Navbar.jsx**

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-14 bg-black bg-opacity-80 backdrop-blur-sm border-b border-white border-opacity-10 flex items-center justify-between px-6 shrink-0">
      <button onClick={() => navigate('/')} className="text-white font-bold text-lg">TeamBrain</button>
      <div className="flex items-center space-x-1">
        <button onClick={() => navigate('/my-teams')} className="px-3 py-2 text-white text-sm text-opacity-60 hover:text-opacity-100 rounded">我的团队</button>
        <button onClick={() => navigate('/teams')} className="px-3 py-2 text-white text-sm text-opacity-60 hover:text-opacity-100 rounded">团队广场</button>
        <button onClick={() => navigate('/profile')} className="px-3 py-2 text-white text-sm text-opacity-60 hover:text-opacity-100 rounded">个人信息</button>
        {user?.roles?.includes('ADMIN') && (
          <button onClick={() => navigate('/admin')} className="px-3 py-2 text-white text-sm text-opacity-60 hover:text-opacity-100 rounded border border-white border-opacity-20 ml-2">管理</button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
```

- [ ] **Step 2: 修改 App.jsx**

```jsx
import Navbar from './components/Navbar';

// Add Navbar to ProtectedRoute wrapper
const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <div className="flex flex-col h-screen bg-black">
      <Navbar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  </ProtectedRoute>
);

const AppRoutes = () => (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
      <Route path="/my-teams" element={<ProtectedLayout><MyTeams /></ProtectedLayout>} />
      <Route path="/my-teams/:id" element={<ProtectedLayout><MyTeamDetail /></ProtectedLayout>} />
      <Route path="/teams" element={<ProtectedLayout><TeamSquare /></ProtectedLayout>} />
      <Route path="/join-team" element={<ProtectedLayout><JoinTeam /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
    </Routes>
  </HashRouter>
);
```

- [ ] **Step 3: 修改 Index.jsx 移除编辑按钮**

移除 BrainPage 中的编辑团队按钮（`openModal` 相关的按钮元素）。

- [ ] **Step 4: 创建占位页面** MyTeams.jsx, TeamSquare.jsx, JoinTeam.jsx, Profile.jsx（简单占位，后续 Task 充实）

- [ ] **Step 5: 编译验证**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
```

- [ ] **Step 6: 提交**

---

### Task 6: 前端 — 仪表盘修复（MiniBrain方向已在Task4修，此处做布局）

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (Dashboard 组件)

- [ ] **Step 1: Dashboard 布局自适应**

```jsx
// Dashboard container
<div className="p-4 space-y-3 max-h-[calc(100vh-56px)] overflow-y-auto">

// KPI cards
<div className="grid grid-cols-4 gap-3">
  {/* Each card: p-3, min-w-[120px] */}

// Dual panel
<div className="grid grid-cols-2 gap-4" style={{ maxHeight: 'min(50vh, 420px)' }}>
  {/* MiniBrain: height = 100% of parent, width auto */}
  {/* Distribution: overflow-y-auto */}
```

- [ ] **Step 2: 编译验证和提交**

---

### Task 7: 前端 — 用户管理修复（验证+团队列+筛选）

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (UserList + UserForm)

- [ ] **Step 1: UserForm 验证**

在 handleSave 前检查：
```jsx
const [errors, setErrors] = useState({});

const validate = () => {
  const errs = {};
  if (!username.trim()) errs.username = '请输入用户名';
  if (!initial && !password) errs.password = '请输入密码';
  if (!email.trim()) errs.email = '请输入邮箱';
  setErrors(errs);
  return Object.keys(errs).length === 0;
};
```

每个输入框下方显示错误：`{errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}`

- [ ] **Step 2: UserList 加团队列和筛选**

表格加"团队"列，显示 `teamName` 或"未加入"按钮。顶部加团队下拉筛选。调用 `/api/admin/users` 已返回 teamName。

- [ ] **Step 3: 编译和提交**

---

### Task 8: 前端 — 团队管理修复（新建+编辑+查看修复）

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (TeamList + TeamDetail + 新建 TeamEditPage)
- Create: `frontend/src/pages/TeamEditPage.jsx`

- [ ] **Step 1: TeamList 加新建按钮**

加"+ 新建团队"按钮 → 弹窗（名称 + 描述 + 所有者ID） → `POST /api/admin/teams`。

- [ ] **Step 2: 创建 TeamEditPage.jsx（三个居中选项卡）**

```jsx
const TeamEditPage = () => {
  const { id } = useParams();
  const [tab, setTab] = useState('info'); // 'info' | 'nodes' | 'import'
  const { team, nodes, refresh } = useTeamData(parseInt(id));
  
  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="p-4 border-b border-white border-opacity-10 flex items-center space-x-2">
        <button onClick={() => navigate('/admin/teams')}>← 团队列表</button>
        <span>/</span><span>{team?.teamName}</span><span>/</span><span>编辑</span>
      </div>
      
      {/* Tabs - centered */}
      <div className="flex justify-center border-b border-white border-opacity-20">
        {['info','nodes','import'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 ${tab === t ? 'border-b-2 border-white' : 'opacity-60'}`}>
            {{info:'编辑信息',nodes:'编辑节点','import':'导入 JSON'}[t]}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'info' && <TeamInfoTab team={team} />}
        {tab === 'nodes' && <TeamNodesTab teamId={parseInt(id)} nodes={nodes} />}
        {tab === 'import' && <ImportJsonTab teamId={parseInt(id)} onImport={refresh} />}
      </div>
    </div>
  );
};
```

**TeamNodesTab:** 左侧节点列表（搜索、脑区筛选、拖拽手柄 `⋮⋮`）+ 右侧脑区列表/迷你大脑切换

- [ ] **Step 3: 节点拖拽实现**

使用 HTML5 drag-and-drop API：
```jsx
// 节点项
<div draggable onDragStart={e => {
  e.dataTransfer.setData('nodeId', node.id);
  e.currentTarget.style.opacity = '0.5';
}} onDragEnd={e => {
  e.currentTarget.style.opacity = '1';
}}>
  <span>⋮⋮</span>
  <span>{node.name}</span>
</div>

// 脑区卡片
<div onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = region.colorHex; }}
     onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
     onDrop={e => {
       e.preventDefault();
       const nodeId = e.dataTransfer.getData('nodeId');
       api.put(`/nodes/${nodeId}/region`, { brainRegionId: region.id });
       e.currentTarget.style.borderColor = '';
     }}>
  {region.name}
</div>
```

- [ ] **Step 4: 迷你大脑拖拽高亮**

MiniBrain 组件接受 `onRegionHover` 回调，在 onDragOver 时高亮对应脑区全部点。

- [ ] **Step 5: 团队详情查看修复**

TeamDetail 组件检查 `useBrainData` 和 `useTeamData` 的 loading 状态联动是否正确。

- [ ] **Step 6: AdminPage 团队编辑路由**

加 `case 'teams/': return <TeamDetail />; case startsWith('teams/') && endsWith('/edit'): return <TeamEditPage />;`

- [ ] **Step 7: 编译和提交**

---

### Task 9: 前端 — MyTeams + TeamSquare + JoinTeam + Profile 页面

**Files:**
- Create: `frontend/src/pages/MyTeams.jsx`, `frontend/src/pages/TeamSquare.jsx`, `frontend/src/pages/JoinTeam.jsx`, `frontend/src/pages/Profile.jsx`

- [ ] **Step 1: MyTeams.jsx**

我的团队列表（卡片网格），每张卡片：团队名 + 描述 + 节点数 + [设为首页] [编辑] 按钮。卡片点击进入子页面。

- [ ] **Step 2: TeamSquare.jsx**

团队广场：所有公开团队卡片（同 MyTeams 样式），[加入] 按钮弹出模态框（名称、描述、脑区节点分布条）。

- [ ] **Step 3: JoinTeam.jsx**

团队选择页面：同 TeamSquare，但突出"加入"操作。

- [ ] **Step 4: Profile.jsx**

个人信息：用户名（只读）、邮箱（可编辑）、修改密码表单。

- [ ] **Step 5: 编译和提交**

---

### Task 10: 前端 — 脑区管理移到团队编辑下 + 管理侧边栏更新

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx` (菜单、侧边栏)
- Modify: `frontend/src/pages/TeamEditPage.jsx` (脑区CRUD面板)

- [ ] **Step 1: AdminPage 侧边栏移除"脑区管理"**

MENU 数组中移除 `{ key: 'regions', ... }`，同时移除 RegionList 组件路由。

- [ ] **Step 2: TeamEditPage 脑区面板**

在编辑节点选项卡右侧，脑区列表每项可编辑名称/颜色、删除（带重分配弹窗）、合并（多选）、新增。实现脑区 CRUD UI。

- [ ] **Step 3: 编译和提交**

---

### Task 11: 集成构建 + 端到端验证

- [ ] **Step 1: 编译后端**

```bash
cd /home/mpt/projects/TeamBrain/backend && mvn compile
```
Fix all compilation errors.

- [ ] **Step 2: 编译前端**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build
```

- [ ] **Step 3: 清除测试数据**

```bash
mysql --login-path=teambrain -e "DELETE FROM teambrain.audit_log;"
```

- [ ] **Step 4: 完整构建**

```bash
cd /home/mpt/projects/TeamBrain && ./build.sh
```

- [ ] **Step 5: 启动并验证**

```bash
fuser -k 8080/tcp
source ~/.bashrc && java -jar backend/target/teambrain-0.0.1.jar
```

验证清单：
- `/` 大脑首页正常显示（无编辑按钮）
- `/#/admin` 仪表盘一屏显示，MiniBrain方向正确
- `/#/admin/users` 用户表含团队列，表单验证生效
- `/#/admin/teams` 可新建团队
- `/#/admin/teams/:id/edit` 三个选项卡，节点可拖拽到脑区
- `/#/my-teams` 我的团队
- `/#/teams` 团队广场
- 脑区 API `GET /api/teams/1/regions` 返回团队脑区

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: complete admin restructure with team-scoped regions and navigation"
```
