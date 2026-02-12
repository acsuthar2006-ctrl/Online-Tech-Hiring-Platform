package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Company {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String companyName;

  private String industry;

  @Column(unique = true)
  private String email;

  private String phone;

  private String location;

  private String website;

  @Column(columnDefinition = "TEXT")
  private String description;

  private String logoUrl;

  @Column(name = "created_at", updatable = false)
  private java.time.LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = java.time.LocalDateTime.now();
  }
}
