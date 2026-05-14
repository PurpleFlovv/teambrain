package com.teambrain.service;

import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.BrainRegion;
import com.teambrain.entity.Team;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.BrainRegionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.*;

import java.util.List;

@Service
public class TeamNodeService {

    private final TeamNodeRepository nodeRepository;
    private final TeamRepository teamRepository;
    private final BrainRegionRepository regionRepository;

    public TeamNodeService(TeamNodeRepository nodeRepository, TeamRepository teamRepository,
                           BrainRegionRepository regionRepository) {
        this.nodeRepository = nodeRepository;
        this.teamRepository = teamRepository;
        this.regionRepository = regionRepository;
    }

    public List<TeamNodeDto> getTeamNodes(Long teamId) {
        // Build template_id -> team_region map for nodes that reference template regions
        Map<Long, BrainRegion> teamRegionByTemplateId = new java.util.HashMap<>();
        regionRepository.findByTeamIdOrderBySortOrderAsc(teamId).forEach(r -> {
            if (r.getTemplateRegionId() != null) {
                teamRegionByTemplateId.putIfAbsent(r.getTemplateRegionId(), r);
            }
        });

        return nodeRepository.findByTeamId(teamId).stream()
                .map(n -> {
                    BrainRegion nodeRegion = n.getBrainRegion();
                    BrainRegion teamRegion = null;
                    if (nodeRegion != null) {
                        if (nodeRegion.getTeam() != null) {
                            teamRegion = nodeRegion;
                        } else {
                            // Map template region to team region
                            teamRegion = teamRegionByTemplateId.get(nodeRegion.getId());
                            if (teamRegion == null) teamRegion = nodeRegion;
                        }
                    }
                    return new TeamNodeDto(n.getId(), n.getName(), n.getDescription(),
                            n.getNodeType().name(),
                            teamRegion != null ? teamRegion.getId() : null,
                            teamRegion != null ? teamRegion.getName() : "未分配",
                            teamRegion != null ? teamRegion.getColorHex() : "#888888");
                }).toList();
    }

    public TeamNodeDto addNode(Long teamId, String name, String description,
                                String nodeType, Long brainRegionId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        BrainRegion region = null;
        if (brainRegionId != null) {
            region = regionRepository.findById(brainRegionId)
                    .orElseThrow(() -> new RuntimeException("脑区不存在"));
        }
        TeamNode node = new TeamNode(team, region, name, description,
                TeamNode.NodeType.valueOf(nodeType));
        node = nodeRepository.save(node);
        return new TeamNodeDto(node.getId(), node.getName(), node.getDescription(),
                node.getNodeType().name(),
                region != null ? region.getId() : null,
                region != null ? region.getName() : "未分配",
                region != null ? region.getColorHex() : "#888888");
    }

    public TeamNodeDto updateNode(Long nodeId, String name, String description,
                                   String nodeType, Long brainRegionId) {
        TeamNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("节点不存在"));
        if (name != null) node.setName(name);
        if (description != null) node.setDescription(description);
        if (nodeType != null) node.setNodeType(TeamNode.NodeType.valueOf(nodeType));
        if (brainRegionId != null) {
            BrainRegion region = regionRepository.findById(brainRegionId)
                    .orElseThrow(() -> new RuntimeException("脑区不存在"));
            node.setBrainRegion(region);
        }
        node = nodeRepository.save(node);
        return new TeamNodeDto(node.getId(), node.getName(), node.getDescription(),
                node.getNodeType().name(), node.getBrainRegion().getId(),
                node.getBrainRegion().getName(), node.getBrainRegion().getColorHex());
    }

    public void deleteNode(Long nodeId) {
        nodeRepository.deleteById(nodeId);
    }

    public void moveNodeToRegion(Long nodeId, Long regionId) {
        TeamNode node = nodeRepository.findById(nodeId).orElseThrow();
        if (regionId != null) {
            BrainRegion region = regionRepository.findById(regionId).orElseThrow();
            node.setBrainRegion(region);
        } else {
            node.setBrainRegion(null);
        }
        nodeRepository.save(node);
    }
}
