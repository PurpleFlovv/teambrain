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
