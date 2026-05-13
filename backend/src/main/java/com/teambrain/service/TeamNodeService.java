package com.teambrain.service;

import com.teambrain.dto.TeamNodeDto;
import com.teambrain.entity.BrainRegion;
import com.teambrain.entity.Team;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.BrainRegionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

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
        return nodeRepository.findByTeamId(teamId).stream()
                .map(n -> new TeamNodeDto(n.getId(), n.getName(), n.getDescription(),
                        n.getNodeType().name(), n.getBrainRegion().getId(),
                        n.getBrainRegion().getName(), n.getBrainRegion().getColorHex()))
                .toList();
    }

    public TeamNodeDto addNode(Long teamId, String name, String description,
                                String nodeType, Long brainRegionId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        BrainRegion region = regionRepository.findById(brainRegionId)
                .orElseThrow(() -> new RuntimeException("脑区不存在"));
        TeamNode node = new TeamNode(team, region, name, description,
                TeamNode.NodeType.valueOf(nodeType));
        node = nodeRepository.save(node);
        return new TeamNodeDto(node.getId(), node.getName(), node.getDescription(),
                node.getNodeType().name(), region.getId(), region.getName(), region.getColorHex());
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
}
