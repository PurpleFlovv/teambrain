package com.teambrain.controller;

import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.TeamNode;
import com.teambrain.entity.User;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.UserRepository;
import com.teambrain.service.TeamNodeService;
import com.teambrain.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TeamNodeController {

    private final TeamNodeService nodeService;
    private final TeamService teamService;
    private final TeamNodeRepository nodeRepo;
    private final UserRepository userRepo;

    public TeamNodeController(TeamNodeService nodeService, TeamService teamService,
                               TeamNodeRepository nodeRepo, UserRepository userRepo) {
        this.nodeService = nodeService;
        this.teamService = teamService;
        this.nodeRepo = nodeRepo;
        this.userRepo = userRepo;
    }

    private boolean isAdmin(UserDetails ud) {
        return ud != null && ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void checkTeamOwner(Long teamId, UserDetails ud) {
        if (!teamService.isOwnerOrAdmin(teamId, ud.getUsername(), isAdmin(ud))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权操作此团队");
        }
    }

    private void checkNodeOwner(Long nodeId, UserDetails ud) {
        TeamNode node = nodeRepo.findById(nodeId).orElse(null);
        if (node == null) return;
        if (!teamService.isOwnerOrAdmin(node.getTeam().getId(), ud.getUsername(), isAdmin(ud))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权操作此节点");
        }
    }

    @GetMapping("/teams/{teamId}/nodes")
    public ResponseEntity<List<TeamNodeDto>> getNodes(@PathVariable Long teamId) {
        return ResponseEntity.ok(nodeService.getTeamNodes(teamId));
    }

    @PostMapping("/teams/{teamId}/nodes")
    public ResponseEntity<TeamNodeDto> addNode(@PathVariable Long teamId,
                                                @RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal UserDetails ud) {
        checkTeamOwner(teamId, ud);
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String nodeType = (String) body.get("nodeType");
        Long brainRegionId = body.get("brainRegionId") != null ?
                ((Number) body.get("brainRegionId")).longValue() : null;
        return ResponseEntity.ok(nodeService.addNode(teamId, name, description, nodeType, brainRegionId));
    }

    @PutMapping("/nodes/{id}")
    public ResponseEntity<TeamNodeDto> updateNode(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal UserDetails ud) {
        checkNodeOwner(id, ud);
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String nodeType = (String) body.get("nodeType");
        Long brainRegionId = body.containsKey("brainRegionId") ? ((Number) body.get("brainRegionId")).longValue() : null;
        return ResponseEntity.ok(nodeService.updateNode(id, name, description, nodeType, brainRegionId));
    }

    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<?> deleteNode(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails ud) {
        checkNodeOwner(id, ud);
        nodeService.deleteNode(id);
        return ResponseEntity.ok(Map.of("message", "删除成功"));
    }

    @GetMapping("/user/teams")
    public ResponseEntity<List<Map<String, Object>>> getUserTeams(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
        return ResponseEntity.ok(teamService.getMyTeams(user.getId()));
    }
}
