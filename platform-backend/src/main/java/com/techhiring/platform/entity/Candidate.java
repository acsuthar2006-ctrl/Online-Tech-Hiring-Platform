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

  // Constructor for quick creation if needed, though Builder is preferred
  public Candidate(String fullName, String email, String password, String resumeUrl, String skills) {
    super(null, email, password, fullName, "CANDIDATE");
    this.resumeUrl = resumeUrl;
    this.skills = skills;
  }
}
