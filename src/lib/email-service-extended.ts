/**
 * FAZA 1: Rozszerzone funkcje email service
 * Dodaje nowe template functions do istniejącego email service
 */

import { Resend } from 'resend';
import { Database } from './supabase/server';
import {
  generateMinistryRegistrationTemplate,
  generateWelcomeEmailWithInstructions,
  generateHarvesterActivatedTemplate,
  generateTrialEndingTemplate
} from './email-templates-advanced';

type Developer = Database['public']['Tables']['developers']['Row'];

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder-resend-key');

// Rozszerzenie istniejącego email service
const FROM_EMAIL = process.env.FROM_EMAIL || 'OTORAPORT <noreply@otoraport.pl>';
const MINISTRY_EMAIL = process.env.MINISTRY_EMAIL || 'kontakt@dane.gov.pl';

/**
 * Podstawowa funkcja sendEmail (używa tej samej co w email-service.ts)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = FROM_EMAIL,
  replyTo
}: {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
}) {
  try {
    const emailData: any = {
      from,
      to,
      subject,
      html,
      text
    };

    if (replyTo) {
      emailData.reply_to = replyTo;
    }

    const result = await resend.emails.send(emailData);

    console.log('Email sent successfully:', result.data?.id);
    return {
      success: true,
      id: result.data?.id,
      messageId: result.data?.id
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * NOWY: Wyślij email rejestracyjny do Ministerstwa z instrukcjami
 */
export async function sendMinistryRegistrationEmail(developer: Developer) {
  const template = generateMinistryRegistrationTemplate(developer);

  return await sendEmail({
    to: MINISTRY_EMAIL,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: developer.email // Ministerstwo może odpowiedzieć bezpośrednio do dewelopera
  });
}

/**
 * NOWY: Wyślij welcome email z ostrzeżeniem o ręcznym raportowaniu
 */
