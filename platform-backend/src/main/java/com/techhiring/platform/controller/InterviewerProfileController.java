package com.techhiring.platform.controller;

import com.techhiring.platform.entity.InterviewerExpertise;
import com.techhiring.platform.service.InterviewerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviewers")
@RequiredArgsConstructor
public class InterviewerProfileController {

    private final InterviewerProfileService profileService;

    // --- Expertise ---
    @GetMapping("/{id}/expertise")
    public ResponseEntity<List<InterviewerExpertise>> getExpertise(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getExpertise(id));
    }

    @PostMapping("/{id}/expertise")
    public ResponseEntity<InterviewerExpertise> addExpertise(@PathVariable Long id, @RequestBody InterviewerExpertise expertise) {
        return ResponseEntity.ok(profileService.addExpertise(id, expertise));
    }

    @DeleteMapping("/expertise/{expertiseId}")
    public ResponseEntity<Void> deleteExpertise(@PathVariable Long expertiseId) {
        profileService.deleteExpertise(expertiseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getFullProfile(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
            "expertise", profileService.getExpertise(id)
        ));
    }
}
