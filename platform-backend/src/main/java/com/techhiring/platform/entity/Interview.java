package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @ManyToOne
  @JoinColumn(name = "candidate_id", nullable = false)
  private Candidate candidate;

  @ManyToOne
  @JoinColumn(name = "interviewer_id", nullable = false)
  private Interviewer interviewer;

  @Column(nullable = false)
  private LocalDateTime scheduledTime;

  private String meetingLink; // e.g., "/room/abc-123"

  @Column(name = "actual_start_time")
  private LocalDateTime actualStartTime;

  @Column(name = "actual_end_time")
  private LocalDateTime actualEndTime;

  @Column(columnDefinition = "TEXT")
  private String description; // Agenda or notes

  @Column(columnDefinition = "TEXT")
  private String feedback; // Interviewer feedback

  private Double score; // e.g. 4.5

  private Integer durationMinutes; // e.g. 45 or 60

  @Column(length = 2048)
  private String recordingUrl; // URL to screen recording

  @Enumerated(EnumType.STRING)
  @Column(name = "interview_type")
  private InterviewType interviewType; // TECHNICAL, BEHAVIORAL etc.

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InterviewStatus status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  public enum InterviewStatus {
    SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  }
}
