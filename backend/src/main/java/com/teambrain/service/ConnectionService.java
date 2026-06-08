package com.teambrain.service;

import com.teambrain.dto.NodeConnectionDto;
import com.teambrain.entity.NodeConnection;
import com.teambrain.entity.Team;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.NodeConnectionRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectionService {

    private final NodeConnectionRepository connectionRepository;
    private final TeamNodeRepository nodeRepository;
    private final TeamRepository teamRepository;

    public ConnectionService(NodeConnectionRepository connectionRepository,
                             TeamNodeRepository nodeRepository, TeamRepository teamRepository) {
        this.connectionRepository = connectionRepository;
        this.nodeRepository = nodeRepository;
        this.teamRepository = teamRepository;
    }

    public List<NodeConnectionDto> getTeamConnections(Long teamId) {
        return connectionRepository.findByTeamId(teamId).stream()
                .map(c -> new NodeConnectionDto(c.getId(),
                        c.getFromNode().getId(), c.getFromNode().getName(),
                        c.getFromNode().getBrainRegion().getId(),
                        c.getToNode() != null ? c.getToNode().getId() : null,
                        c.getToNode() != null ? c.getToNode().getName() : "*",
                        c.getToNode() != null ? c.getToNode().getBrainRegion().getId() : null,
                        c.getTargetType().name(), c.getConnectionType(),
                        c.getColorHex(), c.getLineWidth(), c.getFlowColorHex(), c.getOpacity()))
                .toList();
    }

    public NodeConnectionDto addConnection(Long teamId, Long fromNodeId, Long toNodeId,
                                            String targetType, String connectionType,
                                            String colorHex, Double lineWidth,
                                            String flowColorHex, Double opacity) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        TeamNode fromNode = nodeRepository.findById(fromNodeId)
                .orElseThrow(() -> new RuntimeException("起始节点不存在"));
        TeamNode toNode = toNodeId != null ? nodeRepository.findById(toNodeId).orElse(null) : null;

        NodeConnection conn = new NodeConnection();
        conn.setTeam(team);
        conn.setFromNode(fromNode);
        conn.setToNode(toNode);
        conn.setTargetType(NodeConnection.TargetType.valueOf(targetType));
        conn.setConnectionType(connectionType);
        conn.setColorHex(colorHex);
        conn.setLineWidth(lineWidth);
        conn.setFlowColorHex(flowColorHex);
        conn.setOpacity(opacity);
        conn = connectionRepository.save(conn);

        return new NodeConnectionDto(conn.getId(),
                conn.getFromNode().getId(), conn.getFromNode().getName(),
                conn.getFromNode().getBrainRegion().getId(),
                conn.getToNode() != null ? conn.getToNode().getId() : null,
                conn.getToNode() != null ? conn.getToNode().getName() : "*",
                conn.getToNode() != null ? conn.getToNode().getBrainRegion().getId() : null,
                conn.getTargetType().name(), conn.getConnectionType(),
                conn.getColorHex(), conn.getLineWidth(), conn.getFlowColorHex(), conn.getOpacity());
    }

    public void deleteConnection(Long connectionId) {
        connectionRepository.deleteById(connectionId);
    }
}
