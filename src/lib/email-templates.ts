// Email templates dla komunikacji z ministerstvom i deweloperami

interface Developer {
  id: string;
  name: string;
  company_name: string;
  nip: string;
  email: string;
  phone?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Template dla ministerstwa - zawiadomienie o nowym deweloperze
export function generateMinistryNotificationEmail(developer: Developer): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ceny-sync.vercel.app';
  
  return {
    subject: `Nowy deweloper w systemie OTORAPORT - ${developer.company_name}`,
    
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .links { background: #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; color: #6b7280; }
    .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 OTORAPORT</h1>
    <p>Automatyzacja raportowania cen nieruchomości</p>
  </div>
  
  <div class="content">
    <h2>Powiadomienie o nowym deweloperze</h2>
    
    <p>Szanowni Państwo,</p>
    
    <p><strong>${developer.company_name}</strong> zgłasza się do systemu automatycznego raportowania cen mieszkań zgodnie z wymogami ustawy z dnia 21 maja 2025 r. o zmianie ustawy o ochronie praw nabywcy lokalu mieszkalnego.</p>
    
    <div class="info-box">
      <h3>📋 Dane dewelopera:</h3>
      <ul>
        <li><strong>Nazwa firmy:</strong> ${developer.company_name}</li>
        <li><strong>Osoba kontaktowa:</strong> ${developer.name}</li>
        <li><strong>NIP:</strong> ${developer.nip}</li>
        <li><strong>Email:</strong> ${developer.email}</li>
        ${developer.phone ? `<li><strong>Telefon:</strong> ${developer.phone}</li>` : ''}
      </ul>
    </div>
    
    <div class="links">
      <h3>🔗 Automatyczne endpointy danych:</h3>
      <p>Dane są automatycznie aktualizowane i dostępne pod stałymi adresami:</p>
      
      <div style="margin: 15px 0;">
        <a href="${baseUrl}/api/public/${developer.id}/data.xml" class="btn">📄 Pobierz XML</a>
        <a href="${baseUrl}/api/public/${developer.id}/data.md" class="btn">📝 Pobierz Markdown</a>
      </div>
      
      <p><strong>Adresy URL:</strong></p>
      <ul>
        <li><strong>XML:</strong> <code>${baseUrl}/api/public/${developer.id}/data.xml</code></li>
        <li><strong>Markdown:</strong> <code>${baseUrl}/api/public/${developer.id}/data.md</code></li>
      </ul>
    </div>
    
    <div class="info-box">
      <h3>ℹ️ Informacje techniczne:</h3>
      <ul>
        <li>Format XML zgodny z schema dane.gov.pl wersja 1.13</li>
        <li>Automatyczna aktualizacja przy zmianie danych</li>
        <li>Cache: 1 godzina, stale-while-revalidate: 24 godziny</li>
        <li>CORS enabled dla dostępu z zewnętrznych systemów</li>
        <li>Encoding: UTF-8, obsługa polskich znaków</li>
      </ul>
    </div>
    
    <p><strong>Prosimy o potwierdzenie rejestracji dewelopera w systemie automatycznego pozyskiwania danych cenowych.</strong></p>
    
    <p>W razie pytań prosimy o kontakt bezpośredni z deweloperem pod adresem: <a href="mailto:${developer.email}">${developer.email}</a></p>
  </div>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} OTORAPORT - System automatyzacji raportowania cen nieruchomości</p>
    <p>Email został wygenerowany automatycznie przez system OTORAPORT</p>
    <p>Data: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</p>
  </div>
</body>
</html>`,

    text: `
OTORAPORT - Automatyzacja raportowania cen nieruchomości

POWIADOMIENIE O NOWYM DEWELOPERZE

Szanowni Państwo,

${developer.company_name} zgłasza się do systemu automatycznego raportowania cen mieszkań zgodnie z wymogami ustawy z dnia 21 maja 2025 r.

DANE DEWELOPERA:
- Nazwa firmy: ${developer.company_name}
- Osoba kontaktowa: ${developer.name}
- NIP: ${developer.nip}
- Email: ${developer.email}
${developer.phone ? `- Telefon: ${developer.phone}` : ''}

AUTOMATYCZNE ENDPOINTY DANYCH:
Dane dostępne pod stałymi adresami:

XML: ${baseUrl}/api/public/${developer.id}/data.xml
Markdown: ${baseUrl}/api/public/${developer.id}/data.md

INFORMACJE TECHNICZNE:
- Format XML zgodny z schema dane.gov.pl wersja 1.13
- Automatyczna aktualizacja przy zmianie danych
- Cache: 1 godzina, stale-while-revalidate: 24 godziny
- CORS enabled dla dostępu z zewnętrznych systemów

Prosimy o potwierdzenie rejestracji dewelopera w systemie.

W razie pytań kontakt: ${developer.email}

---
© ${new Date().getFullYear()} OTORAPORT
Email wygenerowany automatycznie: ${new Date().toLocaleString('pl-PL')}
`
  };
}

// Template dla dewelopera - potwierdzenie rejestracji
export function generateDeveloperWelcomeEmail(developer: Developer): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ceny-sync.vercel.app';
  
  return {
    subject: `Witamy w OTORAPORT - Twoje dane zostały przesłane do ministerstwa`,
    
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .success-box { background: #d1fae5; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10b981; }
    .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .next-steps { background: #dbeafe; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; color: #6b7280; }
    .btn { background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Witamy w OTORAPORT!</h1>
    <p>Automatyzacja raportowania cen nieruchomości</p>
  </div>
  
  <div class="content">
    <h2>Dziękujemy ${developer.name}!</h2>
    
    <div class="success-box">
      <h3>✅ Rejestracja zakończona pomyślnie</h3>
      <p>Firma <strong>${developer.company_name}</strong> została zarejestrowana w systemie OTORAPORT. Twoje dane zostały automatycznie przesłane do właściwego organu ministerialnego.</p>
    </div>
    
    <div class="info-box">
      <h3>📊 Twoje publiczne endpointy:</h3>
      <p>Dane Twojej firmy są teraz dostępne pod stałymi adresami URL:</p>
      <ul>
        <li><strong>XML:</strong> <code>${baseUrl}/api/public/${developer.id}/data.xml</code></li>
        <li><strong>Markdown:</strong> <code>${baseUrl}/api/public/${developer.id}/data.md</code></li>
      </ul>
      <p>Te adresy automatycznie aktualizują się przy każdej zmianie Twoich danych cenowych.</p>
    </div>
    
    <div class="next-steps">
      <h3>🚀 Następne kroki:</h3>
      <ol>
        <li><strong>Oczekiwanie na potwierdzenie:</strong> Ministerstwo otrzymało powiadomienie o Twojej rejestracji</li>
        <li><strong>Upload cennika:</strong> Przejdź do dashboardu i prześlij swój pierwszy cennik</li>
        <li><strong>Automatyczna aktualizacja:</strong> System będzie automatycznie generować raporty</li>
        <li><strong>Zgodność z prawem:</strong> Twoja firma jest teraz compliance z wymaganiami ustawy</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" class="btn">🏠 Przejdź do Dashboardu</a>
      <a href="${baseUrl}/upload" class="btn">📁 Prześlij Cennik</a>
    </div>
    
    <div class="info-box">
      <h3>📞 Potrzebujesz pomocy?</h3>
      <p>W razie pytań jesteśmy do Twojej dyspozycji:</p>
      <ul>
        <li>📧 Email: support@otoraport.pl</li>
        <li>📱 Telefon: +48 800 123 456</li>
        <li>📚 Dokumentacja: <a href="${baseUrl}/docs">otoraport.pl/docs</a></li>
        <li>💬 Chat na stronie: <a href="${baseUrl}">otoraport.pl</a></li>
      </ul>
    </div>
    
    <p>Dziękujemy za wybór OTORAPORT - razem dbamy o przejrzystość rynku nieruchomości! 🏡</p>
  </div>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} OTORAPORT - System automatyzacji raportowania cen nieruchomości</p>
    <p>Ten email został wygenerowany automatycznie po Twojej rejestracji</p>
    <p>Data: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</p>
  </div>
</body>
</html>`,

    text: `
OTORAPORT - Witamy w systemie!

Dziękujemy ${developer.name}!

REJESTRACJA ZAKOŃCZONA POMYŚLNIE
Firma ${developer.company_name} została zarejestrowana w systemie OTORAPORT.
Twoje dane zostały automatycznie przesłane do ministerstwa.

TWOJE PUBLICZNE ENDPOINTY:
XML: ${baseUrl}/api/public/${developer.id}/data.xml
Markdown: ${baseUrl}/api/public/${developer.id}/data.md

Te adresy automatycznie aktualizują się przy każdej zmianie danych.

NASTĘPNE KROKI:
1. Oczekiwanie na potwierdzenie z ministerstwa
2. Upload cennika w dashboardzie
3. Automatyczna aktualizacja raportów
4. Twoja firma jest teraz compliance z ustawą

LINKI:
- Dashboard: ${baseUrl}/dashboard
- Upload: ${baseUrl}/upload
- Dokumentacja: ${baseUrl}/docs

POMOC:
Email: support@otoraport.pl
Telefon: +48 800 123 456
Chat: otoraport.pl

Dziękujemy za wybór OTORAPORT!

---
© ${new Date().getFullYear()} OTORAPORT
Email wygenerowany automatycznie: ${new Date().toLocaleString('pl-PL')}
`
  };
}

