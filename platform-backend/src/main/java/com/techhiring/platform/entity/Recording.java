package com.techhiring.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "recordings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "interview_id", nullable = false)
    private String interviewId; // Using String ID (e.g. room name or UUID) to match usage

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String url;

    private Long sizeBytes;

    private Integer durationSeconds;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
