package com.techhiring.platform.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "system_admins")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@SuperBuilder
public class SystemAdmin extends User {

  // Helper constructor
  public SystemAdmin(String fullName, String email, String password) {
    super(null, email, password, fullName, "SYSTEM_ADMIN");
  }
}
