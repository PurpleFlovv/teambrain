package com.teambrain.controller;

import com.teambrain.dto.TeamDto;
import com.teambrain.entity.User;
import com.teambrain.repository.UserRepository;
import com.teambrain.service.AdminService;
import com.teambrain.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private final AdminService adminService;
    private final UserRepository userRepo;

    public TeamController(TeamService teamService, AdminService adminService,
                          UserRepository userRepo) {
        this.teamService = teamService;
        this.adminService = adminService;
        this.userRepo = userRepo;
    }

    @GetMapping("/public")
    public ResponseEntity<List<Map<String, Object>>> getPublicTeams() {
        return ResponseEntity.ok(adminService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateTeam(id, body.get("teamName"), body.get("description")));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyTeams(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
        return ResponseEntity.ok(teamService.getMyTeams(user.getId()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getMembers(id));
    }

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
}
