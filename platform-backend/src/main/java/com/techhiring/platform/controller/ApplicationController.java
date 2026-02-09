package com.techhiring.platform.controller;

import com.techhiring.platform.entity.Application;
import com.techhiring.platform.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

  private final ApplicationService applicationService;

  @PostMapping
  public ResponseEntity<Application> createApplication(@RequestBody Application application) {
    return ResponseEntity.ok(applicationService.createApplication(application));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Application> getApplication(@PathVariable Long id) {
    return applicationService.getApplicationById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/candidate/{candidateId}")
  public ResponseEntity<List<Application>> getApplicationsByCandidate(@PathVariable Long candidateId) {
    return ResponseEntity.ok(applicationService.getApplicationsByCandidate(candidateId));
  }

  @GetMapping("/position/{positionId}")
  public ResponseEntity<List<Application>> getApplicationsByPosition(@PathVariable Long positionId) {
    return ResponseEntity.ok(applicationService.getApplicationsByPosition(positionId));
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<Application> updateApplicationStatus(@PathVariable Long id, @RequestParam String status) {
    return ResponseEntity.ok(applicationService.updateApplicationStatus(id, status));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
    applicationService.deleteApplication(id);
    return ResponseEntity.ok().build();
  }
}
