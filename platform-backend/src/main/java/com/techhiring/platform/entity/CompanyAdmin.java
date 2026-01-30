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

  @ManyToOne
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  // Helper constructor
  public CompanyAdmin(String fullName, String email, String password, Company company) {
    super(null, email, password, fullName, "COMPANY_ADMIN");
    this.company = company;
  }
}
