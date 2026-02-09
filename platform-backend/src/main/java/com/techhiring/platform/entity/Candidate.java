package com.techhiring.platform.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import lombok.AllArgsConstructor;
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

  @Column(columnDefinition = "TEXT")
  private String skills; // JSON or CSV string of skills

  private String resumeUrl;

  private String phone;

  private String profilePhotoUrl;

  @Column(columnDefinition = "TEXT")
  private String bio;

  private Integer totalInterviewsAttended = 0;

  private Double averageRating = 0.0;

  // Simplified constructor for backward compatibility
  public Candidate(String fullName, String email, String password, String resumeUrl, String skills) {
    this.setEmail(email);
    this.setPassword(password);
    this.setFullName(fullName);
    this.setRole("CANDIDATE");
    this.resumeUrl = resumeUrl;
    this.skills = skills;
  }
}

