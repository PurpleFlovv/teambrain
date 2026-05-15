package com.teambrain.dto;

import java.util.List;

public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private Long ownedTeamId;
    private List<Long> teamIds;
    private List<String> roles;

    public LoginResponse(String token, Long userId, String username, Long ownedTeamId,
                         List<Long> teamIds, List<String> roles) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.ownedTeamId = ownedTeamId;
        this.teamIds = teamIds;
        this.roles = roles;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public Long getOwnedTeamId() { return ownedTeamId; }
    public List<Long> getTeamIds() { return teamIds; }
    public List<String> getRoles() { return roles; }
}
