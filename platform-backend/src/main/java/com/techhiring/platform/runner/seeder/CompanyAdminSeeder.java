package com.techhiring.platform.runner.seeder;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.entity.CompanyAdmin;
import com.techhiring.platform.repository.CompanyAdminRepository;
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
public class CompanyAdminSeeder {

    private final CompanyAdminRepository companyAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public List<CompanyAdmin> seed(List<Company> companies, String commonPassword) {
        log.info("Seeding {} company admins...", companies.size());
        List<CompanyAdmin> authAdmins = new ArrayList<>();
        String encodedPassword = passwordEncoder.encode(commonPassword);

        for (Company company : companies) {
            String firstName = faker.name().firstName();
            String lastName = faker.name().lastName();
            
            // Clean company name to create a valid email domain
            String domain = company.getCompanyName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            if (domain.isEmpty()) { domain = "company"; }
            
            String email = "admin@" + domain + ".com";

            CompanyAdmin admin = CompanyAdmin.builder()
                    .fullName(firstName + " " + lastName)
                    .email(email)
                    .password(encodedPassword)
                    .role("COMPANY_ADMIN")
                    .company(company)
                    .phone(faker.phoneNumber().cellPhone())
                    .bio("HR/Admin for " + company.getCompanyName())
                    .build();

            authAdmins.add(companyAdminRepository.save(admin));
        }
        log.info("Successfully seeded {} company admins.", authAdmins.size());
        return authAdmins;
    }
}
