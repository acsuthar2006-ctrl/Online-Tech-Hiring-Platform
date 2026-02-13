package com.techhiring.platform.controller;

import com.techhiring.platform.entity.InterviewerJob;
import com.techhiring.platform.service.InterviewerJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviewer-jobs")
@RequiredArgsConstructor
public class InterviewerJobController {

    private final InterviewerJobService jobService;

    @GetMapping
    public ResponseEntity<List<InterviewerJob>> getOpenJobs() {
        return ResponseEntity.ok(jobService.getOpenJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewerJob> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    @PostMapping
    public ResponseEntity<InterviewerJob> createJob(@RequestBody InterviewerJob job) {
        return ResponseEntity.ok(jobService.createJob(job));
    }
}
