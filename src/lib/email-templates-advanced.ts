/**
 * FAZA 1: Rozszerzony system email templates
 * Nowe templates zgodnie z wymaganiami biznesowymi
 */

import { Database } from './supabase/server';

type Developer = Database['public']['Tables']['developers']['Row'];

// Environment variables
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://otoraport.pl';
const MINISTRY_EMAIL = process.env.MINISTRY_EMAIL || 'kontakt@dane.gov.pl';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

/**
 * NOWY: Template rejestracji do Ministerstwa z instrukcjami
 * Zawiera ostrzeżenie o ręcznym raportowaniu do czasu potwierdzenia
 */
export function generateMinistryRegistrationTemplate(developer: Developer): EmailTemplate {
  const xmlUrl = `${NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml`;
  const md5Url = `${NEXTAUTH_URL}/api/public/${developer.client_id}/data.md5`;

  const subject = `Rejestracja dostawcy danych - ${developer.company_name || developer.name}`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rejestracja w systemie dane.gov.pl</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Rejestracja dostawcy danych</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Zgodnie z ustawą z dnia 21 maja 2025 r. o jawności cen mieszkań</p>
  </div>

  <p><strong>Dzień dobry,</strong></p>

  <p>Zwracam się z wnioskiem o założenie profilu dostawcy danych dla:</p>

  <div style="background: #f9f9f9; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
    <h3 style="color: #1e293b; margin-top: 0;">DANE DEWELOPERA:</h3>
    <table style="width: 100%; border-spacing: 0;">
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Nazwa:</td><td style="padding: 5px 0;">${developer.company_name || developer.name}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">NIP:</td><td style="padding: 5px 0;">${developer.nip || 'do uzupełnienia'}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">REGON:</td><td style="padding: 5px 0;">${developer.regon || 'do uzupełnienia'}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Forma prawna:</td><td style="padding: 5px 0;">${developer.legal_form || 'spółka z o.o.'}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Adres siedziby:</td><td style="padding: 5px 0;">${developer.headquarters_address || 'do uzupełnienia'}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Email:</td><td style="padding: 5px 0;">${developer.email}</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Telefon:</td><td style="padding: 5px 0;">${developer.phone || 'do uzupełnienia'}</td></tr>
    </table>
  </div>

  <div style="background: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0;">
    <h3 style="color: #01579b; margin-top: 0;">URL-E DO HARVESTERA:</h3>
    <table style="width: 100%; border-spacing: 0;">
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Plik XML:</td><td style="padding: 5px 0;"><a href="${xmlUrl}" style="color: #0288d1; text-decoration: none;">${xmlUrl}</a></td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Suma kontrolna MD5:</td><td style="padding: 5px 0;"><a href="${md5Url}" style="color: #0288d1; text-decoration: none;">${md5Url}</a></td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Częstotliwość:</td><td style="padding: 5px 0;">Codziennie o 8:00 UTC</td></tr>
      <tr><td style="padding: 5px 10px 5px 0; font-weight: bold;">Format:</td><td style="padding: 5px 0;">XML zgodny ze schematem urn:otwarte-dane:harvester:1.13</td></tr>
    </table>
  </div>

  <p><strong>Proszę o skonfigurowanie automatycznego harvestera dla powyższych adresów URL.</strong></p>

  <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; color: #856404;">
      ⚠️ Uwaga: System jest gotowy do automatycznego pobierania danych.
      Proszę o potwierdzenie konfiguracji harvestera.
    </p>
  </div>

  <p>W razie pytań technicznych jestem dostępny pod adresem email: ${developer.email}</p>

  <p>Pozdrawiam,<br>
  <strong>${developer.name}</strong><br>
  ${developer.company_name}<br>
  <a href="mailto:${developer.email}" style="color: #2563eb;">${developer.email}</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <div style="font-size: 12px; color: #666; text-align: center;">
    <p>Email wygenerowany automatycznie przez system OTORAPORT<br>
    Powered by <a href="https://otoraport.pl" style="color: #2563eb;">otoraport.pl</a></p>
  </div>

</body>
</html>
  `;

  const text = `
Rejestracja dostawcy danych - ${developer.company_name || developer.name}

Dzień dobry,

Zwracam się z wnioskiem o założenie profilu dostawcy danych dla:

DANE DEWELOPERA:
- Nazwa: ${developer.company_name || developer.name}
- NIP: ${developer.nip || 'do uzupełnienia'}
- REGON: ${developer.regon || 'do uzupełnienia'}
- Forma prawna: ${developer.legal_form || 'spółka z o.o.'}
- Adres siedziby: ${developer.headquarters_address || 'do uzupełnienia'}
- Email: ${developer.email}
- Telefon: ${developer.phone || 'do uzupełnienia'}

URL-E DO HARVESTERA:
- Plik XML: ${xmlUrl}
- Suma kontrolna MD5: ${md5Url}
- Częstotliwość: Codziennie o 8:00 UTC
- Format: XML zgodny ze schematem urn:otwarte-dane:harvester:1.13

Proszę o skonfigurowanie automatycznego harvestera dla powyższych adresów URL.

W razie pytań technicznych jestem dostępny pod adresem email: ${developer.email}

Pozdrawiam,
${developer.name}
${developer.company_name}
${developer.email}

---
Email wygenerowany automatycznie przez system OTORAPORT
  `.trim();

  return { subject, html, text };
}

/**
 * NOWY: Welcome email z ostrzeżeniem o ręcznym raportowaniu
 */
export function generateWelcomeEmailWithInstructions(developer: Developer): EmailTemplate {
  const dashboardUrl = `${NEXTAUTH_URL}/dashboard`;
  const planType = developer.subscription_plan || 'trial';

  const subject = `Witaj w OTORAPORT! WAŻNE instrukcje dotyczące raportowania`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Witaj w OTORAPORT</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">🏢 OTORAPORT</h1>
    <p style="color: #666; font-size: 16px;">Automatyzacja compliance dla deweloperów</p>
  </div>

  <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
    <h2 style="color: #166534; margin-top: 0; font-size: 20px;">✅ Konto zostało utworzone pomyślnie!</h2>
    <p style="margin-bottom: 0; color: #166534;"><strong>Plan:</strong> ${planType.toUpperCase()}</p>
  </div>

  <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
    <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">⚠️ WAŻNE - Instrukcje na start</h3>
    <div style="background: #fffbeb; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 16px;">
        Dopóki Ministerstwo nie potwierdzi rejestracji, musisz wysyłać raporty ręcznie!
      </p>
    </div>

    <h4 style="color: #92400e; margin: 15px 0 10px 0;">Proces rejestracji:</h4>
    <ol style="margin: 10px 0; padding-left: 20px; color: #92400e;">
      <li><strong>Wyślij email rejestracyjny</strong> (przygotowaliśmy szablon)</li>
      <li><strong>Czekaj na odpowiedź</strong> z Ministerstwa (2-5 dni roboczych)</li>
      <li><strong>Po potwierdzeniu</strong> - system będzie działał automatycznie</li>
    </ol>
  </div>

  <div style="background: #f8fafc; border-radius: 8px; padding: 25px; margin: 25px 0;">
    <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">🚀 Twoje URL-e do Ministerstwa:</h3>

    <div style="background: white; border-radius: 6px; padding: 15px; margin: 15px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 5px 0; font-family: monospace; font-size: 14px;"><strong>XML:</strong><br>
      <a href="${NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml" style="color: #2563eb; word-break: break-all;">${NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml</a></p>
    </div>

    <div style="background: white; border-radius: 6px; padding: 15px; margin: 15px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 5px 0; font-family: monospace; font-size: 14px;"><strong>MD5:</strong><br>
      <a href="${NEXTAUTH_URL}/api/public/${developer.client_id}/data.md5" style="color: #2563eb; word-break: break-all;">${NEXTAUTH_URL}/api/public/${developer.client_id}/data.md5</a></p>
    </div>
  </div>

  <div style="background: #f1f5f9; border-radius: 8px; padding: 25px; margin: 25px 0;">
    <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">📋 Następne kroki:</h3>
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 10px;">🏠 <strong>Dodaj mieszkania:</strong> Upload pliku CSV/Excel z cenami</li>
      <li style="margin-bottom: 10px;">📧 <strong>Wyślij rejestrację:</strong> Użyj szablonu email do Ministerstwa</li>
      <li style="margin-bottom: 10px;">📊 <strong>Monitoruj status:</strong> Sprawdzaj dashboard regularnie</li>
      <li style="margin-bottom: 10px;">✅ <strong>Czekaj na potwierdzenie:</strong> Następnie wszystko będzie automatyczne</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Przejdź do Dashboard
    </a>
  </div>

  <div style="background: #f8fafc; border-radius: 6px; padding: 20px; margin: 25px 0; border-left: 4px solid #2563eb;">
    <h4 style="color: #1e293b; margin-top: 0;">💡 Wskazówka:</h4>
    <p style="margin-bottom: 0; color: #475569;">
      Większość deweloperów otrzymuje potwierdzenie z Ministerstwa w ciągu 2-3 dni roboczych.
      Do tego czasu Twoje dane są już dostępne pod podanymi URL-ami.
    </p>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <div style="text-align: center;">
    <p style="color: #666; font-size: 14px; margin: 10px 0;">
      Potrzebujesz pomocy? Skontaktuj się z nami:
    </p>
    <p style="color: #666; font-size: 14px; margin: 10px 0;">
      📧 <a href="mailto:support@otoraport.pl" style="color: #2563eb;">support@otoraport.pl</a><br>
      📞 <a href="tel:+48123456789" style="color: #2563eb;">+48 123 456 789</a>
    </p>
  </div>

  <div style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
    <p>© ${new Date().getFullYear()} OTORAPORT. Wszystkie prawa zastrzeżone.<br>
    <a href="https://otoraport.pl" style="color: #2563eb;">otoraport.pl</a></p>
  </div>

</body>
</html>
  `;

  const text = `
OTORAPORT - Witaj ${developer.name}!

✅ Twoje konto ${planType.toUpperCase()} zostało pomyślnie utworzone!

⚠️ WAŻNE INSTRUKCJE:
Dopóki Ministerstwo nie potwierdzi rejestracji, musisz wysyłać raporty ręcznie!

Proces rejestracji:
1. Wyślij email rejestracyjny (przygotowaliśmy szablon)
2. Czekaj na odpowiedź z Ministerstwa (2-5 dni)
3. Po potwierdzeniu - system działa automatycznie

🚀 Twoje URL-e do Ministerstwa:
XML: ${NEXTAUTH_URL}/api/public/${developer.client_id}/data.xml
MD5: ${NEXTAUTH_URL}/api/public/${developer.client_id}/data.md5

📋 Następne kroki:
- Dodaj mieszkania (upload CSV/Excel)
- Wyślij rejestrację do Ministerstwa
- Monitoruj dashboard
- Czekaj na potwierdzenie

Dashboard: ${dashboardUrl}

Potrzebujesz pomocy?
📧 support@otoraport.pl
📞 +48 123 456 789

© ${new Date().getFullYear()} OTORAPORT
  `.trim();

  return { subject, html, text };
}

