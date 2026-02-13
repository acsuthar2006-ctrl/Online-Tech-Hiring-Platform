package com.techhiring.platform.controller;

import com.techhiring.platform.entity.CandidateSettings;
import com.techhiring.platform.entity.InterviewerSettings;
import com.techhiring.platform.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    // --- Candidate Settings ---
    @GetMapping("/candidate/{id}")
    public ResponseEntity<CandidateSettings> getCandidateSettings(@PathVariable Long id) {
        return ResponseEntity.ok(settingsService.getCandidateSettings(id));
    }

    @PutMapping("/candidate/{id}")
    public ResponseEntity<CandidateSettings> updateCandidateSettings(@PathVariable Long id, @RequestBody CandidateSettings settings) {
        return ResponseEntity.ok(settingsService.updateCandidateSettings(id, settings));
    }

    // --- Interviewer Settings ---
    @GetMapping("/interviewer/{id}")
    public ResponseEntity<InterviewerSettings> getInterviewerSettings(@PathVariable Long id) {
        return ResponseEntity.ok(settingsService.getInterviewerSettings(id));
    }

    @PutMapping("/interviewer/{id}")
    public ResponseEntity<InterviewerSettings> updateInterviewerSettings(@PathVariable Long id, @RequestBody InterviewerSettings settings) {
        return ResponseEntity.ok(settingsService.updateInterviewerSettings(id, settings));
    }
}
