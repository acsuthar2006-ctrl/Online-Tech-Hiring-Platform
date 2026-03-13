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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

  private final InterviewRepository interviewRepository;

  private final CandidateSkillRepository candidateSkillRepository;
  private final CandidateExperienceRepository candidateExperienceRepository;
  private final CandidateEducationRepository candidateEducationRepository;

  private final InterviewerExpertiseRepository interviewerExpertiseRepository;

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
}

