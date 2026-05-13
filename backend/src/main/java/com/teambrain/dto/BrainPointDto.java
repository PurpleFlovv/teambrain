package com.teambrain.dto;

public class BrainPointDto {
    private Long regionId;
    private String regionName;
    private String colorHex;
    private double x;
    private double y;
    private double z;

    public BrainPointDto(Long regionId, String regionName, String colorHex, double x, double y, double z) {
        this.regionId = regionId;
        this.regionName = regionName;
        this.colorHex = colorHex;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Long getRegionId() { return regionId; }
    public String getRegionName() { return regionName; }
    public String getColorHex() { return colorHex; }
    public double getX() { return x; }
    public double getY() { return y; }
    public double getZ() { return z; }
}
