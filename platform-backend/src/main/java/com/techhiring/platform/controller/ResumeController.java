package com.techhiring.platform.controller;

import com.techhiring.platform.entity.Resume;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.ResumeRepository;
import com.techhiring.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    @PostMapping("/resume")
    @Transactional
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        if (!"application/pdf".equals(file.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PDF files are allowed"));
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentEmail = authentication.getName();
            User user = userRepository.findByEmail(currentEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<Resume> existingResume = resumeRepository.findByUserId(user.getId());
            Resume resume = existingResume.orElse(new Resume());

            resume.setUser(user);
            resume.setFileName(file.getOriginalFilename());
            resume.setContentType(file.getContentType());
            resume.setData(file.getBytes());

            resumeRepository.save(resume);

            return ResponseEntity.ok(Map.of(
                "message", "Resume uploaded successfully",
                "resumeUrl", "/api/users/" + user.getId() + "/resume"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Could not upload file: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}/resume")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> getResume(@PathVariable Long userId) {
        try {
            Resume resume = resumeRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Resume not found"));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resume.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(resume.getContentType()))
                    .body(resume.getData());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }
}
