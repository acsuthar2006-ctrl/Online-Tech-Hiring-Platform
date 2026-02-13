package com.techhiring.platform.controller;

import com.techhiring.platform.entity.CandidateEducation;
import com.techhiring.platform.entity.CandidateExperience;
import com.techhiring.platform.entity.CandidateSkill;
import com.techhiring.platform.service.CandidateProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateProfileController {

    private final CandidateProfileService profileService;

    // --- Skills ---
    @GetMapping("/{id}/skills")
    public ResponseEntity<List<CandidateSkill>> getSkills(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getSkills(id));
    }

    @PostMapping("/{id}/skills")
    public ResponseEntity<CandidateSkill> addSkill(@PathVariable Long id, @RequestBody CandidateSkill skill) {
        return ResponseEntity.ok(profileService.addSkill(id, skill));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long skillId) {
        profileService.deleteSkill(skillId);
        return ResponseEntity.ok().build();
    }

    // --- Experience ---
    @GetMapping("/{id}/experience")
    public ResponseEntity<List<CandidateExperience>> getExperience(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getExperience(id));
    }

    @PostMapping("/{id}/experience")
    public ResponseEntity<CandidateExperience> addExperience(@PathVariable Long id, @RequestBody CandidateExperience experience) {
        return ResponseEntity.ok(profileService.addExperience(id, experience));
    }

    @DeleteMapping("/experience/{expId}")
    public ResponseEntity<Void> deleteExperience(@PathVariable Long expId) {
        profileService.deleteExperience(expId);
        return ResponseEntity.ok().build();
    }

    // --- Education ---
    @GetMapping("/{id}/education")
    public ResponseEntity<List<CandidateEducation>> getEducation(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getEducation(id));
    }

    @PostMapping("/{id}/education")
    public ResponseEntity<CandidateEducation> addEducation(@PathVariable Long id, @RequestBody CandidateEducation education) {
        return ResponseEntity.ok(profileService.addEducation(id, education));
    }

    @DeleteMapping("/education/{eduId}")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long eduId) {
        profileService.deleteEducation(eduId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getFullProfile(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
            "skills", profileService.getSkills(id),
            "experience", profileService.getExperience(id),
            "education", profileService.getEducation(id)
        ));
    }
}
