package com.teambrain.service;

import com.teambrain.dto.BrainPointDto;
import com.teambrain.dto.BrainRegionDto;
import com.teambrain.entity.BrainPoint;
import com.teambrain.entity.BrainRegion;
import com.teambrain.entity.Team;
import com.teambrain.repository.BrainPointRepository;
import com.teambrain.repository.BrainRegionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BrainRegionService {

    private final BrainRegionRepository regionRepo;
    private final BrainPointRepository pointRepo;
    private final TeamNodeRepository nodeRepo;
    private final TeamRepository teamRepo;

    public BrainRegionService(BrainRegionRepository regionRepo, BrainPointRepository pointRepo,
                               TeamNodeRepository nodeRepo, TeamRepository teamRepo) {
        this.regionRepo = regionRepo;
        this.pointRepo = pointRepo;
        this.nodeRepo = nodeRepo;
        this.teamRepo = teamRepo;
    }

    // ---- Template regions (for brain visualization) ----

    public List<BrainRegionDto> getAllRegions() {
        return regionRepo.findByTeamIsNullOrderBySortOrderAsc().stream()
                .map(r -> new BrainRegionDto(r.getId(), r.getName(), r.getColorHex(), r.getSortOrder()))
                .toList();
    }

    // ---- Brain points (with optional teamId remapping) ----

    public List<BrainPointDto> getAllPoints(Long teamId) {
        List<BrainPoint> points = pointRepo.findAll();
        if (teamId == null) {
            return points.stream()
                    .map(p -> new BrainPointDto(
                            p.getBrainRegion().getId(),
                            p.getBrainRegion().getName(),
                            p.getBrainRegion().getColorHex(),
                            p.getX(), p.getY(), p.getZ()))
                    .toList();
        }

        // Build templateRegionId -> team BrainRegion mapping
        List<BrainRegion> teamRegions = regionRepo.findByTeamIdOrderBySortOrderAsc(teamId);
        Map<Long, BrainRegion> templateToTeamRegion = new HashMap<>();
        for (BrainRegion tr : teamRegions) {
            if (tr.getTemplateRegionId() != null) {
                templateToTeamRegion.put(tr.getTemplateRegionId(), tr);
            }
        }

        return points.stream()
                .map(p -> {
                    BrainRegion templateRegion = p.getBrainRegion();
                    BrainRegion teamRegion = templateToTeamRegion.get(templateRegion.getId());
                    if (teamRegion != null) {
                        return new BrainPointDto(
                                teamRegion.getId(),
                                teamRegion.getName(),
                                teamRegion.getColorHex(),
                                p.getX(), p.getY(), p.getZ());
                    }
                    return new BrainPointDto(
                            templateRegion.getId(),
                            templateRegion.getName(),
                            templateRegion.getColorHex(),
                            p.getX(), p.getY(), p.getZ());
                })
                .toList();
    }

    // ---- Team-specific regions CRUD ----

    public List<BrainRegion> getRegions(Long teamId) {
        if (teamId == null) return regionRepo.findByTeamIsNullOrderBySortOrderAsc();
        return regionRepo.findByTeamIdOrderBySortOrderAsc(teamId);
    }

    @Transactional
    public List<BrainRegion> copyTemplatesForTeam(Long teamId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        List<BrainRegion> templates = regionRepo.findByTeamIsNullOrderBySortOrderAsc();
        List<BrainRegion> copies = new ArrayList<>();
        int sort = 1;
        for (BrainRegion t : templates) {
            BrainRegion r = new BrainRegion();
            r.setTeam(team);
            r.setName(t.getName());
            r.setColorHex(t.getColorHex());
            r.setSortOrder(sort++);
            r.setTemplateRegionId(t.getId());
            copies.add(regionRepo.save(r));
        }
        return copies;
    }

    public BrainRegion createRegion(Long teamId, String name, String colorHex, Long templateRegionId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        BrainRegion r = new BrainRegion();
        r.setTeam(team);
        r.setName(name);
        r.setColorHex(colorHex != null ? colorHex : "#888888");
        r.setTemplateRegionId(templateRegionId);
        int maxSort = regionRepo.findByTeamIdOrderBySortOrderAsc(teamId).stream()
                .mapToInt(BrainRegion::getSortOrder).max().orElse(0);
        r.setSortOrder(maxSort + 1);
        return regionRepo.save(r);
    }

    public BrainRegion updateRegion(Long regionId, String name, String colorHex) {
        BrainRegion r = regionRepo.findById(regionId).orElseThrow();
        if (name != null) r.setName(name);
        if (colorHex != null) r.setColorHex(colorHex);
        return regionRepo.save(r);
    }

    @Transactional
    public void deleteRegion(Long regionId, Long reassignToRegionId, boolean setUnassigned) {
        BrainRegion r = regionRepo.findById(regionId).orElseThrow();
        Team team = r.getTeam();
        List<BrainRegion> teamRegions = regionRepo.findByTeamIdOrderBySortOrderAsc(team.getId());
        if (teamRegions.size() <= 1) throw new RuntimeException("至少保留一个脑区");

        if (setUnassigned) {
            nodeRepo.findByTeamIdAndBrainRegionId(team.getId(), regionId)
                    .forEach(n -> { n.setBrainRegion(null); nodeRepo.save(n); });
        } else if (reassignToRegionId != null) {
            BrainRegion target = regionRepo.findById(reassignToRegionId).orElseThrow();
            nodeRepo.findByTeamIdAndBrainRegionId(team.getId(), regionId)
                    .forEach(n -> { n.setBrainRegion(target); nodeRepo.save(n); });
        }
        regionRepo.delete(r);
    }

    @Transactional
    public void mergeRegions(Long teamId, List<Long> sourceIds, Long targetId) {
        BrainRegion target = regionRepo.findById(targetId).orElseThrow();
        for (Long sid : sourceIds) {
            if (sid.equals(targetId)) continue;
            nodeRepo.findByTeamIdAndBrainRegionId(teamId, sid)
                    .forEach(n -> { n.setBrainRegion(target); nodeRepo.save(n); });
            regionRepo.deleteById(sid);
        }
    }

    @Transactional
    public void reorder(Long teamId, List<Long> orderedIds) {
        int sort = 1;
        for (Long id : orderedIds) {
            BrainRegion r = regionRepo.findById(id).orElse(null);
            if (r != null) {
                r.setSortOrder(sort++);
                regionRepo.save(r);
            }
        }
    }
}
