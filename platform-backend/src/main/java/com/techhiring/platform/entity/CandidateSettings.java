package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Candidate candidate;

    @Builder.Default
    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled = true;

    @Builder.Default
    @Column(name = "interview_reminders_enabled")
    private Boolean interviewRemindersEnabled = true;

    @Builder.Default
    @Column(name = "theme_preference")
    private String themePreference = "light";

    @Builder.Default
    private String language = "en";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
