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
