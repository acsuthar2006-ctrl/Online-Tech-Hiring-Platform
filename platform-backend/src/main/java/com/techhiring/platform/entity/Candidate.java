package com.techhiring.platform.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "candidates")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Candidate extends User {


  private String phone;

  private String profilePhotoUrl;

  @Column(columnDefinition = "TEXT")
  private String bio;

  @Builder.Default
  private Integer totalInterviewsAttended = 0;

  @Builder.Default
  private Double averageRating = 0.0;

  // Simplified constructor for backward compatibility
  public Candidate(String fullName, String email, String password) {
    this.setEmail(email);
    this.setPassword(password);
    this.setFullName(fullName);
    this.setRole("CANDIDATE");
  }
}

