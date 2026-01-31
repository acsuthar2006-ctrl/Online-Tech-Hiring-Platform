package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_postings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPosting {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(columnDefinition = "TEXT")
  private String requirements;

  private String location;

  private String salaryRange;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private JobStatus status;

  @ManyToMany
  @JoinTable(
      name = "job_posting_interviewers",
      joinColumns = @JoinColumn(name = "job_posting_id"),
      inverseJoinColumns = @JoinColumn(name = "interviewer_id")
  )
  private java.util.List<Interviewer> assignedInterviewers;

  @Builder.Default
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  public enum JobStatus {
    OPEN,
    CLOSED,
    DRAFT
  }
}
