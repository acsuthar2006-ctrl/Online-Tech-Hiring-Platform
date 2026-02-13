package com.techhiring.platform.repository;

import com.techhiring.platform.entity.CandidateSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CandidateSettingsRepository extends JpaRepository<CandidateSettings, Long> {
    Optional<CandidateSettings> findByCandidateId(Long candidateId);
}
