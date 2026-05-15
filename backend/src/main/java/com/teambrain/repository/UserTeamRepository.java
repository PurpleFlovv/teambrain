package com.teambrain.repository;

import com.teambrain.entity.UserTeam;
import com.teambrain.entity.UserTeamId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserTeamRepository extends JpaRepository<UserTeam, UserTeamId> {
    List<UserTeam> findByUserId(Long userId);
    List<UserTeam> findByTeamId(Long teamId);

    @Transactional
    void deleteByUserIdAndTeamId(Long userId, Long teamId);
}
