package com.teambrain.dto;

public class BrainRegionDto {
    private Long id;
    private String name;
    private String colorHex;
    private Integer sortOrder;

    public BrainRegionDto(Long id, String name, String colorHex, Integer sortOrder) {
        this.id = id;
        this.name = name;
        this.colorHex = colorHex;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getColorHex() { return colorHex; }
    public Integer getSortOrder() { return sortOrder; }
}
