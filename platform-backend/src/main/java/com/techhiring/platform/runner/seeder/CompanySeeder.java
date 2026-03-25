package com.techhiring.platform.runner.seeder;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CompanySeeder {

    private final CompanyRepository companyRepository;
    private final Faker faker = new Faker();

    public List<Company> seed(int count) {
        log.info("Seeding {} companies...", count);
        List<Company> companies = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            Company company = Company.builder()
                    .companyName(faker.company().name())
                    .industry(faker.company().industry())
                    .email(faker.internet().safeEmailAddress())
                    .phone(faker.phoneNumber().cellPhone())
                    .location(faker.address().city() + ", " + faker.address().country())
                    .website(faker.internet().url())
                    .description(faker.company().catchPhrase())
                    .logoUrl("https://logo.clearbit.com/" + faker.internet().domainName())
                    .build();
            companies.add(companyRepository.save(company));
        }
        log.info("Successfully seeded {} companies.", companies.size());
        return companies;
    }
}
