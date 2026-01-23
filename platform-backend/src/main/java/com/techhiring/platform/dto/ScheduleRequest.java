package com.techhiring.platform.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScheduleRequest {
  private String interviewerEmail;
  private String candidateEmail;
  private String candidateName;
  private LocalDateTime scheduledTime;
  private String title;
  private String meetingLink;
}
