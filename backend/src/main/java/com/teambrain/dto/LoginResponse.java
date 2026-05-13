package com.teambrain.dto;

public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private Long teamId;

    public LoginResponse(String token, Long userId, String username, Long teamId) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.teamId = teamId;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public Long getTeamId() { return teamId; }
}
