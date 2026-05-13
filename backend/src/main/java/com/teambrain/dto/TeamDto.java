package com.teambrain.dto;

public class TeamDto {
    private Long id;
    private String teamName;
    private String description;

    public TeamDto(Long id, String teamName, String description) {
        this.id = id;
        this.teamName = teamName;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getTeamName() { return teamName; }
    public String getDescription() { return description; }
}
