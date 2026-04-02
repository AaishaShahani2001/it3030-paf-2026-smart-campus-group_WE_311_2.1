package com.smartcampusopshub.backend.Asset.service;

import com.smartcampusopshub.backend.Asset.dto.ResourceRequest;
import com.smartcampusopshub.backend.Asset.dto.ResourceResponse;
import com.smartcampusopshub.backend.Asset.entity.ResourceStatus;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;

import java.util.List;

public interface ResourceService {

    ResourceResponse create(ResourceRequest request);

    List<ResourceResponse> getAll(ResourceType type, Integer capacity, String location);

    ResourceResponse getById(Long id);

    ResourceResponse update(Long id, ResourceRequest request);

    void delete(Long id);

    ResourceResponse updateStatus(Long id, ResourceStatus status);
}