/**
 * Email potwierdzający aktywację harvestera
 */
export function generateHarvesterActivatedTemplate(developer: Developer): EmailTemplate {
  const dashboardUrl = `${NEXTAUTH_URL}/dashboard`;

  const subject = `🎉 Świetnie! Twój harvester jest aktywny - automatyczne raportowanie włączone`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harvester Aktywny</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #059669; font-size: 32px; margin-bottom: 10px;">🎉 Sukces!</h1>
    <p style="color: #666; font-size: 18px;">Twój harvester jest teraz aktywny</p>
  </div>

  <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
    <h2 style="color: #065f46; margin-top: 0; font-size: 24px;">✅ Automatyczne raportowanie włączone!</h2>
    <p style="color: #047857; font-size: 16px; margin-bottom: 0;">
      Ministerstwo potwierdził konfigurację harvestera. Od teraz system automatycznie pobiera Twoje dane każdego dnia.
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 8px; padding: 25px; margin: 25px 0;">
    <h3 style="color: #1e293b; margin-top: 0;">🔄 Co się teraz dzieje automatycznie:</h3>
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 10px;">📊 <strong>Codzienne aktualizacje</strong> o 8:00 UTC</li>
      <li style="margin-bottom: 10px;">🔍 <strong>Automatyczna weryfikacja</strong> zgodności z ustawą</li>
      <li style="margin-bottom: 10px;">📁 <strong>Generowanie XML i MD5</strong> bez Twojego udziału</li>
      <li style="margin-bottom: 10px;">⚡ <strong>Natychmiastowe publikowanie</strong> zmian cen</li>
      <li style="margin-bottom: 10px;">📈 <strong>Monitoring i alerty</strong> w przypadku problemów</li>
    </ul>
  </div>

  <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
    <h3 style="color: #92400e; margin-top: 0;">💡 Pamiętaj:</h3>
    <p style="color: #92400e; margin-bottom: 0;">
      Gdy zmieniasz ceny mieszkań, wystarczy że zaktualizujesz plik w systemie OTORAPORT.
      Reszta dzieje się automatycznie - nie musisz już ręcznie nic wysyłać do Ministerstwa!
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Zobacz Dashboard
    </a>
  </div>

  <div style="text-align: center; color: #666; font-size: 14px;">
    <p>Gratulacje! Twój compliance jest teraz w pełni zautomatyzowany. 🚀</p>
  </div>

</body>
</html>
  `;

  const text = `
🎉 Sukces! Twój harvester jest aktywny

✅ Automatyczne raportowanie włączone!

Ministerstwo potwierdził konfigurację harvestera. Od teraz system automatycznie pobiera Twoje dane każdego dnia.

🔄 Co się teraz dzieje automatycznie:
- Codzienne aktualizacje o 8:00 UTC
- Automatyczna weryfikacja zgodności
- Generowanie XML i MD5 bez Twojego udziału
- Natychmiastowe publikowanie zmian cen
- Monitoring i alerty

💡 Pamiętaj:
Gdy zmieniasz ceny mieszkań, wystarczy że zaktualizujesz plik w systemie OTORAPORT. Reszta dzieje się automatycznie!

Dashboard: ${dashboardUrl}

Gratulacje! Twój compliance jest teraz w pełni zautomatyzowany! 🚀
  `.trim();

  return { subject, html, text };
}

/**
 * Template alertu o końcu trialu
 */
export function generateTrialEndingTemplate(developer: Developer, daysLeft: number): EmailTemplate {
  const upgradeUrl = `${NEXTAUTH_URL}/dashboard?tab=billing`;

  const subject = `⚠️ Twój trial kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Ending</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 25px; margin: 25px 0;">
    <h2 style="color: #dc2626; margin-top: 0;">⚠️ Twój trial kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}</h2>
    <p style="color: #991b1b;">
      Aby zachować ciągłość raportowania i uniknąć problemów z compliance, wybierz plan płatny.
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${upgradeUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Wybierz Plan
    </a>
  </div>

</body>
</html>
  `;

  const text = `
⚠️ OTORAPORT - Trial kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}

Aby zachować ciągłość raportowania i uniknąć problemów z compliance, wybierz plan płatny.

Upgrade: ${upgradeUrl}
  `.trim();

  return { subject, html, text };
}