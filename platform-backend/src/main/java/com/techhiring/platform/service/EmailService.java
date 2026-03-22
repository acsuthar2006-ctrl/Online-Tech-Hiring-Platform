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
      String meetingLink, String companyName, String positionTitle) {
    String subject = String.format("Interview Invitation: %s at %s - TechHiring", positionTitle, companyName);
    String content = String.format("""
        <html>
        <body style="font-family: sans-serif; color: #222;">
            <h2>Hello %s,</h2>
            <p>You have been scheduled for an interview. Here are the details:</p>
            <table style="border-collapse: collapse; margin: 12px 0;">
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Company:</strong></td><td style="padding: 6px 0;">%s</td></tr>
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Position:</strong></td><td style="padding: 6px 0;">%s</td></tr>
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Date:</strong></td><td style="padding: 6px 0;">%s</td></tr>
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Time:</strong></td><td style="padding: 6px 0;">%s</td></tr>
            </table>
            <p>Please join using the link below at the scheduled time:</p>
            <a href="%s" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Join Interview</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring</p>
        </body>
        </html>
        """, candidateName, companyName, positionTitle, interviewDate, interviewTime, meetingLink);

    sendEmail(to, subject, content);
  }

  @Async
  public void sendInterviewReminder(String to, String candidateName, String meetingLink,
      String companyName, String positionTitle) {
    String subject = String.format("Reminder: Your Interview for %s at %s is Starting Soon", positionTitle, companyName);
    String content = String.format("""
        <html>
        <body style="font-family: sans-serif; color: #222;">
            <h2>Hello %s,</h2>
            <p>This is a reminder that your interview is starting soon.</p>
            <table style="border-collapse: collapse; margin: 12px 0;">
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Company:</strong></td><td style="padding: 6px 0;">%s</td></tr>
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Position:</strong></td><td style="padding: 6px 0;">%s</td></tr>
            </table>
            <p>Please be ready to join:</p>
            <a href="%s" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Join Waiting Room</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring</p>
        </body>
        </html>
        """, candidateName, companyName, positionTitle, meetingLink);

    sendEmail(to, subject, content);
  }

  @Async
  public void sendManualNudge(String to, String candidateName, String meetingLink,
      String companyName, String positionTitle) {
    String subject = String.format("Action Required: Join Your Interview for %s at %s Now", positionTitle, companyName);
    String content = String.format("""
        <html>
        <body style="font-family: sans-serif; color: #222;">
            <h2>Hello %s,</h2>
            <p>Your interviewer is waiting for you in the session. Please join immediately.</p>
            <table style="border-collapse: collapse; margin: 12px 0;">
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Company:</strong></td><td style="padding: 6px 0;">%s</td></tr>
                <tr><td style="padding: 6px 12px 6px 0;"><strong>Position:</strong></td><td style="padding: 6px 0;">%s</td></tr>
            </table>
            <a href="%s" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;">Join Interview Now</a>
            <br/><br/>
            <p>Best regards,<br/>TechHiring Team</p>
        </body>
        </html>
        """, candidateName, companyName, positionTitle, meetingLink);

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
