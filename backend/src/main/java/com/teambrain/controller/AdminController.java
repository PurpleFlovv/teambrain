package com.teambrain.controller;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.AuditLog;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.service.*;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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
    private final TeamService teamService;
    private final TeamNodeRepository teamNodeRepo;

    public AdminController(AdminService adminService, TeamNodeService teamNodeService,
                           ConnectionService connectionService, ConnectionStrategyService strategyService,
                           TeamService teamService, TeamNodeRepository teamNodeRepo) {
        this.adminService = adminService;
        this.teamNodeService = teamNodeService;
        this.connectionService = connectionService;
        this.strategyService = strategyService;
        this.teamService = teamService;
        this.teamNodeRepo = teamNodeRepo;
    }

    private String username(UserDetails ud) { return ud != null ? ud.getUsername() : "system"; }

    private boolean isAdmin(UserDetails ud) {
        return ud != null && ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void checkTeamAccess(Long teamId, UserDetails ud) {
        if (isAdmin(ud)) return;
        if (teamService.isOwner(teamId, username(ud))) return;
        throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "无权操作此团队");
    }

    private void checkNodeOwner(Long nodeId, UserDetails ud) {
        TeamNode node = teamNodeRepo.findById(nodeId).orElse(null);
        if (node == null) return;
        if (isAdmin(ud)) return;
        if (!teamService.isOwner(node.getTeam().getId(), username(ud))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "无权操作此节点");
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        String uname = (String) body.get("username");
        String pwd = (String) body.get("password");
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        adminService.createUser(uname, pwd, roles, username(ud));
        return ResponseEntity.ok(Map.of("message", "用户已创建"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        adminService.updateUser(id,
            (String) body.get("username"),
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

    @GetMapping("/teams")
    public ResponseEntity<List<Map<String, Object>>> getTeams() {
        return ResponseEntity.ok(adminService.getAllTeams());
    }

    @PutMapping("/teams/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        checkTeamAccess(id, ud);
        adminService.updateTeam(id, body.get("teamName"), body.get("description"), username(ud));
        return ResponseEntity.ok(Map.of("message", "团队已更新"));
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        adminService.deleteTeam(id, username(ud));
        return ResponseEntity.ok(Map.of("message", "团队已删除"));
    }

    @PostMapping("/teams")
    public ResponseEntity<?> createTeam(@RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        adminService.createTeam(body.get("teamName"), body.get("description"),
                Long.parseLong(body.getOrDefault("ownerId", "1")), username(ud));
        return ResponseEntity.ok(Map.of("message", "团队已创建"));
    }

    @GetMapping("/teams/{id}/nodes")
    public ResponseEntity<List<TeamNodeDto>> getTeamNodes(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails ud) {
        checkTeamAccess(id, ud);
        return ResponseEntity.ok(teamNodeService.getTeamNodes(id));
    }

    @GetMapping("/teams/{id}/connections")
    public ResponseEntity<List<NodeConnectionDto>> getTeamConnections(@PathVariable Long id,
                                                                       @AuthenticationPrincipal UserDetails ud) {
        checkTeamAccess(id, ud);
        return ResponseEntity.ok(connectionService.getTeamConnections(id));
    }

    @GetMapping("/teams/{id}/connections/computed")
    public ResponseEntity<List<Map<String, Object>>> getComputedConnections(@PathVariable Long id) {
        return ResponseEntity.ok(strategyService.computeConnections(id));
    }

    @PutMapping("/nodes/{id}/region")
    public ResponseEntity<?> moveRegion(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal UserDetails ud) {
        checkNodeOwner(id, ud);
        Long regionId = body.get("brainRegionId") != null ?
                ((Number) body.get("brainRegionId")).longValue() : null;
        teamNodeService.moveNodeToRegion(id, regionId);
        return ResponseEntity.ok(Map.of("message", "已移动"));
    }

    @PutMapping("/regions/{id}")
    public ResponseEntity<?> updateRegion(@PathVariable Long id, @RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal UserDetails ud) {
        adminService.updateRegion(id, body.get("name"), body.get("colorHex"), username(ud));
        return ResponseEntity.ok(Map.of("message", "脑区已更新"));
    }

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
