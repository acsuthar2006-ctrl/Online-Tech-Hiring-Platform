package com.techhiring.platform.controller;

import com.techhiring.platform.dto.JobDto;
import com.techhiring.platform.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class JobPostingController {

  private final JobPostingService jobPostingService;

  @PostMapping
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('COMPANY_ADMIN')")
  public ResponseEntity<JobDto.JobPostingResponse> createJob(@RequestBody JobDto.JobPostingRequest request, java.security.Principal principal) {
    return ResponseEntity.ok(jobPostingService.createJob(request, principal.getName()));
  }

  @GetMapping
  public ResponseEntity<List<JobDto.JobPostingResponse>> getAllJobs() {
    return ResponseEntity.ok(jobPostingService.getAllJobs());
  }

  @GetMapping("/{id}")
  public ResponseEntity<JobDto.JobPostingResponse> getJobById(@PathVariable Long id) {
    return ResponseEntity.ok(jobPostingService.getJobById(id));
  }

  @GetMapping("/company/{companyId}")
  public ResponseEntity<List<JobDto.JobPostingResponse>> getJobsByCompany(@PathVariable Long companyId) {
    return ResponseEntity.ok(jobPostingService.getJobsByCompany(companyId));
  }
}
