package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "company_admins")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CompanyAdmin extends User {

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  private String phone;

  private String profilePhotoUrl;

  @Column(columnDefinition = "TEXT")
  private String bio;
}
