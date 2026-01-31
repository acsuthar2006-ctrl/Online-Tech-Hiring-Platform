package com.techhiring.platform.service;

import com.techhiring.platform.dto.JobDto;
import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.JobApplication;
import com.techhiring.platform.entity.JobPosting;
import com.techhiring.platform.repository.CandidateRepository;
import com.techhiring.platform.repository.JobApplicationRepository;
import com.techhiring.platform.repository.JobPostingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

  private final JobApplicationRepository jobApplicationRepository;
  private final CandidateRepository candidateRepository;
  private final JobPostingRepository jobPostingRepository;

  @Transactional
  public JobDto.JobApplicationResponse applyForJob(JobDto.JobApplicationRequest request) {
    Candidate candidate = candidateRepository.findById(request.getCandidateId())
        .orElseThrow(() -> new EntityNotFoundException("Candidate not found"));
    
    JobPosting jobPosting = jobPostingRepository.findById(request.getJobPostingId())
        .orElseThrow(() -> new EntityNotFoundException("Job posting not found"));

    JobApplication application = JobApplication.builder()
        .candidate(candidate)
        .jobPosting(jobPosting)
        .coverLetter(request.getCoverLetter())
        .resumeUrl(request.getResumeUrl())
        .status(JobApplication.ApplicationStatus.APPLIED)
        .appliedAt(LocalDateTime.now())
        .build();

    JobApplication savedApplication = jobApplicationRepository.save(application);
    return mapToResponse(savedApplication);
  }

  public List<JobDto.JobApplicationResponse> getApplicationsByCandidate(Long candidateId) {
    return jobApplicationRepository.findByCandidateId(candidateId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  public List<JobDto.JobApplicationResponse> getApplicationsByJob(Long jobId) {
    return jobApplicationRepository.findByJobPostingId(jobId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  private JobDto.JobApplicationResponse mapToResponse(JobApplication app) {
    return JobDto.JobApplicationResponse.builder()
        .id(app.getId())
        .candidateName(app.getCandidate().getFullName())
        .jobTitle(app.getJobPosting().getTitle())
        .companyName(app.getJobPosting().getCompany().getName())
        .status(app.getStatus())
        .appliedAt(app.getAppliedAt())
        .build();
  }
}
