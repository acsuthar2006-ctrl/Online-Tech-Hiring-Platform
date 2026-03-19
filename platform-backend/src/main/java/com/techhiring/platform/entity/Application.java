package com.techhiring.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "candidate_id", nullable = false)
  private Candidate candidate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "position_id", nullable = false)
  private Position position;

  // Company admin assignment: one candidate application is assigned to one interviewer (optional).
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_interviewer_id")
  private Interviewer assignedInterviewer;

  @Column(nullable = false)
  @Builder.Default
  private String status = "APPLIED"; // APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, REJECTED, OFFERED

  @Column(name = "application_date", updatable = false)
  private java.time.LocalDateTime applicationDate;

  @Column(name = "created_at", updatable = false)
  private java.time.LocalDateTime createdAt;

  @Column(name = "updated_at")
  private java.time.LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    if (applicationDate == null) {
      applicationDate = java.time.LocalDateTime.now();
    }
    createdAt = java.time.LocalDateTime.now();
    updatedAt = java.time.LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = java.time.LocalDateTime.now();
  }
}
