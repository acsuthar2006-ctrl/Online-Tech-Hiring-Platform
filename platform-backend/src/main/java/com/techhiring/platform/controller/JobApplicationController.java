package com.techhiring.platform.controller;

import com.techhiring.platform.dto.JobDto;
import com.techhiring.platform.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class JobApplicationController {

  private final JobApplicationService jobApplicationService;

  @PostMapping
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANDIDATE')")
  public ResponseEntity<JobDto.JobApplicationResponse> applyForJob(@RequestBody JobDto.JobApplicationRequest request) {
    return ResponseEntity.ok(jobApplicationService.applyForJob(request));
  }

  @GetMapping("/candidate/{candidateId}")
  @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANDIDATE', 'SYSTEM_ADMIN')")
  public ResponseEntity<List<JobDto.JobApplicationResponse>> getApplicationsByCandidate(@PathVariable Long candidateId) {
    return ResponseEntity.ok(jobApplicationService.getApplicationsByCandidate(candidateId));
  }

  @GetMapping("/job/{jobId}")
  @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'INTERVIEWER', 'SYSTEM_ADMIN')")
  public ResponseEntity<List<JobDto.JobApplicationResponse>> getApplicationsByJob(@PathVariable Long jobId) {
    return ResponseEntity.ok(jobApplicationService.getApplicationsByJob(jobId));
  }
}
