package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "node_connection")
public class NodeConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_node_id", nullable = false)
    private TeamNode fromNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_node_id")
    private TeamNode toNode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TargetType targetType;

    @Column(nullable = false, length = 30)
    private String connectionType;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Column(nullable = false)
    private Double lineWidth;

    @Column(nullable = false, length = 7)
    private String flowColorHex;

    @Column(nullable = false)
    private Double opacity;

    public enum TargetType { SINGLE, ALL }

    public NodeConnection() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public TeamNode getFromNode() { return fromNode; }
    public void setFromNode(TeamNode fromNode) { this.fromNode = fromNode; }
    public TeamNode getToNode() { return toNode; }
    public void setToNode(TeamNode toNode) { this.toNode = toNode; }
    public TargetType getTargetType() { return targetType; }
    public void setTargetType(TargetType targetType) { this.targetType = targetType; }
    public String getConnectionType() { return connectionType; }
    public void setConnectionType(String connectionType) { this.connectionType = connectionType; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public void setLineWidth(Double lineWidth) { this.lineWidth = lineWidth; }
    public String getFlowColorHex() { return flowColorHex; }
    public void setFlowColorHex(String flowColorHex) { this.flowColorHex = flowColorHex; }
    public Double getOpacity() { return opacity; }
    public void setOpacity(Double opacity) { this.opacity = opacity; }
}