export async function sendWelcomeEmailWithInstructions(developer: Developer) {
  const template = generateWelcomeEmailWithInstructions(developer);

  return await sendEmail({
    to: developer.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * NOWY: Powiadom o aktywacji harvestera
 */
export async function sendHarvesterActivatedNotification(developer: Developer) {
  const template = generateHarvesterActivatedTemplate(developer);

  return await sendEmail({
    to: developer.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * NOWY: Alert o końcu trialu
 */
export async function sendTrialEndingAlert(developer: Developer, daysLeft: number) {
  const template = generateTrialEndingTemplate(developer, daysLeft);

  return await sendEmail({
    to: developer.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * NOWY: Email z kodem potwierdzającym (2FA dla payment)
 */
export async function sendEmailConfirmation(
  email: string,
  confirmationCode: string,
  purpose: 'payment' | 'registration' | 'plan_change' = 'registration'
) {
  const purposeTexts = {
    payment: 'płatności',
    registration: 'rejestracji',
    plan_change: 'zmiany planu'
  };

  const subject = `OTORAPORT - Kod potwierdzenia ${purposeTexts[purpose]}: ${confirmationCode}`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kod potwierdzenia</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; font-size: 28px;">🔐 OTORAPORT</h1>
    <p style="color: #666; font-size: 16px;">Kod potwierdzenia</p>
  </div>

  <div style="background: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 30px; margin: 25px 0; text-align: center;">
    <h2 style="color: #1e40af; margin-top: 0;">Twój kod potwierdzenia:</h2>
    <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="font-family: monospace; font-size: 32px; font-weight: bold; color: #1e40af; margin: 0; letter-spacing: 4px;">
        ${confirmationCode}
      </p>
    </div>
    <p style="color: #3b82f6; margin-bottom: 0; font-size: 16px;">
      Użyj tego kodu do potwierdzenia ${purposeTexts[purpose]}
    </p>
  </div>

  <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px;">
      ⏰ <strong>Kod ważny przez 10 minut.</strong> Nie udostępniaj go nikomu.
    </p>
  </div>

  <div style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
    <p>Jeśli nie prosiłeś o ten kod, zignoruj ten email.</p>
  </div>

</body>
</html>
  `;

  const text = `
OTORAPORT - Kod potwierdzenia

Twój kod potwierdzenia ${purposeTexts[purpose]}:

${confirmationCode}

Kod ważny przez 10 minut. Nie udostępniaj go nikomu.

Jeśli nie prosiłeś o ten kod, zignoruj ten email.
  `.trim();

  return await sendEmail({
    to: email,
    subject,
    html,
    text
  });
}

/**
 * NOWY: Batch email sender dla masowych powiadomień
 */
export async function sendBatchEmails(
  developers: Developer[],
  templateFunction: (developer: Developer) => { subject: string; html: string; text: string },
  options: {
    delay?: number; // delay między emailami (ms)
    maxConcurrent?: number; // max równoczesnych wysyłek
  } = {}
) {
  const { delay = 100, maxConcurrent = 5 } = options;

  const results = [];
  const chunks = [];

  // Podziel na chunki
  for (let i = 0; i < developers.length; i += maxConcurrent) {
    chunks.push(developers.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (developer) => {
      try {
        const template = templateFunction(developer);

        const result = await sendEmail({
          to: developer.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        return {
          developerId: developer.id,
          email: developer.email,
          success: result.success,
          messageId: result.id,
          error: result.error
        };
      } catch (error) {
        return {
          developerId: developer.id,
          email: developer.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const chunkResults = await Promise.allSettled(chunkPromises);

    chunkResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          developerId: 'unknown',
          email: 'unknown',
          success: false,
          error: result.reason
        });
      }
    });

    // Delay między chunkami
    if (delay > 0 && chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    totalSent: results.filter(r => r.success).length,
    totalFailed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * NOWY: Email notification o payment failure z retry instrukcjami
 */
export async function sendPaymentFailedNotification(
  developer: Developer,
  amount: number,
  retryUrl: string
) {
  const subject = `🚨 Problem z płatnością - zaktualizuj dane karty`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problem z płatnością</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 25px; margin: 25px 0;">
    <h2 style="color: #dc2626; margin-top: 0;">🚨 Problem z płatnością</h2>
    <p style="color: #991b1b;">
      Nie udało się pobrać płatności w wysokości <strong>${(amount / 100).toFixed(2)} zł</strong> za Twoją subskrypcję OTORAPORT.
    </p>
  </div>

  <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; color: #856404;">
      ⚠️ <strong>Twoja subskrypcja może zostać zawieszona</strong> jeśli płatność nie zostanie zrealizowana w ciągu 7 dni.
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${retryUrl}" style="display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Zaktualizuj Kartę
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Jeśli masz pytania, skontaktuj się z nami: <a href="mailto:billing@otoraport.pl">billing@otoraport.pl</a>
  </p>

</body>
</html>
  `;

  const text = `
🚨 OTORAPORT - Problem z płatnością

Nie udało się pobrać płatności w wysokości ${(amount / 100).toFixed(2)} zł za Twoją subskrypcję.

⚠️ Twoja subskrypcja może zostać zawieszona jeśli płatność nie zostanie zrealizowana w ciągu 7 dni.

Zaktualizuj kartę: ${retryUrl}

Pytania: billing@otoraport.pl
  `.trim();

  return await sendEmail({
    to: developer.email,
    subject,
    html,
    text
  });
}

/**
 * Helper do logowania wysłanych emaili (opcjonalnie do bazy)
 */
export async function logEmailSent(
  developerId: string,
  emailType: string,
  recipientEmail: string,
  success: boolean,
  messageId?: string,
  error?: string
) {
  // W przyszłości można zapisywać do tabeli email_logs
  console.log('Email log:', {
    developerId,
    emailType,
    recipientEmail,
    success,
    messageId,
    error,
    timestamp: new Date().toISOString()
  });
}