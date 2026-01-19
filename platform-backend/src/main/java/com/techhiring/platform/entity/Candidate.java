package com.techhiring.platform.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
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

  private String summary; // Example field

  // Constructor for quick creation if needed, though Builder is preferred
  public Candidate(String email, String password) {
    super(null, email, password, "CANDIDATE");
  }
}
