package com.teambrain.controller;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.service.BrainRegionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/brain")
public class BrainRegionController {

    private final BrainRegionService brainRegionService;

    public BrainRegionController(BrainRegionService brainRegionService) {
        this.brainRegionService = brainRegionService;
    }

    @GetMapping("/regions")
    public ResponseEntity<List<BrainRegionDto>> getRegions() {
        return ResponseEntity.ok(brainRegionService.getAllRegions());
    }

    @GetMapping("/points")
    public ResponseEntity<List<BrainPointDto>> getPoints() {
        return ResponseEntity.ok(brainRegionService.getAllPoints());
    }
}
