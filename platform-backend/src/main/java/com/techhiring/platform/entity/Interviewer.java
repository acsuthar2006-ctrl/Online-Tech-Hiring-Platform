package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "interviewers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@SuperBuilder
public class Interviewer extends User {

  private String phone;

  private String profilePhotoUrl;

  @Column(columnDefinition = "TEXT")
  private String bio;

  private Double hourlyRate = 0.0;

  private Integer totalInterviewsConducted = 0;

  private Double averageRating = 0.0;

  private Double totalEarnings = 0.0;

  private String availabilityStatus = "AVAILABLE"; // AVAILABLE, BUSY, OFFLINE
}
