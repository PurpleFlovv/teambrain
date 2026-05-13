package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "team_node")
public class TeamNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brain_region_id", nullable = false)
    private BrainRegion brainRegion;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NodeType nodeType;

    public enum NodeType { MEMBER, PROJECT }

    public TeamNode() {}

    public TeamNode(Team team, BrainRegion brainRegion, String name, String description, NodeType nodeType) {
        this.team = team;
        this.brainRegion = brainRegion;
        this.name = name;
        this.description = description;
        this.nodeType = nodeType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public BrainRegion getBrainRegion() { return brainRegion; }
    public void setBrainRegion(BrainRegion brainRegion) { this.brainRegion = brainRegion; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public NodeType getNodeType() { return nodeType; }
    public void setNodeType(NodeType nodeType) { this.nodeType = nodeType; }
}
