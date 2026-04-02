package com.smartcampusopshub.backend.Asset.repository;

import com.smartcampusopshub.backend.Asset.entity.Resource;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Resource> findByNameIgnoreCase(String name);

    List<Resource> findByType(ResourceType type);

    List<Resource> findByLocationContainingIgnoreCase(String location);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    List<Resource> findByTypeAndCapacityGreaterThanEqualAndLocationContainingIgnoreCase(
            ResourceType type,
            Integer capacity,
            String location
    );
}