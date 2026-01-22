package com.techhiring.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final com.techhiring.platform.service.CustomUserDetailsService userDetailsService;

  public SecurityConfig(com.techhiring.platform.service.CustomUserDetailsService userDetailsService) {
    this.userDetailsService = userDetailsService;
  }

  @Bean
  public org.springframework.security.authentication.AuthenticationProvider authenticationProvider() {
    org.springframework.security.authentication.dao.DaoAuthenticationProvider authProvider = new org.springframework.security.authentication.dao.DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for stateless REST APIs
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll() // Allow auth endpoints
            .requestMatchers("/api/interviews/**").permitAll() // Allow testing interviews
            .anyRequest().authenticated() // Protect everything else
        )
        .httpBasic(org.springframework.security.config.Customizer.withDefaults()); // Enable Basic Auth for testing

    return http.build();
  }

  @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins}")
  private String allowedOrigins;

  @Bean
  public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
    org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
    configuration.setAllowedOrigins(java.util.Arrays.asList(allowedOrigins.split(",")));
    configuration.setAllowedMethods(java.util.Arrays.asList("*"));
    configuration.setAllowedHeaders(java.util.Arrays.asList("*"));

    org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
