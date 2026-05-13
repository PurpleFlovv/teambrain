package com.teambrain.repository;

import com.teambrain.entity.BrainPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrainPointRepository extends JpaRepository<BrainPoint, Long> {
    List<BrainPoint> findByBrainRegionId(Long regionId);
}
