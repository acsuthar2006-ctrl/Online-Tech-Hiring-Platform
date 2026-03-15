package com.techhiring.platform.service;

import com.techhiring.platform.dto.NotificationsDto;
import com.techhiring.platform.entity.*;
import com.techhiring.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

  private final InterviewRepository interviewRepository;
  private final CandidateSkillRepository candidateSkillRepository;
  private final CandidateExperienceRepository candidateExperienceRepository;
  private final CandidateEducationRepository candidateEducationRepository;
  private final InterviewerExpertiseRepository interviewerExpertiseRepository;

  private final PositionRepository positionRepository;
  private final ApplicationRepository applicationRepository;
  private final InterviewerApplicationRepository interviewerApplicationRepository;

  public NotificationsDto.NotificationResponse getNotifications(User user) {
    List<NotificationsDto.NotificationItem> items = new ArrayList<>();

    boolean profileComplete = isProfileComplete(user);
    if (!profileComplete) {
      items.add(NotificationsDto.NotificationItem.builder()
          .id("profile")
          .type("PROFILE_INCOMPLETE")
          .title("Complete your profile")
          .message("Finish setting up your profile to unlock the full experience.")
          .actionUrl(profileUrlFor(user))
          .createdAt(LocalDateTime.now())
          .build());
    }

    if (user instanceof Candidate) {
      items.addAll(candidateNewJobItems((Candidate) user));
      items.addAll(candidateApplicationOutcomeItems((Candidate) user));
    } else if (user instanceof Interviewer) {
      items.addAll(interviewerNewJobItems((Interviewer) user));
      items.addAll(interviewerApplicationStatusItems((Interviewer) user));
    } else if (user instanceof CompanyAdmin) {
      items.addAll(companyAdminNewApplicationItems((CompanyAdmin) user));
      items.addAll(companyAdminCandidateOutcomeItems((CompanyAdmin) user));
    }

    items.addAll(interviewReminderItems(user));

    // Sort newest-first for a stable UI.
    items = items.stream()
        .sorted(Comparator.comparing(NotificationsDto.NotificationItem::getCreatedAt).reversed())
        .collect(Collectors.toList());

    return NotificationsDto.NotificationResponse.builder()
        .count(items.size())
        .items(items)
        .build();
  }

  private List<NotificationsDto.NotificationItem> interviewReminderItems(User user) {
    List<Interview> raw;

    if (user instanceof Candidate) {
      raw = interviewRepository.findByCandidate_Email(user.getEmail());
    } else if (user instanceof Interviewer) {
      raw = interviewRepository.findByInterviewer_Email(user.getEmail());
    } else if (user instanceof CompanyAdmin) {
      CompanyAdmin admin = (CompanyAdmin) user;
      Long companyId = admin.getCompany() != null ? admin.getCompany().getId() : null;
      raw = companyId != null ? interviewRepository.findByCompanyId(companyId) : List.of();
    } else {
      raw = List.of();
    }

    return raw.stream()
        .filter(iv -> iv.getStatus() == Interview.InterviewStatus.SCHEDULED || iv.getStatus() == Interview.InterviewStatus.IN_PROGRESS)
        .map(iv -> NotificationsDto.NotificationItem.builder()
            .id("interview-" + iv.getId())
            .type("INTERVIEW_REMINDER")
            .title("Interview reminder")
            .message(buildInterviewMessage(iv))
            .actionUrl(interviewScheduleUrlFor(user))
            .createdAt(iv.getUpdatedAt() != null ? iv.getUpdatedAt() : (iv.getCreatedAt() != null ? iv.getCreatedAt() : LocalDateTime.now()))
            .build())
        .collect(Collectors.toList());
  }

  private String buildInterviewMessage(Interview iv) {
    String who = iv.getCandidate() != null && iv.getCandidate().getFullName() != null
        ? iv.getCandidate().getFullName()
        : "Candidate";
    String when = (iv.getScheduledDate() != null && iv.getScheduledTime() != null)
        ? (iv.getScheduledDate().toString() + " " + iv.getScheduledTime().toString())
        : "Time TBD";
    String role = iv.getPosition() != null && iv.getPosition().getPositionTitle() != null
        ? iv.getPosition().getPositionTitle()
        : "Interview";
    return who + " • " + role + " • " + when;
  }

  private boolean isProfileComplete(User user) {
    if (user instanceof Candidate) {
      Candidate c = (Candidate) user;
      boolean basic = notBlank(c.getPhone()) && notBlank(c.getLocation()) && notBlank(c.getBio());
      boolean hasSkills = candidateSkillRepository.findByCandidateId(c.getId()).stream().findAny().isPresent();
      boolean hasExp = candidateExperienceRepository.findByCandidateId(c.getId()).stream().findAny().isPresent();
      boolean hasEdu = candidateEducationRepository.findByCandidateId(c.getId()).stream().findAny().isPresent();
      return basic && hasSkills && hasExp && hasEdu;
    }

    if (user instanceof Interviewer) {
      Interviewer i = (Interviewer) user;
      boolean basic = notBlank(i.getPhone()) && notBlank(i.getBio()) && notBlank(i.getAvailabilityStatus());
      boolean hasExpertise = interviewerExpertiseRepository.findByInterviewerId(i.getId()).stream().findAny().isPresent();
      return basic && hasExpertise;
    }

    if (user instanceof CompanyAdmin) {
      CompanyAdmin admin = (CompanyAdmin) user;
      Company company = admin.getCompany();
      if (company == null) return false;
      return notBlank(admin.getFullName()) &&
          notBlank(company.getIndustry()) &&
          notBlank(company.getPhone()) &&
          notBlank(company.getLocation()) &&
          notBlank(company.getWebsite()) &&
          notBlank(company.getDescription());
    }

    return true;
  }

  private String profileUrlFor(User user) {
    if (user instanceof Candidate) return "/candidate/profile.html";
    if (user instanceof Interviewer) return "/interviewer/interviewer-profile.html";
    if (user instanceof CompanyAdmin) return "/company-admin/company-admin-profile.html";
    return "/";
  }

  private String interviewScheduleUrlFor(User user) {
    if (user instanceof Candidate) return "/candidate/my_schedule.html";
    if (user instanceof Interviewer) return "/interviewer/interview-schedule.html";
    if (user instanceof CompanyAdmin) return "/company-admin/company-interviews-schedule.html";
    return "/";
  }

  private boolean notBlank(String s) {
    return s != null && !s.trim().isEmpty();
  }

  // ==================== CANDIDATE: NEW JOBS + OUTCOMES ====================

  private List<NotificationsDto.NotificationItem> candidateNewJobItems(Candidate candidate) {
    // Consider jobs created in the last 7 days as "new"
    LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

    List<String> skills = candidateSkillRepository.findByCandidateId(candidate.getId()).stream()
        .map(CandidateSkill::getSkillName)
        .filter(this::notBlank)
        .map(String::toLowerCase)
        .collect(Collectors.toList());

    if (skills.isEmpty()) {
      // If we don't know the candidate's skills yet, just show no "new jobs" notifications
      return List.of();
    }

    return positionRepository.findByStatus("OPEN").stream()
        .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(cutoff))
        .filter(p -> positionMatchesAnySkill(p, skills))
        .map(p -> NotificationsDto.NotificationItem.builder()
            .id("job-" + p.getId())
            .type("NEW_JOB_MATCH")
            .title("New job posted")
            .message(p.getCompany().getCompanyName() + " • " + p.getPositionTitle())
            .actionUrl("/candidate/companies.html")
            .createdAt(p.getCreatedAt())
            .build())
        .collect(Collectors.toList());
  }

  private List<NotificationsDto.NotificationItem> candidateApplicationOutcomeItems(Candidate candidate) {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(14);

    List<Application> apps = applicationRepository.findByCandidateId(candidate.getId());
    if (apps.isEmpty()) return List.of();

    return apps.stream()
        .filter(a -> a.getStatus() != null && !"APPLIED".equalsIgnoreCase(a.getStatus()))
        .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(cutoff))
        .map(a -> {
          String status = a.getStatus().toUpperCase();
          String title = "Application updated";
          String message;
          if ("SHORTLISTED".equals(status) || "INTERVIEW_SCHEDULED".equals(status)) {
            title = "You have been shortlisted";
            message = "Shortlisted for " + safePositionTitle(a) + " at " + safeCompanyName(a);
          } else if ("REJECTED".equals(status)) {
            title = "Application rejected";
            message = "Application for " + safePositionTitle(a) + " at " + safeCompanyName(a) + " was rejected.";
          } else if ("OFFERED".equals(status)) {
            title = "Offer received";
            message = "You received an offer for " + safePositionTitle(a) + " at " + safeCompanyName(a) + ".";
          } else {
            message = "Status for " + safePositionTitle(a) + " at " + safeCompanyName(a) + " changed to " + status;
          }

          return NotificationsDto.NotificationItem.builder()
              .id("app-" + a.getId())
              .type("APPLICATION_STATUS")
              .title(title)
              .message(message)
              .actionUrl("/candidate/companies.html")
              .createdAt(a.getCreatedAt())
              .build();
        })
        .collect(Collectors.toList());
  }

  // ==================== INTERVIEWER: NEW JOBS + APPLICATION STATUS ====================

  private List<NotificationsDto.NotificationItem> interviewerNewJobItems(Interviewer interviewer) {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

    List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(interviewer.getId()).stream()
        .map(InterviewerExpertise::getExpertiseArea)
        .filter(this::notBlank)
        .map(String::toLowerCase)
        .collect(Collectors.toList());

    if (expertises.isEmpty()) {
      return List.of();
    }

    // Only show jobs from companies where this interviewer has an approved application
    List<InterviewerApplication> approvedApps = interviewerApplicationRepository
        .findByInterviewerId(interviewer.getId()).stream()
        .filter(ia -> "APPROVED".equalsIgnoreCase(ia.getStatus()))
        .collect(Collectors.toList());

    if (approvedApps.isEmpty()) {
      return List.of();
    }

    Set<Long> companyIds = approvedApps.stream()
        .map(ia -> ia.getCompany().getId())
        .collect(Collectors.toSet());

    return companyIds.stream()
        .flatMap(cid -> positionRepository.findByCompanyIdAndStatus(cid, "OPEN").stream())
        .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(cutoff))
        .filter(p -> positionMatchesAnySkill(p, expertises))
        .map(p -> NotificationsDto.NotificationItem.builder()
            .id("iv-job-" + p.getId())
            .type("NEW_JOB_FOR_INTERVIEWER")
            .title("New role at " + p.getCompany().getCompanyName())
            .message(p.getPositionTitle() + " • " + safeText(p.getLocation(), "Location flexible"))
            .actionUrl("/interviewer/hiring-companies.html")
            .createdAt(p.getCreatedAt())
            .build())
        .collect(Collectors.toList());
  }

  private List<NotificationsDto.NotificationItem> interviewerApplicationStatusItems(Interviewer interviewer) {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

    return interviewerApplicationRepository.findByInterviewerId(interviewer.getId()).stream()
        .filter(ia -> ia.getCreatedAt() != null && ia.getCreatedAt().isAfter(cutoff))
        .filter(ia -> !"APPLIED".equalsIgnoreCase(ia.getStatus()))
        .map(ia -> {
          String status = ia.getStatus().toUpperCase();
          String title;
          String message;
          if ("APPROVED".equals(status)) {
            title = "Company approved you";
            message = "Approved as interviewer for " + ia.getCompany().getCompanyName();
          } else if ("REJECTED".equals(status)) {
            title = "Application rejected";
            message = "Application to interview for " + ia.getCompany().getCompanyName() + " was rejected.";
          } else {
            title = "Application updated";
            message = "Your application for " + ia.getCompany().getCompanyName() + " is now " + status;
          }

          return NotificationsDto.NotificationItem.builder()
              .id("iv-app-" + ia.getId())
              .type("INTERVIEWER_APPLICATION_STATUS")
              .title(title)
              .message(message)
              .actionUrl("/interviewer/hiring-companies.html")
              .createdAt(ia.getCreatedAt())
              .build();
        })
        .collect(Collectors.toList());
  }

  // ==================== COMPANY ADMIN: APPLICATIONS + CANDIDATE OUTCOMES ====================

  private List<NotificationsDto.NotificationItem> companyAdminNewApplicationItems(CompanyAdmin admin) {
    Company company = admin.getCompany();
    if (company == null) return List.of();

    Long companyId = company.getId();
    if (companyId == null) return List.of();

    LocalDateTime cutoff = LocalDateTime.now().minusDays(14);

    List<NotificationsDto.NotificationItem> items = new ArrayList<>();

    // Candidate applications to this company's positions
    List<Application> candidateApps = applicationRepository.findByPosition_CompanyId(companyId);
    items.addAll(candidateApps.stream()
        .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(cutoff))
        .map(a -> NotificationsDto.NotificationItem.builder()
            .id("co-app-" + a.getId())
            .type("NEW_CANDIDATE_APPLICATION")
            .title("New candidate applied")
            .message(safeCandidateName(a) + " applied for " + safePositionTitle(a))
            .actionUrl("/company-admin/company-candidates.html")
            .createdAt(a.getCreatedAt())
            .build())
        .collect(Collectors.toList()));

    // Interviewer applications to this company
    List<InterviewerApplication> interviewerApps = interviewerApplicationRepository.findByCompanyId(companyId);
    items.addAll(interviewerApps.stream()
        .filter(ia -> ia.getCreatedAt() != null && ia.getCreatedAt().isAfter(cutoff))
        .map(ia -> NotificationsDto.NotificationItem.builder()
            .id("co-iv-app-" + ia.getId())
            .type("NEW_INTERVIEWER_APPLICATION")
            .title("New interviewer applied")
            .message(ia.getInterviewer().getFullName() + " applied to interview for your company.")
            .actionUrl("/company-admin/company-interviewers.html")
            .createdAt(ia.getCreatedAt())
            .build())
        .collect(Collectors.toList()));

    return items;
  }

  private List<NotificationsDto.NotificationItem> companyAdminCandidateOutcomeItems(CompanyAdmin admin) {
    Company company = admin.getCompany();
    if (company == null || company.getId() == null) return List.of();

    LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

    return interviewRepository.findByCompanyId(company.getId()).stream()
        .filter(iv -> iv.getCandidateOutcome() != null && iv.getCandidateOutcome() != Interview.CandidateOutcome.PENDING)
        .filter(iv -> iv.getUpdatedAt() != null && iv.getUpdatedAt().isAfter(cutoff))
        .map(iv -> {
          String title;
          String message;
          if (iv.getCandidateOutcome() == Interview.CandidateOutcome.ACCEPTED) {
            title = "Candidate accepted";
            message = safeInterviewCandidateName(iv) + " accepted for " + safeInterviewPositionTitle(iv);
          } else {
            title = "Candidate rejected";
            message = safeInterviewCandidateName(iv) + " rejected for " + safeInterviewPositionTitle(iv);
          }

          return NotificationsDto.NotificationItem.builder()
              .id("iv-outcome-" + iv.getId())
              .type("CANDIDATE_OUTCOME")
              .title(title)
              .message(message)
              .actionUrl("/company-admin/company-interviews-schedule.html")
              .createdAt(iv.getUpdatedAt())
              .build();
        })
        .collect(Collectors.toList());
  }

  // ==================== SHARED HELPERS ====================

  private boolean positionMatchesAnySkill(Position position, List<String> lowerSkills) {
    if (position.getRequiredExpertise() == null || position.getRequiredExpertise().trim().isEmpty()) {
      return false;
    }
    String expertise = position.getRequiredExpertise().toLowerCase();
    return lowerSkills.stream().anyMatch(expertise::contains);
  }

  private String safeCompanyName(Application a) {
    Position p = a.getPosition();
    if (p == null || p.getCompany() == null || !notBlank(p.getCompany().getCompanyName())) {
      return "the company";
    }
    return p.getCompany().getCompanyName();
  }

  private String safePositionTitle(Application a) {
    Position p = a.getPosition();
    if (p == null || !notBlank(p.getPositionTitle())) {
      return "this role";
    }
    return p.getPositionTitle();
  }

  private String safeCandidateName(Application a) {
    Candidate c = a.getCandidate();
    if (c == null || !notBlank(c.getFullName())) {
      return "A candidate";
    }
    return c.getFullName();
  }

  private String safeInterviewCandidateName(Interview iv) {
    Candidate c = iv.getCandidate();
    if (c == null || !notBlank(c.getFullName())) {
      return "Candidate";
    }
    return c.getFullName();
  }

  private String safeInterviewPositionTitle(Interview iv) {
    Position p = iv.getPosition();
    if (p == null || !notBlank(p.getPositionTitle())) {
      return "this role";
    }
    return p.getPositionTitle();
  }

  private String safeText(String value, String fallback) {
    return notBlank(value) ? value : fallback;
  }
}

