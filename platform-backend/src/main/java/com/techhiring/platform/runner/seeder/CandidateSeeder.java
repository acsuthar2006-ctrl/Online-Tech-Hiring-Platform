package com.techhiring.platform.runner.seeder;

import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CandidateSeeder {

    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public List<Candidate> seed(int count, String commonPassword) {
        log.info("Seeding {} candidates...", count);
        List<Candidate> candidates = new ArrayList<>();
        String encodedPassword = passwordEncoder.encode(commonPassword);

        for (int i = 0; i < count; i++) {
            String firstName = faker.name().firstName();
            String lastName = faker.name().lastName();
            String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + faker.number().digits(4) + "@candidates.example.com";

            Candidate candidate = Candidate.builder()
                    .fullName(firstName + " " + lastName)
                    .email(email)
                    .password(encodedPassword)
                    .role("CANDIDATE")
                    .phone(faker.phoneNumber().cellPhone())
                    .location(faker.address().city() + ", " + faker.address().country())
                    .bio("Experienced " + faker.job().title() + " skilled in " + faker.programmingLanguage().name() + ".")
                    .build();

            candidates.add(candidateRepository.save(candidate));
        }
        log.info("Successfully seeded {} candidates.", candidates.size());
        return candidates;
    }
}
