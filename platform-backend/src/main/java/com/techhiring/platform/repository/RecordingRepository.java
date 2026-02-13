package com.techhiring.platform.repository;

import com.techhiring.platform.entity.Recording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, Long> {
    List<Recording> findByInterviewId(String interviewId);
    Optional<Recording> findByFilename(String filename);
}
