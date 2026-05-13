package com.teambrain.repository;

import com.teambrain.entity.TeamNode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamNodeRepository extends JpaRepository<TeamNode, Long> {
    List<TeamNode> findByTeamId(Long teamId);
    List<TeamNode> findByTeamIdAndBrainRegionId(Long teamId, Long regionId);
}
