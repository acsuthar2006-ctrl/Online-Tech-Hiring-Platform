package com.techhiring.platform.service;

import com.techhiring.platform.entity.Recording;
import com.techhiring.platform.repository.RecordingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordingService {

    private final RecordingRepository recordingRepository;

    public List<Recording> getRecordings(String interviewId) {
        return recordingRepository.findByInterviewId(interviewId);
    }

    @Transactional
    public Recording saveRecording(Recording recording) {
        return recordingRepository.save(recording);
    }

    @Transactional
    public void deleteRecording(String filename) {
        recordingRepository.findByFilename(filename)
                .ifPresent(recordingRepository::delete);
    }
}
