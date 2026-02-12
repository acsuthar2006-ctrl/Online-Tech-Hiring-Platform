package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "interview_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class InterviewSchedule {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "interview_id", nullable = false)
  private Interview interview;

  @Column(nullable = false)
  private String candidateEmail;

  private java.time.LocalDate scheduledDate;

  private java.time.LocalTime scheduledTime;

  @Column(unique = true)
  private String roomId;

  private String meetingLink;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "email_sent_at")
  private java.time.LocalDateTime emailSentAt;

  @Column(name = "created_at", updatable = false)
  private java.time.LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = java.time.LocalDateTime.now();
  }
}
