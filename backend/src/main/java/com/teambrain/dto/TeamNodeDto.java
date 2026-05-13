package com.teambrain.dto;

public class TeamNodeDto {
    private Long id;
    private String name;
    private String description;
    private String nodeType;
    private Long brainRegionId;
    private String brainRegionName;
    private String brainRegionColor;

    public TeamNodeDto(Long id, String name, String description, String nodeType,
                       Long brainRegionId, String brainRegionName, String brainRegionColor) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.nodeType = nodeType;
        this.brainRegionId = brainRegionId;
        this.brainRegionName = brainRegionName;
        this.brainRegionColor = brainRegionColor;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getNodeType() { return nodeType; }
    public Long getBrainRegionId() { return brainRegionId; }
    public String getBrainRegionName() { return brainRegionName; }
    public String getBrainRegionColor() { return brainRegionColor; }
}
