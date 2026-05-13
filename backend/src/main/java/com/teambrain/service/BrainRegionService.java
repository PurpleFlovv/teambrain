package com.teambrain.service;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.repository.BrainPointRepository;
import com.teambrain.repository.BrainRegionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BrainRegionService {

    private final BrainRegionRepository regionRepository;
    private final BrainPointRepository pointRepository;

    public BrainRegionService(BrainRegionRepository regionRepository,
                              BrainPointRepository pointRepository) {
        this.regionRepository = regionRepository;
        this.pointRepository = pointRepository;
    }

    public List<BrainRegionDto> getAllRegions() {
        return regionRepository.findAllByOrderBySortOrderAsc().stream()
                .map(r -> new BrainRegionDto(r.getId(), r.getName(), r.getColorHex(), r.getSortOrder()))
                .toList();
    }

    public List<BrainPointDto> getAllPoints() {
        return pointRepository.findAll().stream()
                .map(p -> new BrainPointDto(
                        p.getBrainRegion().getId(),
                        p.getBrainRegion().getName(),
                        p.getBrainRegion().getColorHex(),
                        p.getX(), p.getY(), p.getZ()))
                .toList();
    }
}
