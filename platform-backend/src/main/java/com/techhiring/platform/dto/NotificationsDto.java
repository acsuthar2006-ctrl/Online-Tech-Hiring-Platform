package com.techhiring.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class NotificationsDto {

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class NotificationItem {
    private String id; // stable id for client rendering (e.g. "profile", "interview-123")
    private String type; // PROFILE_INCOMPLETE, INTERVIEW_REMINDER
    private String title;
    private String message;
    private String actionUrl; // frontend route
    private LocalDateTime createdAt;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class NotificationResponse {
    private int count;
    private List<NotificationItem> items;
  }
}

