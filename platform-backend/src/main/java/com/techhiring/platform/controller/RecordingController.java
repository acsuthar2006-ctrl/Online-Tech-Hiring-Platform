package com.techhiring.platform.controller;

import com.techhiring.platform.entity.Recording;
import com.techhiring.platform.service.RecordingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final RecordingService recordingService;

    @GetMapping("/{interviewId}")
    public ResponseEntity<List<Recording>> getRecordings(@PathVariable String interviewId) {
        return ResponseEntity.ok(recordingService.getRecordings(interviewId));
    }

    @PostMapping
    public ResponseEntity<Recording> saveRecording(@RequestBody Recording recording) {
        return ResponseEntity.ok(recordingService.saveRecording(recording));
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<Void> deleteRecording(@PathVariable String filename) {
        recordingService.deleteRecording(filename);
        return ResponseEntity.ok().build();
    }
}
