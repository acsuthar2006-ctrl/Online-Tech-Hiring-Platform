package com.techhiring.platform.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
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
@AllArgsConstructor
@SuperBuilder
public class Interviewer extends User {

  private String companyName;

  public Interviewer(String fullName, String email, String password, String companyName) {
    super(null, email, password, fullName, "INTERVIEWER");
    this.companyName = companyName;
  }
}
