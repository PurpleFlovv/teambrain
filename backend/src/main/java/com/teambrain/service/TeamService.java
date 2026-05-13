package com.teambrain.service;

import com.teambrain.dto.TeamDto;
import com.teambrain.entity.Team;
import com.teambrain.repository.TeamRepository;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public TeamDto getTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }

    public TeamDto updateTeam(Long id, String teamName, String description) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        if (teamName != null) team.setTeamName(teamName);
        if (description != null) team.setDescription(description);
        teamRepository.save(team);
        return new TeamDto(team.getId(), team.getTeamName(), team.getDescription());
    }
}
