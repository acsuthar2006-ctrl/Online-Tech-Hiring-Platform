package com.techhiring.platform.controller;

import com.techhiring.platform.entity.InterviewerApplication;
import com.techhiring.platform.service.InterviewerApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviewer-applications")
@RequiredArgsConstructor
public class InterviewerApplicationController {

  private final InterviewerApplicationService interviewerApplicationService;

  @PostMapping
  public ResponseEntity<InterviewerApplication> createApplication(@RequestBody InterviewerApplication application) {
    return ResponseEntity.ok(interviewerApplicationService.createApplication(application));
  }

  @GetMapping("/{id}")
  public ResponseEntity<InterviewerApplication> getApplication(@PathVariable Long id) {
    return interviewerApplicationService.getApplicationById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/interviewer/{interviewerId}")
  public ResponseEntity<List<InterviewerApplication>> getApplicationsByInterviewer(@PathVariable Long interviewerId) {
    return ResponseEntity.ok(interviewerApplicationService.getApplicationsByInterviewer(interviewerId));
  }

  @GetMapping("/company/{companyId}")
  public ResponseEntity<List<InterviewerApplication>> getApplicationsByCompany(@PathVariable Long companyId) {
    return ResponseEntity.ok(interviewerApplicationService.getApplicationsByCompany(companyId));
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<InterviewerApplication> updateApplicationStatus(@PathVariable Long id, @RequestParam String status) {
    return ResponseEntity.ok(interviewerApplicationService.updateApplicationStatus(id, status));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
    interviewerApplicationService.deleteApplication(id);
    return ResponseEntity.ok().build();
  }
}
