package com.smartcampusopshub.backend.Asset.controller;

import com.smartcampusopshub.backend.Asset.dto.ResourceRequest;
import com.smartcampusopshub.backend.Asset.dto.ResourceResponse;
import com.smartcampusopshub.backend.Asset.dto.ResourceStatusUpdateRequest;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;
import com.smartcampusopshub.backend.Asset.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location
    ) {
        return ResponseEntity.ok(resourceService.getAll(type, capacity, location));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request
    ) {
        return ResponseEntity.ok(resourceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponse> updateResourceStatus(
            @PathVariable Long id,
            @Valid @RequestBody ResourceStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(resourceService.updateStatus(id, request.getStatus()));
    }
}