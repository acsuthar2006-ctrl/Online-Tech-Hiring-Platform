package com.techhiring.platform.service;

import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.CandidateRepository;
import com.techhiring.platform.repository.InterviewRepository;
import com.techhiring.platform.repository.InterviewerRepository;
import com.techhiring.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService {

  private final InterviewRepository interviewRepository;
  private final CandidateRepository candidateRepository;
  private final InterviewerRepository interviewerRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final EmailService emailService;

  @Transactional
  public Interview scheduleInterview(String interviewerEmail, String candidateEmail, String candidateName,
      LocalDateTime scheduledTime, String title, String customMeetingLink, String description,
      com.techhiring.platform.entity.InterviewType type) {
    Interviewer interviewer;
    
    // Try to find by email first, if that fails, try to parse as ID
    if (interviewerEmail != null && interviewerEmail.contains("@")) {
      interviewer = (Interviewer) userRepository.findByEmail(interviewerEmail)
          .orElseThrow(() -> new RuntimeException("Interviewer not found"));
    } else {
      // Assume it's an ID
      try {
        Long interviewerId = Long.parseLong(interviewerEmail);
        interviewer = interviewerRepository.findById(interviewerId)
            .orElseThrow(() -> new RuntimeException("Interviewer not found"));
      } catch (NumberFormatException e) {
        throw new RuntimeException("Interviewer not found");
      }
    }

    // Get or Create Candidate
    Candidate candidate = (Candidate) userRepository.findByEmail(candidateEmail).orElse(null);
    if (candidate == null) {
      String tempPassword = UUID.randomUUID().toString().substring(0, 8);
      candidate = new Candidate(candidateName, candidateEmail, passwordEncoder.encode(tempPassword), null, null);
      candidateRepository.save(candidate);
      // TODO: Email the candidate their temp credentials? For now, we just schedule.
    }

    // Check if there is already an existing session (meeting link) for this
    // interviewer around this time
    // Simple logic: reuse link if interview is within 2 hours of this new one
    String meetingLink = null;
    List<Interview> existing = interviewRepository.findByInterviewerId(interviewer.getId());
    java.time.LocalDate schedDate = scheduledTime.toLocalDate();
    java.time.LocalTime schedTime = scheduledTime.toLocalTime();
    
    for (Interview i : existing) {
      if (i.getScheduledDate() != null && i.getScheduledDate().isEqual(schedDate)) {
        // Check if times are within 4 hours
        if (i.getScheduledTime() != null) {
          long hoursDiff = Math.abs(java.time.Duration.between(i.getScheduledTime(), schedTime).toHours());
          if (hoursDiff < 4) {
            meetingLink = i.getMeetingLink();
            break;
          }
        }
      }
    }

    if (customMeetingLink != null && !customMeetingLink.isEmpty()) {
      meetingLink = customMeetingLink;
    } else if (meetingLink == null) {
      meetingLink = UUID.randomUUID().toString(); // Simple ID for room
    }

    Interview interview = Interview.builder()
        .title(title)
        .interviewer(interviewer)
        .candidate(candidate)
        .scheduledDate(schedDate)
        .scheduledTime(schedTime)
        .meetingLink(meetingLink)
        .status(Interview.InterviewStatus.SCHEDULED)
        .description(description)
        .interviewType(type)
        .build();

    Interview saved = interviewRepository.save(interview);

    // Send Email
    // Send Email
    try {
      emailService.sendInterviewInvitation(
          candidateEmail,
          candidateName,
          scheduledTime.format(DateTimeFormatter.ISO_LOCAL_DATE),
          scheduledTime.format(DateTimeFormatter.ISO_LOCAL_TIME),
          "http://localhost:5173/?room=" + meetingLink + "&role=candidate" // Frontend URL
      );
    } catch (Exception e) {
      System.err.println("Failed to send email: " + e.getMessage());
      // Continue without failing the request
    }

    return saved;
  }

  public Map<String, Object> getSessionQueue(String meetingLink) {
    List<Interview> allInterviews = interviewRepository.findByMeetingLink(meetingLink);

    // sort by time
    allInterviews.sort(Comparator.comparing(Interview::getScheduledTime));

    Interview current = allInterviews.stream()
        .filter(i -> i.getStatus() == Interview.InterviewStatus.IN_PROGRESS)
        .findFirst()
        .orElse(null);

    Map<String, Object> response = new HashMap<>();
    response.put("current", current);
    response.put("timeline", allInterviews);
    // Connect status would be real-time via Socket, here we return static data

    return response;
  }

  @Transactional
  public Interview completeAndGetNext(Long interviewId, com.techhiring.platform.dto.CompletionRequest request) {
    Interview current = interviewRepository.findById(interviewId)
        .orElseThrow(() -> new RuntimeException("Interview not found"));

    current.setStatus(Interview.InterviewStatus.COMPLETED);
    current.setActualEndTime(LocalDateTime.now());
    if (request != null) {
      current.setFeedback(request.getFeedback());
      current.setScore(request.getScore());
      current.setRecordingUrl(request.getRecordingUrl());
    }
    interviewRepository.save(current);

    // Find next in the same session (meetingLink)
    List<Interview> sessionInterviews = interviewRepository.findByMeetingLinkAndStatus(
        current.getMeetingLink(), Interview.InterviewStatus.SCHEDULED);

    sessionInterviews.sort(Comparator.comparing(Interview::getScheduledTime));

    if (!sessionInterviews.isEmpty()) {
      Interview next = sessionInterviews.get(0);
      // We do NOT auto-start it (set to IN_PROGRESS) yet?
      // Or maybe we do to indicate they are "called"?
      // User requirement: "other must join the the same session automatically"
      // CHANGE: User requested "others should not be cancelled" (stay waiting).
      // So we DISABLE auto-start. The interviewer must manually click "Call In".
      // next.setStatus(Interview.InterviewStatus.IN_PROGRESS);
      // next.setActualStartTime(LocalDateTime.now());
      return interviewRepository.save(next);
    }
    return null;
  }

  @Transactional
  public void startInterview(Long id) {
    Interview i = getInterview(id);
    i.setStatus(Interview.InterviewStatus.IN_PROGRESS);
    i.setActualStartTime(LocalDateTime.now());
    interviewRepository.save(i);
  }

  public List<Interview> getUpcomingInterviews(String candidateEmail) {
    return interviewRepository.findByCandidate_Email(candidateEmail).stream()
        .filter(i -> i.getStatus() == Interview.InterviewStatus.SCHEDULED)
        .sorted(Comparator.comparing(Interview::getScheduledTime))
        .collect(Collectors.toList());
  }

  public List<Interview> getUpcomingInterviewsForInterviewer(String interviewerEmail) {
    return interviewRepository.findByInterviewer_Email(interviewerEmail).stream()
        .filter(i -> i.getStatus() == Interview.InterviewStatus.SCHEDULED)
        .sorted(Comparator.comparing(Interview::getScheduledTime))
        .collect(Collectors.toList());
  }

  public Interview.InterviewStatus getCandidateStatus(Long interviewId) {
    return interviewRepository.findById(interviewId)
        .map(Interview::getStatus)
        .orElse(Interview.InterviewStatus.CANCELLED); // or throw
  }

  public Interview getInterview(Long id) {
    return interviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
  }
}
