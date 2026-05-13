package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "brain_point")
public class BrainPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brain_region_id", nullable = false)
    private BrainRegion brainRegion;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double z;

    public BrainPoint() {}

    public BrainPoint(BrainRegion brainRegion, Double x, Double y, Double z) {
        this.brainRegion = brainRegion;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BrainRegion getBrainRegion() { return brainRegion; }
    public void setBrainRegion(BrainRegion brainRegion) { this.brainRegion = brainRegion; }
    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }
    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }
    public Double getZ() { return z; }
    public void setZ(Double z) { this.z = z; }
}
