package com.teambrain.entity;

import java.io.Serializable;
import java.util.Objects;

public class UserTeamId implements Serializable {
    private Long userId;
    private Long teamId;

    public UserTeamId() {}
    public UserTeamId(Long userId, Long teamId) { this.userId = userId; this.teamId = teamId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    @Override public boolean equals(Object o) {
        if (!(o instanceof UserTeamId)) return false;
        UserTeamId that = (UserTeamId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(teamId, that.teamId);
    }
    @Override public int hashCode() { return Objects.hash(userId, teamId); }
}
