package com.techhiring.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.techhiring.platform.entity.CandidateEducation;
import com.techhiring.platform.entity.CandidateExperience;

public class CompanyAdminDto {

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DashboardStats {
    private long totalInterviews;
    private long activeCandidates;
    private long hiredInterviewers;
    private long openPositions;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CandidateInfo {
    private Long id;
    private String fullName;
    private String email;
    private Long applicationId;
    private Long positionId;
    private String positionTitle;
    private String applicationDate;
    private String status;
    private String interviewStatus;
    private String candidateOutcome;
    private Long interviewId; // Interview table id (when scheduled/completed)
    private Double score;
    private List<String> skills;
    private boolean appliedDirectly;
    private Long assignedInterviewerId;
    private String assignedInterviewerName;
    private String resumeUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CandidateProfileDetails {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String bio;
    private List<String> skills;
    private List<CandidateExperience> experience;
    private List<CandidateEducation> education;
    private String resumeUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class InterviewerInfo {
    private Long id;
    private String fullName;
    private String email;
    private String bio;
    private Double hourlyRate;
    private Integer totalInterviewsConducted;
    private Double averageRating;
    private String availabilityStatus;
    private List<String> expertises;
    private Long applicationId;
    private String applicationStatus; // APPLIED, APPROVED, REJECTED, null if not applied
    private boolean appliedToCompany;
    private Long positionId;          // position/job applied for (if any)
    private String positionTitle;     // position/job title (if any)
    private long upcomingScheduled;
    private long upcomingInterviews;  // upcoming interviews for this company
    private long completedInterviews; // completed interviews for this company
    private String resumeUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class InterviewInfo {
    private Long id;
    private String interviewId;
    private String title;
    private String candidateName;
    private String candidateEmail;
    private Long candidateId;
    private String interviewerName;
    private String interviewerEmail;
    private Long interviewerId;
    private String positionTitle;
    private Long positionId;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private String status;
    private String candidateOutcome;
    private String interviewRound;
    private String interviewType;
    private Double score;
    private String feedback;
    private Integer durationMinutes;
    private String meetingLink;
    private String recordingUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CreatePositionRequest {
    private Long companyId;
    private String positionTitle;
    private String jobDescription;
    private String salaryRange;
    private String requiredExpertise;
    private String location;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ProfileResponse {
    private String companyName;
    private String adminName;
    private String adminEmail;
    private String industry;
    private String phone;
    private String location;
    private String website;
    private String description;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateProfileRequest {
    private Long companyId;
    private String companyName;
    private String adminName;
    private String industry;
    private String phone;
    private String location;
    private String website;
    private String description;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PositionMinimalInfo {
    private Long positionId;
    private String positionTitle;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ApprovedCompanyInfo {
    private Long companyId;
    private String companyName;
    private List<PositionMinimalInfo> positions;
  }
}