// Template dla dewelopera - powiadomienie o aktualizacji danych
export function generateDataUpdateNotificationEmail(
  developer: Developer, 
  updateDetails: { 
    propertiesCount: number; 
    newProperties: number; 
    updatedPrices: number; 
    uploadedAt: string;
  }
): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ceny-sync.vercel.app';
  
  return {
    subject: `OTORAPORT - Dane zaktualizowane pomyślnie (${updateDetails.propertiesCount} nieruchomości)`,
    
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .update-box { background: #dbeafe; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #3b82f6; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 15px; background: #f8fafc; border-radius: 5px; flex: 1; margin: 0 5px; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; color: #6b7280; }
    .btn { background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 OTORAPORT</h1>
    <p>Aktualizacja danych zakończona</p>
  </div>
  
  <div class="content">
    <h2>Dane zaktualizowane pomyślnie!</h2>
    
    <p>Cześć ${developer.name},</p>
    
    <div class="update-box">
      <h3>✅ Aktualizacja z dnia ${new Date(updateDetails.uploadedAt).toLocaleDateString('pl-PL')}</h3>
      <p>Twoje dane cenowe zostały pomyślnie przetworzone i zaktualizowane w systemie OTORAPORT.</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <h3>${updateDetails.propertiesCount}</h3>
        <p>Wszystkie nieruchomości</p>
      </div>
      <div class="stat">
        <h3>${updateDetails.newProperties}</h3>
        <p>Nowe nieruchomości</p>
      </div>
      <div class="stat">
        <h3>${updateDetails.updatedPrices}</h3>
        <p>Zaktualizowane ceny</p>
      </div>
    </div>
    
    <div class="info-box" style="background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px;">
      <h3>🔄 Status aktualizacji:</h3>
      <ul>
        <li>✅ Pliki XML i Markdown zostały automatycznie wygenerowane</li>
        <li>✅ Publiczne endpointy zostały zaktualizowane</li>
        <li>✅ Cache został odświeżony</li>
        <li>✅ Ministerstwo ma dostęp do najnowszych danych</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/api/public/${developer.id}/data.xml" class="btn">📄 Zobacz XML</a>
      <a href="${baseUrl}/api/public/${developer.id}/data.md" class="btn">📝 Zobacz Raport</a>
      <a href="${baseUrl}/dashboard" class="btn">🏠 Dashboard</a>
    </div>
    
    <p>Twoja firma pozostaje w pełni compliance z wymaganiami ustawy o ochronie praw nabywcy lokalu mieszkalnego.</p>
  </div>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} OTORAPORT - System automatyzacji raportowania cen nieruchomości</p>
    <p>Email został wygenerowany automatycznie po aktualizacji danych</p>
    <p>Data: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</p>
  </div>
</body>
</html>`,

    text: `
OTORAPORT - Dane zaktualizowane pomyślnie!

Cześć ${developer.name},

AKTUALIZACJA Z DNIA ${new Date(updateDetails.uploadedAt).toLocaleDateString('pl-PL')}
Twoje dane cenowe zostały pomyślnie przetworzone i zaktualizowane.

STATYSTYKI:
- Wszystkie nieruchomości: ${updateDetails.propertiesCount}
- Nowe nieruchomości: ${updateDetails.newProperties}
- Zaktualizowane ceny: ${updateDetails.updatedPrices}

STATUS AKTUALIZACJI:
✅ Pliki XML i Markdown wygenerowane
✅ Publiczne endpointy zaktualizowane
✅ Cache odświeżony
✅ Ministerstwo ma najnowsze dane

LINKI:
XML: ${baseUrl}/api/public/${developer.id}/data.xml
Raport: ${baseUrl}/api/public/${developer.id}/data.md
Dashboard: ${baseUrl}/dashboard

Twoja firma pozostaje compliance z wymaganiami ustawy.

---
© ${new Date().getFullYear()} OTORAPORT
Email wygenerowany automatycznie: ${new Date().toLocaleString('pl-PL')}
`
  };
}