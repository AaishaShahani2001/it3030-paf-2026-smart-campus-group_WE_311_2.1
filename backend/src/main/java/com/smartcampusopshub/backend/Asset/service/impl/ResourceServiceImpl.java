package com.smartcampusopshub.backend.Asset.service.impl;

import com.smartcampusopshub.backend.Asset.dto.ResourceRequest;
import com.smartcampusopshub.backend.Asset.dto.ResourceResponse;
import com.smartcampusopshub.backend.Asset.entity.Resource;
import com.smartcampusopshub.backend.Asset.entity.ResourceStatus;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;
import com.smartcampusopshub.backend.common.exception.ConflictException;
import com.smartcampusopshub.backend.common.exception.ResourceNotFoundException;
import com.smartcampusopshub.backend.Asset.mapper.ResourceMapper;
import com.smartcampusopshub.backend.Asset.repository.ResourceRepository;
import com.smartcampusopshub.backend.Asset.service.ResourceService;
import com.smartcampusopshub.backend.Asset.validation.ResourceRequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceRequestValidator resourceRequestValidator;

    @Override
    @Transactional
    public ResourceResponse create(ResourceRequest request) {
        resourceRequestValidator.validate(request);

        if (resourceRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException("Resource with this name already exists");
        }

        Resource resource = ResourceMapper.toEntity(request);
        Resource savedResource = resourceRepository.save(resource);
        return ResourceMapper.toResponse(savedResource);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponse> getAll(ResourceType type, Integer capacity, String location) {
        String safeLocation = location == null ? "" : location;
        List<Resource> resources;

        if (type != null && capacity != null) {
            resources = resourceRepository.findByTypeAndCapacityGreaterThanEqualAndLocationContainingIgnoreCase(
                    type, capacity, safeLocation);
        } else if (type != null) {
            resources = resourceRepository.findByType(type).stream()
                    .filter(resource -> resource.getLocation().toLowerCase().contains(safeLocation.toLowerCase()))
                    .filter(resource -> capacity == null || resource.getCapacity() >= capacity)
                    .toList();
        } else if (capacity != null) {
            resources = resourceRepository.findByCapacityGreaterThanEqual(capacity).stream()
                    .filter(resource -> resource.getLocation().toLowerCase().contains(safeLocation.toLowerCase()))
                    .toList();
        } else if (location != null && !location.isBlank()) {
            resources = resourceRepository.findByLocationContainingIgnoreCase(location);
        } else {
            resources = resourceRepository.findAll();
        }

        return resources.stream()
                .map(ResourceMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResourceResponse getById(Long id) {
        Resource resource = findResourceById(id);
        return ResourceMapper.toResponse(resource);
    }

    @Override
    @Transactional
    public ResourceResponse update(Long id, ResourceRequest request) {
        resourceRequestValidator.validate(request);

        Resource existingResource = findResourceById(id);

        resourceRepository.findByNameIgnoreCase(request.getName())
                .ifPresent(foundResource -> {
                    if (!foundResource.getId().equals(id)) {
                        throw new ConflictException("Another resource with this name already exists");
                    }
                });

        ResourceMapper.updateEntity(existingResource, request);
        Resource updatedResource = resourceRepository.save(existingResource);
        return ResourceMapper.toResponse(updatedResource);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Resource existingResource = findResourceById(id);
        resourceRepository.delete(existingResource);
    }

    @Override
    @Transactional
    public ResourceResponse updateStatus(Long id, ResourceStatus status) {
        Resource resource = findResourceById(id);
        resource.setStatus(status);
        Resource updatedResource = resourceRepository.save(resource);
        return ResourceMapper.toResponse(updatedResource);
    }

    private Resource findResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
    }
}