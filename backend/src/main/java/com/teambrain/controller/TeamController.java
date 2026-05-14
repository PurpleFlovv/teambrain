package com.teambrain.controller;

import com.teambrain.dto.TeamDto;
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

    public TeamController(TeamService teamService, AdminService adminService) {
        this.teamService = teamService;
        this.adminService = adminService;
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

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(Map.of("message", "已加入"));
    }
}
