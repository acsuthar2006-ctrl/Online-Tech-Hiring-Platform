package com.techhiring.platform.controller;

import com.techhiring.platform.dto.NotificationsDto;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.UserRepository;
import com.techhiring.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;
  private final UserRepository userRepository;

  @GetMapping
  public ResponseEntity<NotificationsDto.NotificationResponse> getNotifications() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String currentEmail = authentication.getName();

    User user = userRepository.findByEmail(currentEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));

    return ResponseEntity.ok(notificationService.getNotifications(user));
  }
}

