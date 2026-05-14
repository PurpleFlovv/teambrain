package com.teambrain.repository;

import com.teambrain.entity.ConnectionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConnectionTypeRepository extends JpaRepository<ConnectionType, Long> {
    List<ConnectionType> findByTeamId(Long teamId);
}
