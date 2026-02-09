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
@NoArgsConstructor(force = true)
// @AllArgsConstructor removed
@SuperBuilder
public class Interviewer extends User {

  // Constructor removed in favor of SuperBuilder
}
