package com.techhiring.platform.scheduler;

import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.repository.InterviewRepository;
import com.techhiring.platform.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

  private final InterviewRepository interviewRepository;
  private final EmailService emailService;

  // Run every 1 minute for easier testing (production could be 5 mins)
  @Scheduled(cron = "0 */1 * * * *")
  public void sendInterviewReminders() {
    log.info("Checking for upcoming interviews...");

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime startWindow = now.plusMinutes(20);
    LocalDateTime endWindow = now.plusMinutes(25);

    // Find interviews scheduled between now+20m and now+25m
    List<Interview> upcomingInterviews = interviewRepository.findScheduledInterviewsBetween(startWindow, endWindow);

    for (Interview interview : upcomingInterviews) {
      log.info("Sending reminder for interview: {}", interview.getId());
      try {
        emailService.sendInterviewReminder(
            interview.getCandidate().getEmail(),
            interview.getCandidate().getFullName(),
            "http://localhost:5173/?room=" + interview.getMeetingLink() + "&role=candidate");
      } catch (Exception e) {
        log.error("Failed to send reminder for interview {}: {}", interview.getId(), e.getMessage());
      }
    }
  }
}
