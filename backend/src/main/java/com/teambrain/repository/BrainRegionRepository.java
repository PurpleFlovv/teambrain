package com.teambrain.repository;

import com.teambrain.entity.BrainRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrainRegionRepository extends JpaRepository<BrainRegion, Long> {
    List<BrainRegion> findAllByOrderBySortOrderAsc();
    List<BrainRegion> findByTeamIdOrderBySortOrderAsc(Long teamId);
    List<BrainRegion> findByTeamIsNullOrderBySortOrderAsc();
}
