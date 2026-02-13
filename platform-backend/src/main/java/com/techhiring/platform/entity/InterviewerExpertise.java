package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviewer_expertise")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewerExpertise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Interviewer interviewer;

    @Column(name = "expertise_area", nullable = false)
    private String expertiseArea;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
