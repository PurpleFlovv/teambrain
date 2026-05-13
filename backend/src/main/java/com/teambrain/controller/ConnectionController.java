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
