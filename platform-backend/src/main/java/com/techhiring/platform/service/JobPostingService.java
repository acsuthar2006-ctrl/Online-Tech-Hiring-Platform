package com.techhiring.platform.service;

import com.techhiring.platform.dto.JobDto;
import com.techhiring.platform.entity.Company;
import com.techhiring.platform.entity.CompanyAdmin;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.JobPosting;
import com.techhiring.platform.repository.CompanyAdminRepository;
import com.techhiring.platform.repository.CompanyRepository;
import com.techhiring.platform.repository.InterviewerRepository;
import com.techhiring.platform.repository.JobPostingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobPostingService {

  private final JobPostingRepository jobPostingRepository;
  private final CompanyAdminRepository companyAdminRepository;
  private final InterviewerRepository interviewerRepository;

  @Transactional
  public JobDto.JobPostingResponse createJob(JobDto.JobPostingRequest request, String ownerEmail) {
    CompanyAdmin companyAdmin = companyAdminRepository.findByEmail(ownerEmail)
        .orElseThrow(() -> new EntityNotFoundException("Company Admin not found"));

    Company company = companyAdmin.getCompany();

    List<Interviewer> assignedInterviewers = new ArrayList<>();
    if (request.getAssignedInterviewerIds() != null && !request.getAssignedInterviewerIds().isEmpty()) {
      assignedInterviewers = interviewerRepository.findAllById(request.getAssignedInterviewerIds());
      // Verify all belong to the same company
      for (Interviewer interviewer : assignedInterviewers) {
        if (!interviewer.getCompany().getId().equals(company.getId())) {
          throw new IllegalArgumentException("Cannot assign interviewer from another company");
        }
      }
    }

    JobPosting jobPosting = JobPosting.builder()
        .company(company)
        .title(request.getTitle())
        .description(request.getDescription())
        .requirements(request.getRequirements())
        .location(request.getLocation())
        .salaryRange(request.getSalaryRange())
        .status(JobPosting.JobStatus.OPEN)
        .assignedInterviewers(assignedInterviewers)
        .createdAt(LocalDateTime.now())
        .build();

    JobPosting savedJob = jobPostingRepository.save(jobPosting);
    return mapToResponse(savedJob);
  }

  public List<JobDto.JobPostingResponse> getAllJobs() {
    return jobPostingRepository.findAll().stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  public JobDto.JobPostingResponse getJobById(Long id) {
    JobPosting jobPosting = jobPostingRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Job posting not found"));
    return mapToResponse(jobPosting);
  }

  public List<JobDto.JobPostingResponse> getJobsByCompany(Long companyId) {
    return jobPostingRepository.findByCompanyId(companyId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  private JobDto.JobPostingResponse mapToResponse(JobPosting job) {
    List<Long> interviewerIds = job.getAssignedInterviewers() != null ?
        job.getAssignedInterviewers().stream().map(Interviewer::getId).collect(Collectors.toList()) : new ArrayList<>();

    return JobDto.JobPostingResponse.builder()
        .id(job.getId())
        .companyName(job.getCompany().getName())
        .title(job.getTitle())
        .description(job.getDescription())
        .requirements(job.getRequirements())
        .location(job.getLocation())
        .salaryRange(job.getSalaryRange())
        .status(job.getStatus())
        .createdAt(job.getCreatedAt())
        .assignedInterviewerIds(interviewerIds)
        .build();
  }
}
