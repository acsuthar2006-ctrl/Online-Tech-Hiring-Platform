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

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InterviewStatus status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  public enum InterviewStatus {
    SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  }
}
