package com.techhiring.platform.runner.seeder;

import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.repository.InterviewerRepository;
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
public class InterviewerSeeder {

    private final InterviewerRepository interviewerRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public List<Interviewer> seed(int count, String commonPassword) {
        log.info("Seeding {} interviewers...", count);
        List<Interviewer> interviewers = new ArrayList<>();
        String encodedPassword = passwordEncoder.encode(commonPassword);

        for (int i = 0; i < count; i++) {
            String firstName = faker.name().firstName();
            String lastName = faker.name().lastName();
            String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@interviewers.example.com";

            Interviewer interviewer = Interviewer.builder()
                    .fullName(firstName + " " + lastName)
                    .email(email)
                    .password(encodedPassword)
                    .role("INTERVIEWER")
                    .phone(faker.phoneNumber().cellPhone())
                    .bio(faker.lorem().paragraph())
                    .hourlyRate((double) faker.number().numberBetween(50, 150))
                    .availabilityStatus("AVAILABLE")
                    .build();

            interviewers.add(interviewerRepository.save(interviewer));
        }
        log.info("Successfully seeded {} interviewers.", interviewers.size());
        return interviewers;
    }
}
