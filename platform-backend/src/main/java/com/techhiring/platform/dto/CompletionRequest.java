package com.techhiring.platform.dto;

import lombok.Data;

@Data
public class CompletionRequest {
  private String feedback;
  private Double score;
  private String recordingUrl;
}
