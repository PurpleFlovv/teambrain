package com.teambrain.dto;

public class NodeConnectionDto {
    private Long id;
    private Long fromNodeId;
    private String fromNodeName;
    private Long fromRegionId;
    private Long toNodeId;
    private String toNodeName;
    private Long toRegionId;
    private String targetType;
    private String connectionType;
    private String colorHex;
    private Double lineWidth;
    private String flowColorHex;
    private Double opacity;

    public NodeConnectionDto(Long id, Long fromNodeId, String fromNodeName, Long fromRegionId,
                             Long toNodeId, String toNodeName, Long toRegionId,
                             String targetType, String connectionType,
                             String colorHex, Double lineWidth, String flowColorHex, Double opacity) {
        this.id = id;
        this.fromNodeId = fromNodeId;
        this.fromNodeName = fromNodeName;
        this.fromRegionId = fromRegionId;
        this.toNodeId = toNodeId;
        this.toNodeName = toNodeName;
        this.toRegionId = toRegionId;
        this.targetType = targetType;
        this.connectionType = connectionType;
        this.colorHex = colorHex;
        this.lineWidth = lineWidth;
        this.flowColorHex = flowColorHex;
        this.opacity = opacity;
    }

    public Long getId() { return id; }
    public Long getFromNodeId() { return fromNodeId; }
    public String getFromNodeName() { return fromNodeName; }
    public Long getFromRegionId() { return fromRegionId; }
    public Long getToNodeId() { return toNodeId; }
    public String getToNodeName() { return toNodeName; }
    public Long getToRegionId() { return toRegionId; }
    public String getTargetType() { return targetType; }
    public String getConnectionType() { return connectionType; }
    public String getColorHex() { return colorHex; }
    public Double getLineWidth() { return lineWidth; }
    public String getFlowColorHex() { return flowColorHex; }
    public Double getOpacity() { return opacity; }
}
