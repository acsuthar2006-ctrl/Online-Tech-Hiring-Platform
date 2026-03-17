package com.techhiring.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "interviewer_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InterviewerApplication {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "interviewer_id", nullable = false)
  private Interviewer interviewer;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  // Position/job this interviewer applied to conduct interviews for.
  // Nullable for legacy rows created before per-position applications existed.
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "position_id")
  private Position position;

  @Column(nullable = false)
  @Builder.Default
  private String status = "APPLIED"; // APPLIED, APPROVED, REJECTED

  @Column(columnDefinition = "TEXT")
  private String expertiseRequired;

  @Column(name = "application_date", updatable = false)
  private java.time.LocalDateTime applicationDate;

  @Column(name = "created_at", updatable = false)
  private java.time.LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    if (applicationDate == null) {
      applicationDate = java.time.LocalDateTime.now();
    }
    createdAt = java.time.LocalDateTime.now();
  }
}
