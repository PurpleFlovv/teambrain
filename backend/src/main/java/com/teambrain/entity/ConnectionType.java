package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "connection_type")
public class ConnectionType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Column(nullable = false)
    private Double lineWidth;

    @Column(nullable = false)
    private Double opacity;

    public ConnectionType() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public void setLineWidth(Double lineWidth) { this.lineWidth = lineWidth; }
    public Double getOpacity() { return opacity; }
    public void setOpacity(Double opacity) { this.opacity = opacity; }
}
