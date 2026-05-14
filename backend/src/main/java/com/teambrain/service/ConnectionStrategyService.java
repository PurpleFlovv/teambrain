package com.teambrain.service;

import com.teambrain.entity.NodeConnection;
import com.teambrain.entity.TeamNode;
import com.teambrain.repository.NodeConnectionRepository;
import com.teambrain.repository.TeamNodeRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ConnectionStrategyService {

    private final TeamNodeRepository nodeRepository;
    private final NodeConnectionRepository connectionRepository;

    public ConnectionStrategyService(TeamNodeRepository nodeRepository,
                                     NodeConnectionRepository connectionRepository) {
        this.nodeRepository = nodeRepository;
        this.connectionRepository = connectionRepository;
    }

    public List<Map<String, Object>> computeConnections(Long teamId) {
        List<TeamNode> allNodes = nodeRepository.findByTeamId(teamId);
        Set<String> connectionSet = new HashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();

        // Strategy D: Manual connections (highest priority)
        List<NodeConnection> manual = connectionRepository.findByTeamId(teamId);
        for (NodeConnection mc : manual) {
            String key = mc.getFromNode().getId() + "_" + (mc.getToNode() != null ? mc.getToNode().getId() : "*");
            if (connectionSet.add(key)) {
                Map<String, Object> conn = new HashMap<>();
                conn.put("fromNodeId", mc.getFromNode().getId());
                conn.put("fromNodeName", mc.getFromNode().getName());
                conn.put("toNodeId", mc.getToNode() != null ? mc.getToNode().getId() : null);
                conn.put("toNodeName", mc.getToNode() != null ? mc.getToNode().getName() : "*");
                conn.put("connectionType", mc.getConnectionType() != null ? mc.getConnectionType() : "general");
                conn.put("colorHex", mc.getColorHex() != null ? mc.getColorHex() : "#ffffff");
                conn.put("lineWidth", mc.getLineWidth() != null ? mc.getLineWidth() : 0.02);
                conn.put("flowColorHex", mc.getFlowColorHex() != null ? mc.getFlowColorHex() : "#ffffff");
                conn.put("opacity", mc.getOpacity() != null ? mc.getOpacity() : 0.8);
                conn.put("strategy", "manual");
                result.add(conn);
            }
        }

        // Group nodes by brain region
        Map<Long, List<TeamNode>> byRegion = new HashMap<>();
        for (TeamNode n : allNodes) {
            byRegion.computeIfAbsent(n.getBrainRegion().getId(), k -> new ArrayList<>()).add(n);
        }

        // Strategy A: Same-region collaboration (max 5 neighbors per node)
        for (List<TeamNode> regionNodes : byRegion.values()) {
            for (TeamNode node : regionNodes) {
                List<TeamNode> others = new ArrayList<>(regionNodes);
                others.remove(node);
                Collections.shuffle(others);
                int count = 0;
                for (TeamNode other : others) {
                    if (count >= 5) break;
                    String key = Math.min(node.getId(), other.getId()) + "_" + Math.max(node.getId(), other.getId());
                    if (connectionSet.add(key)) {
                        Map<String, Object> conn = new HashMap<>();
                        conn.put("fromNodeId", node.getId());
                        conn.put("fromNodeName", node.getName());
                        conn.put("toNodeId", other.getId());
                        conn.put("toNodeName", other.getName());
                        conn.put("connectionType", "collaboration");
                        conn.put("colorHex", "#888888");
                        conn.put("lineWidth", 0.01);
                        conn.put("flowColorHex", "#aaaaaa");
                        conn.put("opacity", 0.5);
                        conn.put("strategy", "same_region");
                        result.add(conn);
                    }
                    count++;
                }
            }
        }

        // Strategy B & C: Leader and Bridge (tag-based)
        for (TeamNode node : allNodes) {
            String tags = node.getTags();
            if (tags == null || tags.isEmpty()) continue;

            boolean isLeader = tags.contains("leader");

            List<Long> bridgeRegions = new ArrayList<>();
            for (String part : tags.split(",")) {
                part = part.trim();
                if (part.startsWith("bridge:")) {
                    String[] ids = part.substring(7).split(",");
                    for (String sid : ids) {
                        try { bridgeRegions.add(Long.parseLong(sid.trim())); } catch (NumberFormatException e) {}
                    }
                }
            }

            for (Map.Entry<Long, List<TeamNode>> entry : byRegion.entrySet()) {
                Long rid = entry.getKey();
                boolean sameRegion = rid.equals(node.getBrainRegion().getId());

                if (isLeader && sameRegion) {
                    for (TeamNode target : entry.getValue()) {
                        if (target.getNodeType() == TeamNode.NodeType.PROJECT) {
                            String key = node.getId() + "_" + target.getId();
                            if (connectionSet.add(key)) {
                                Map<String, Object> conn = new HashMap<>();
                                conn.put("fromNodeId", node.getId());
                                conn.put("fromNodeName", node.getName());
                                conn.put("toNodeId", target.getId());
                                conn.put("toNodeName", target.getName());
                                conn.put("connectionType", "leadership");
                                conn.put("colorHex", "#ffaa44");
                                conn.put("lineWidth", 0.03);
                                conn.put("flowColorHex", "#ffaa44");
                                conn.put("opacity", 0.8);
                                conn.put("strategy", "leader");
                                result.add(conn);
                            }
                        }
                    }
                }

                if (bridgeRegions.contains(rid) && !sameRegion) {
                    for (TeamNode target : entry.getValue()) {
                        String key = node.getId() + "_" + target.getId();
                        if (connectionSet.add(key)) {
                            Map<String, Object> conn = new HashMap<>();
                            conn.put("fromNodeId", node.getId());
                            conn.put("fromNodeName", node.getName());
                            conn.put("toNodeId", target.getId());
                            conn.put("toNodeName", target.getName());
                            conn.put("connectionType", "bridge");
                            conn.put("colorHex", "#44aaff");
                            conn.put("lineWidth", 0.02);
                            conn.put("flowColorHex", "#44aaff");
                            conn.put("opacity", 0.7);
                            conn.put("strategy", "bridge");
                            result.add(conn);
                        }
                    }
                }
            }
        }

        return result;
    }
}
