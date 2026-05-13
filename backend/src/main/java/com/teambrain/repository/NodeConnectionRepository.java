package com.teambrain.repository;

import com.teambrain.entity.NodeConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NodeConnectionRepository extends JpaRepository<NodeConnection, Long> {
    List<NodeConnection> findByTeamId(Long teamId);
}
