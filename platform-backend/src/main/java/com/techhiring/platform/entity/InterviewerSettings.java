package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviewer_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewerSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Interviewer interviewer;

    @Builder.Default
    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled = true;

    @Builder.Default
    @Column(name = "interview_reminders_enabled")
    private Boolean interviewRemindersEnabled = true;

    @Builder.Default
    @Column(name = "two_factor_auth_enabled")
    private Boolean twoFactorAuthEnabled = false;

    @Builder.Default
    private String timezone = "UTC";

    @Builder.Default
    private String language = "en";

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
