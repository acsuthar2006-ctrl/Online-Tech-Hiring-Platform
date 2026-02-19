package com.techhiring.platform.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  @Async
  public void sendInterviewInvitation(String to, String candidateName, String interviewDate, String interviewTime,
      String meetingLink) {
    String subject = "Interview Invitation - TechHiring Platform";
    String content = String.format("""
        <html>
        <body>
            <h2>Hello %s,</h2>
            <p>You have been scheduled for a technical interview.</p>
            <p><strong>Date:</strong> %s</p>
            <p><strong>Time:</strong> %s</p>
            <p>Please join using the following link at the scheduled time:</p>
            <a href="%s">Join Interview</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring Team</p>
        </body>
        </html>
        """, candidateName, interviewDate, interviewTime, meetingLink);

    sendEmail(to, subject, content);
  }

  @Async
  public void sendInterviewReminder(String to, String candidateName, String meetingLink) {
    String subject = "Interview Reminder - Starting Soon";
    String content = String.format("""
        <html>
        <body>
            <h2>Hello %s,</h2>
            <p>This is a reminder that your interview is starting soon.</p>
            <p>Please be ready to join.</p>
            <a href="%s">Join Waiting Room</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring Team</p>
        </body>
        </html>
        """, candidateName, meetingLink);

    sendEmail(to, subject, content);
  }

  @Async
  public void sendManualNudge(String to, String candidateName, String meetingLink) {
    String subject = "Interview Waiting - Join Now";
    String content = String.format("""
        <html>
        <body>
            <h2>Hello %s,</h2>
            <p>Your interviewer is waiting for you in the session.</p>
            <p>Please join immediately using the link below:</p>
            <a href="%s">Join Interview Now</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring Team</p>
        </body>
        </html>
        """, candidateName, meetingLink);

    sendEmail(to, subject, content);
  }

  private void sendEmail(String to, String subject, String content) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);

      helper.setFrom(fromEmail != null ? fromEmail : "noreply@techhiring.com", "TechHiring Platform");
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(content, true);

      mailSender.send(message);
    } catch (MessagingException | java.io.UnsupportedEncodingException e) {
      // Log error but don't crash flow
      System.err.println("Failed to send email to " + to + ": " + e.getMessage());
    }
  }
}
