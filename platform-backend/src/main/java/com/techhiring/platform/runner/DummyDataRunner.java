package com.techhiring.platform.runner;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.runner.seeder.CandidateSeeder;
import com.techhiring.platform.runner.seeder.CompanySeeder;
import com.techhiring.platform.runner.seeder.InterviewerSeeder;
import com.techhiring.platform.runner.seeder.PositionSeeder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2) // Runs after critical setups
@RequiredArgsConstructor
@Slf4j
public class DummyDataRunner implements CommandLineRunner {

    private final CompanySeeder companySeeder;
    private final InterviewerSeeder interviewerSeeder;
    private final CandidateSeeder candidateSeeder;
    private final PositionSeeder positionSeeder;

    @Value("${app.dummy-data.enabled:false}")
    private boolean enabled;

    @Override
    public void run(String... args) throws Exception {
        if (!enabled) {
            log.info("DummyDataRunner is DISABLED. Set app.dummy-data.enabled=true in your application properties/env to run.");
            return;
        }

        log.info("--- STARTING DUMMY DATA SEEDING ---");

        // Common password for easier testing
        String commonPassword = "password123";

        // 1. Seed Companies
        List<Company> companies = companySeeder.seed(10);

        // 2. Seed Interviewers
        interviewerSeeder.seed(50, commonPassword);

        // 3. Seed Candidates
        candidateSeeder.seed(100, commonPassword);

        // 4. Seed Positions (3 per company = 30 total)
        positionSeeder.seed(3, companies);

        log.info("--- DUMMY DATA SEEDING COMPLETE ---");
    }
}
