package com.teambrain.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teambrain.entity.BrainPoint;
import com.teambrain.entity.BrainRegion;
import com.teambrain.repository.BrainPointRepository;
import com.teambrain.repository.BrainRegionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@Order(2) // Run after DataInitializer
public class BrainDataImporter implements CommandLineRunner {

    private final BrainRegionRepository regionRepository;
    private final BrainPointRepository pointRepository;

    public BrainDataImporter(BrainRegionRepository regionRepository,
                             BrainPointRepository pointRepository) {
        this.regionRepository = regionRepository;
        this.pointRepository = pointRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only import if point table is empty
        long pointCount = pointRepository.count();
        System.out.println("BrainDataImporter: current point count = " + pointCount);
        if (pointCount > 0) return;

        List<BrainRegion> regions = regionRepository.findAllByOrderBySortOrderAsc();
        System.out.println("BrainDataImporter: region count = " + regions.size());
        if (regions.size() < 6) {
            System.out.println("BrainDataImporter: not enough regions, skipping import");
            return;
        }

        // Read partition JSON from classpath
        InputStream is = getClass().getClassLoader().getResourceAsStream("brain_points_labeled.json");
        if (is == null) {
            System.out.println("brain_points_labeled.json not found, skipping brain point import");
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(is);

        int total = 0;
        for (JsonNode regionNode : root) {
            String regionName = regionNode.get("region_name").asText();
            JsonNode points = regionNode.get("points");

            BrainRegion region = regions.stream()
                    .filter(r -> r.getName().equals(regionName))
                    .findFirst().orElse(null);
            if (region == null) continue;

            List<BrainPoint> batch = new java.util.ArrayList<>();
            for (JsonNode pt : points) {
                batch.add(new BrainPoint(region,
                        pt.get(0).asDouble(), pt.get(1).asDouble(), pt.get(2).asDouble()));
                if (batch.size() >= 500) {
                    pointRepository.saveAll(batch);
                    total += batch.size();
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) {
                pointRepository.saveAll(batch);
                total += batch.size();
            }
        }
        System.out.println("Brain point cloud imported: " + total + " points");
    }
}
