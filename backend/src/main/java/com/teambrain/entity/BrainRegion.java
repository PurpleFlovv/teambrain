package com.teambrain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "brain_region")
public class BrainRegion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 7)
    private String colorHex;

    private Integer sortOrder;

    public BrainRegion() {}

    public BrainRegion(String name, String colorHex, Integer sortOrder) {
        this.name = name;
        this.colorHex = colorHex;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
