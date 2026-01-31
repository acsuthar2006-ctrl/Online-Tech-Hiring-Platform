package com.techhiring.platform.dto;

import com.techhiring.platform.entity.JobApplication;
import com.techhiring.platform.entity.JobPosting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class JobDto {

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class JobPostingRequest {
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String salaryRange;
    private Long companyId;
    private java.util.List<Long> assignedInterviewerIds;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class JobPostingResponse {
    private Long id;
    private String companyName;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String salaryRange;
    private JobPosting.JobStatus status;
    private LocalDateTime createdAt;
    private java.util.List<Long> assignedInterviewerIds;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class JobApplicationRequest {
    private Long candidateId;
    private Long jobPostingId;
    private String coverLetter;
    private String resumeUrl;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class JobApplicationResponse {
    private Long id;
    private String candidateName;
    private String jobTitle;
    private String companyName;
    private JobApplication.ApplicationStatus status;
    private LocalDateTime appliedAt;
  }
}
