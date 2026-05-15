package com.teambrain.service;

import com.teambrain.dto.TeamDto;
import com.teambrain.entity.Team;
import com.teambrain.entity.User;
import com.teambrain.entity.UserTeam;
import com.teambrain.entity.UserTeamId;
import com.teambrain.repository.TeamRepository;
import com.teambrain.repository.TeamNodeRepository;
import com.teambrain.repository.UserRepository;
import com.teambrain.repository.UserTeamRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserTeamRepository userTeamRepo;
    private final UserRepository userRepo;
    private final TeamNodeRepository teamNodeRepo;

    public TeamService(TeamRepository teamRepository, UserTeamRepository userTeamRepo,
                       UserRepository userRepo, TeamNodeRepository teamNodeRepo) {
        this.teamRepository = teamRepository;
        this.userTeamRepo = userTeamRepo;
        this.userRepo = userRepo;
        this.teamNodeRepo = teamNodeRepo;
    }

    public TeamDto getTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }

    public boolean isOwnerOrAdmin(Long teamId, String username, boolean isAdmin) {
        if (isAdmin) return true;
        return teamRepository.findById(teamId)
                .map(t -> t.getUser().getUsername().equals(username))
                .orElse(false);
    }

    public TeamDto updateTeam(Long id, String teamName, String description) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        if (teamName != null) team.setTeamName(teamName);
        if (description != null) team.setDescription(description);
        teamRepository.save(team);
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }

    public boolean isOwner(Long teamId, Long userId) {
        return teamRepository.findById(teamId)
            .map(t -> t.getUser().getId().equals(userId))
            .orElse(false);
    }

    public boolean isOwner(Long teamId, String username) {
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) return false;
        return isOwner(teamId, user.getId());
    }

    public List<Map<String, Object>> getMyTeams(Long userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        // Always include owned teams (team.user_id == userId)
        List<Team> ownedTeams = teamRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(userId)).toList();
        for (Team t : ownedTeams) {
            seen.add(t.getId());
            long nodeCount = teamNodeRepo.findByTeamId(t.getId()).size();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("teamName", t.getTeamName());
            m.put("description", t.getDescription() != null ? t.getDescription() : "");
            m.put("ownerUsername", t.getUser().getUsername());
            m.put("nodeCount", nodeCount);
            m.put("isOwner", true);
            result.add(m);
        }

        // Add joined teams from user_team
        List<UserTeam> memberships = userTeamRepo.findByUserId(userId);
        for (UserTeam ut : memberships) {
            if (!seen.add(ut.getTeamId())) continue;
            Team t = teamRepository.findById(ut.getTeamId()).orElse(null);
            if (t == null) continue;
            long nodeCount = teamNodeRepo.findByTeamId(t.getId()).size();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("teamName", t.getTeamName());
            m.put("description", t.getDescription() != null ? t.getDescription() : "");
            m.put("ownerUsername", t.getUser().getUsername());
            m.put("nodeCount", nodeCount);
            m.put("isOwner", t.getUser().getId().equals(userId));
            result.add(m);
        }
        return result;
    }

    public List<Map<String, Object>> getMembers(Long teamId) {
        List<UserTeam> memberships = userTeamRepo.findByTeamId(teamId);
        List<Map<String, Object>> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        // Always include team owner
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team != null) {
            User owner = team.getUser();
            seen.add(owner.getId());
            result.add(Map.of("id", owner.getId(), "username", owner.getUsername(), "isOwner", true));
        }

        // Add other members
        for (UserTeam ut : memberships) {
            if (!seen.add(ut.getUserId())) continue;
            User u = userRepo.findById(ut.getUserId()).orElse(null);
            if (u == null) continue;
            result.add(Map.<String, Object>of(
                "id", u.getId(), "username", u.getUsername(),
                "isOwner", isOwner(teamId, u.getId())
            ));
        }
        return result;
    }

    public void joinTeam(Long teamId, Long userId) {
        if (userTeamRepo.findById(new UserTeamId(userId, teamId)).isEmpty()) {
            userTeamRepo.save(new UserTeam(userId, teamId));
        }
    }

    public void leaveTeam(Long teamId, Long userId) {
        userTeamRepo.deleteByUserIdAndTeamId(userId, teamId);
    }

    public void removeMember(Long teamId, Long userId) {
        userTeamRepo.deleteByUserIdAndTeamId(userId, teamId);
    }
}
