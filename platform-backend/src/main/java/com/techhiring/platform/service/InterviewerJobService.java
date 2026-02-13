package com.techhiring.platform.service;

import com.techhiring.platform.entity.InterviewerJob;
import com.techhiring.platform.repository.InterviewerJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewerJobService {

    private final InterviewerJobRepository jobRepository;

    public List<InterviewerJob> getOpenJobs() {
        return jobRepository.findByStatus("OPEN");
    }

    public InterviewerJob getJob(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    @Transactional
    public InterviewerJob createJob(InterviewerJob job) {
        return jobRepository.save(job);
    }
}
