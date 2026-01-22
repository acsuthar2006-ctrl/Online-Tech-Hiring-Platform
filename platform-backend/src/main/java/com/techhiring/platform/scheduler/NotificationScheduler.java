package com.techhiring.platform.scheduler;

import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.repository.InterviewRepository;
import com.techhiring.platform.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

  private final InterviewRepository interviewRepository;
  private final EmailService emailService;

  // Run every minute
  @Scheduled(cron = "0 * * * * *")
  public void sendUpcomingReminders() {
    LocalDateTime now = LocalDateTime.now();
    // Check for interviews starting in 15 minutes (+/- 1 min buffer)
    LocalDateTime target = now.plusMinutes(15);

    // This is a simplified check. In production, we'd use a dedicated
    // 'reminderSent' flag in DB
    // to avoid duplicate emails if the cron overlaps or application restarts.
    // For this demo/MVP, we assume the query is tight enough.

    // Ideally: findByScheduledTimeBetweenAndReminderSentFalse(...)
    // Here we just iterate to demonstrate logic.
    List<Interview> upcoming = interviewRepository.findAll().stream()
        .filter(i -> i.getStatus() == Interview.InterviewStatus.SCHEDULED)
        .filter(i -> isAround(i.getScheduledTime(), target))
        .toList();

    for (Interview interview : upcoming) {
      emailService.sendInterviewReminder(
          interview.getCandidate().getEmail(),
          interview.getCandidate().getFullName(),
          "http://localhost:8080/?room=" + interview.getMeetingLink());
      System.out.println("Sent reminder to " + interview.getCandidate().getEmail());
    }
  }

  private boolean isAround(LocalDateTime scheduled, LocalDateTime target) {
    return scheduled.isAfter(target.minusMinutes(1)) && scheduled.isBefore(target.plusMinutes(1));
  }
}
