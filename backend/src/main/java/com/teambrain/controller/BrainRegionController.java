package com.teambrain.controller;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.entity.BrainRegion;
import com.teambrain.service.BrainRegionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class BrainRegionController {

    private final BrainRegionService regionService;

    public BrainRegionController(BrainRegionService regionService) {
        this.regionService = regionService;
    }

    // ---- Brain visualization endpoints (no auth required) ----

    @GetMapping("/api/brain/regions")
    public ResponseEntity<List<BrainRegionDto>> getBrainRegions() {
        return ResponseEntity.ok(regionService.getAllRegions());
    }

    @GetMapping("/api/brain/points")
    public ResponseEntity<List<BrainPointDto>> getBrainPoints(@RequestParam(required = false) Long teamId) {
        return ResponseEntity.ok(regionService.getAllPoints(teamId));
    }

    // ---- Team region CRUD endpoints ----

    @GetMapping("/api/teams/{teamId}/regions")
    public ResponseEntity<List<BrainRegion>> list(@PathVariable Long teamId) {
        return ResponseEntity.ok(regionService.getRegions(teamId));
    }

    @PostMapping("/api/teams/{teamId}/regions")
    public ResponseEntity<BrainRegion> create(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(regionService.createRegion(teamId,
            (String) body.get("name"), (String) body.get("colorHex"),
            body.get("templateRegionId") != null ? ((Number) body.get("templateRegionId")).longValue() : null));
    }

    @PutMapping("/api/teams/{teamId}/regions/{id}")
    public ResponseEntity<BrainRegion> update(@PathVariable Long teamId, @PathVariable Long id,
                                               @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(regionService.updateRegion(id, body.get("name"), body.get("colorHex")));
    }

    @DeleteMapping("/api/teams/{teamId}/regions/{id}")
    public ResponseEntity<?> delete(@PathVariable Long teamId, @PathVariable Long id,
                                     @RequestBody Map<String, Object> body) {
        boolean unassigned = Boolean.TRUE.equals(body.get("setUnassigned"));
        Long reassignTo = body.containsKey("reassignToRegionId") ?
                ((Number) body.get("reassignToRegionId")).longValue() : null;
        regionService.deleteRegion(id, reassignTo, unassigned);
        return ResponseEntity.ok(Map.of("message", "已删除"));
    }

    @PostMapping("/api/teams/{teamId}/regions/merge")
    public ResponseEntity<?> merge(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> sourceIds = ((List<Number>) body.get("sourceIds")).stream()
                .map(Number::longValue).toList();
        Long targetId = ((Number) body.get("targetId")).longValue();
        regionService.mergeRegions(teamId, sourceIds, targetId);
        return ResponseEntity.ok(Map.of("message", "已合并"));
    }

    @PutMapping("/api/teams/{teamId}/regions/reorder")
    public ResponseEntity<?> reorder(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> ids = ((List<Number>) body.get("orderedIds")).stream()
                .map(Number::longValue).toList();
        regionService.reorder(teamId, ids);
        return ResponseEntity.ok(Map.of("message", "已排序"));
    }
}
