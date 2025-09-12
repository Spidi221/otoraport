/**
 * Ministry email templates generator for dane.gov.pl registration
 * Generates automatic registration emails for developers
 */

interface DeveloperData {
  company_name: string
  name: string
  email: string
  phone?: string
  nip?: string
  krs?: string
  regon?: string
  legal_form?: string
  headquarters_address?: string
  client_id: string
  xml_url: string
  md5_url: string
}

/**
 * Generates registration email template for dane.gov.pl
 */
export function generateMinistryRegistrationEmail(developer: DeveloperData): {
  to: string
  subject: string
  body: string
  htmlBody: string
} {
  const currentDate = new Date().toLocaleDateString('pl-PL')
  
  const subject = `Wniosek o założenie profilu dostawcy danych - ${developer.company_name} - NIP ${developer.nip}`
  
  const plainTextBody = `
Dzień dobry,

Zwracam się z wnioskiem o założenie profilu dostawcy danych dla dewelopera na portalu dane.gov.pl zgodnie z ustawą z dnia 21 maja 2021 r. o jawności cen mieszkań.

DANE DEWELOPERA:
▪ Pełna nazwa: ${developer.company_name}
▪ Osoba kontaktowa: ${developer.name}
▪ Email kontaktowy: ${developer.email}
${developer.phone ? `▪ Telefon: ${developer.phone}` : ''}
${developer.nip ? `▪ NIP: ${developer.nip}` : ''}
${developer.krs ? `▪ KRS: ${developer.krs}` : ''}
${developer.regon ? `▪ REGON: ${developer.regon}` : ''}
${developer.legal_form ? `▪ Forma prawna: ${developer.legal_form}` : ''}
${developer.headquarters_address ? `▪ Adres siedziby: ${developer.headquarters_address}` : ''}

DANE TECHNICZNE:
▪ URL do pliku XML: ${developer.xml_url}
▪ URL do pliku MD5: ${developer.md5_url}
▪ Częstotliwość aktualizacji: codziennie o 8:00
▪ Format danych: XML zgodny ze schematem urn:otwarte-dane:harvester:1.13
▪ Encoding: UTF-8

PROSZĘ O:
1. Założenie profilu dostawcy dla powyższego dewelopera
2. Skonfigurowanie harvestera dla automatycznego pobierania danych z podanych URL-i
3. Weryfikację poprawności pierwszego poboru danych
4. Przesłanie potwierdzenia aktywacji profilu

Dane będą aktualizowane automatycznie każdego dnia zgodnie z wymaganiami ustawowymi. System został wdrożony w ramach automatyzacji obowiązków raportowych.

Z poważaniem,
${developer.name}
${developer.company_name}
${developer.email}

---
Wygenerowano automatycznie przez system OTORAPORT
Data: ${currentDate}
  `.trim()

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #007bff; margin-bottom: 10px; }
        .data-list { list-style: none; padding: 0; }
        .data-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
        .data-list li strong { color: #333; }
        .footer { background-color: #f8f9fa; padding: 15px; font-size: 12px; color: #666; margin-top: 30px; }
        .urgent { background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Wniosek o założenie profilu dostawcy danych</h2>
        <p><strong>Deweloper:</strong> ${developer.company_name}</p>
        <p><strong>Data:</strong> ${currentDate}</p>
    </div>

    <p>Dzień dobry,</p>
    
    <p>Zwracam się z wnioskiem o założenie profilu dostawcy danych dla dewelopera na portalu <strong>dane.gov.pl</strong> zgodnie z ustawą z dnia 21 maja 2021 r. o jawności cen mieszkań.</p>

    <div class="section">
        <h3>📋 DANE DEWELOPERA</h3>
        <ul class="data-list">
            <li><strong>Pełna nazwa:</strong> ${developer.company_name}</li>
            <li><strong>Osoba kontaktowa:</strong> ${developer.name}</li>
            <li><strong>Email kontaktowy:</strong> ${developer.email}</li>
            ${developer.phone ? `<li><strong>Telefon:</strong> ${developer.phone}</li>` : ''}
            ${developer.nip ? `<li><strong>NIP:</strong> ${developer.nip}</li>` : ''}
            ${developer.krs ? `<li><strong>KRS:</strong> ${developer.krs}</li>` : ''}
            ${developer.regon ? `<li><strong>REGON:</strong> ${developer.regon}</li>` : ''}
            ${developer.legal_form ? `<li><strong>Forma prawna:</strong> ${developer.legal_form}</li>` : ''}
            ${developer.headquarters_address ? `<li><strong>Adres siedziby:</strong> ${developer.headquarters_address}</li>` : ''}
        </ul>
    </div>

    <div class="section">
        <h3>⚙️ DANE TECHNICZNE</h3>
        <ul class="data-list">
            <li><strong>URL do pliku XML:</strong> <a href="${developer.xml_url}">${developer.xml_url}</a></li>
            <li><strong>URL do pliku MD5:</strong> <a href="${developer.md5_url}">${developer.md5_url}</a></li>
            <li><strong>Częstotliwość aktualizacji:</strong> codziennie o 8:00</li>
            <li><strong>Format danych:</strong> XML zgodny ze schematem urn:otwarte-dane:harvester:1.13</li>
            <li><strong>Encoding:</strong> UTF-8</li>
        </ul>
    </div>

    <div class="urgent">
        <h3>📝 PROSZĘ O:</h3>
        <ol>
            <li>Założenie profilu dostawcy dla powyższego dewelopera</li>
            <li>Skonfigurowanie harvestera dla automatycznego pobierania danych z podanych URL-i</li>
            <li>Weryfikację poprawności pierwszego poboru danych</li>
            <li>Przesłanie potwierdzenia aktywacji profilu</li>
        </ol>
    </div>

    <p>Dane będą aktualizowane automatycznie każdego dnia zgodnie z wymaganiami ustawowymi. System został wdrożony w ramach automatyzacji obowiązków raportowych.</p>

    <p>Z poważaniem,<br>
    <strong>${developer.name}</strong><br>
    ${developer.company_name}<br>
    <a href="mailto:${developer.email}">${developer.email}</a></p>

    <div class="footer">
        <p>Wygenerowano automatycznie przez system <strong>OTORAPORT</strong> | Data: ${currentDate}</p>
        <p>System automatyzacji raportowania cen mieszkań zgodnie z ustawą o jawności cen</p>
    </div>
</body>
</html>
  `.trim()

  return {
    to: 'kontakt@dane.gov.pl',
    subject,
    body: plainTextBody,
    htmlBody
  }
}

/**
 * Generates follow-up email template for ministry registration
 */
export function generateMinistryFollowUpEmail(developer: DeveloperData, daysSinceRegistration: number): {
  to: string
  subject: string
  body: string
  htmlBody: string
} {
  const currentDate = new Date().toLocaleDateString('pl-PL')
  
  const subject = `Przypomnienie - Profil dostawcy danych - ${developer.company_name} - NIP ${developer.nip}`
  
  const plainTextBody = `
Dzień dobry,

Nawiązując do mojego wniosku z dnia ${new Date(Date.now() - daysSinceRegistration * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL')} dotyczącego założenia profilu dostawcy danych dla ${developer.company_name}, uprzejmie przypominam o sprawie.

DANE DEWELOPERA:
▪ Pełna nazwa: ${developer.company_name}
▪ NIP: ${developer.nip}
▪ Email: ${developer.email}

DANE TECHNICZNE:
▪ URL do pliku XML: ${developer.xml_url}
▪ URL do pliku MD5: ${developer.md5_url}

Proszę o informację o statusie wniosku oraz przewidywanym terminie aktywacji profilu dostawcy.

Z poważaniem,
${developer.name}
${developer.company_name}
${developer.email}

---
Wygenerowano automatycznie przez system OTORAPORT
Data: ${currentDate}
  `.trim()

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .data-list { list-style: none; padding: 0; }
        .data-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
        .footer { background-color: #f8f9fa; padding: 15px; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>⏰ Przypomnienie - Profil dostawcy danych</h2>
        <p><strong>Deweloper:</strong> ${developer.company_name}</p>
        <p><strong>Dni od wniosku:</strong> ${daysSinceRegistration}</p>
    </div>

    <p>Dzień dobry,</p>
    
    <p>Nawiązując do mojego wniosku z dnia <strong>${new Date(Date.now() - daysSinceRegistration * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL')}</strong> dotyczącego założenia profilu dostawcy danych dla <strong>${developer.company_name}</strong>, uprzejmie przypominam o sprawie.</p>

    <div class="section">
        <h3>📋 DANE DEWELOPERA</h3>
        <ul class="data-list">
            <li><strong>Pełna nazwa:</strong> ${developer.company_name}</li>
            <li><strong>NIP:</strong> ${developer.nip}</li>
            <li><strong>Email:</strong> ${developer.email}</li>
        </ul>
    </div>

    <div class="section">
        <h3>⚙️ DANE TECHNICZNE</h3>
        <ul class="data-list">
            <li><strong>URL do pliku XML:</strong> <a href="${developer.xml_url}">${developer.xml_url}</a></li>
            <li><strong>URL do pliku MD5:</strong> <a href="${developer.md5_url}">${developer.md5_url}</a></li>
        </ul>
    </div>

    <p>Proszę o informację o statusie wniosku oraz przewidywanym terminie aktywacji profilu dostawcy.</p>

    <p>Z poważaniem,<br>
    <strong>${developer.name}</strong><br>
    ${developer.company_name}<br>
    <a href="mailto:${developer.email}">${developer.email}</a></p>

    <div class="footer">
        <p>Wygenerowano automatycznie przez system <strong>OTORAPORT</strong> | Data: ${currentDate}</p>
    </div>
</body>
</html>
  `.trim()

  return {
    to: 'kontakt@dane.gov.pl',
    subject,
    body: plainTextBody,
    htmlBody
  }
}

/**
 * Generates email template for ministry data validation errors
 */
export function generateMinistryDataErrorEmail(developer: DeveloperData, errors: string[]): {
  to: string
  subject: string
  body: string
  htmlBody: string
} {
  const currentDate = new Date().toLocaleDateString('pl-PL')
  
  const subject = `Błędy walidacji danych - ${developer.company_name} - wymagana interwencja`
  
  const errorList = errors.map(error => `▪ ${error}`).join('\n')
  
  const plainTextBody = `
Dzień dobry,

Informuję o wystąpieniu błędów walidacji w danych przekazywanych do systemu dane.gov.pl dla dewelopera ${developer.company_name}.

WYKRYTE BŁĘDY:
${errorList}

DANE TECHNICZNE:
▪ URL do pliku XML: ${developer.xml_url}
▪ URL do pliku MD5: ${developer.md5_url}
▪ Data wystąpienia: ${currentDate}

Proszę o weryfikację konfiguracji harvestera i ewentualną pomoc w rozwiązaniu problemów technicznych.

Z poważaniem,
${developer.name}
${developer.company_name}
${developer.email}

---
Wygenerowano automatycznie przez system OTORAPORT
Data: ${currentDate}
  `.trim()

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8d7da; padding: 20px; border-left: 4px solid #dc3545; margin-bottom: 20px; }
        .error-list { background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; }
        .error-list li { color: #dc3545; margin: 5px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🚨 Błędy walidacji danych</h2>
        <p><strong>Deweloper:</strong> ${developer.company_name}</p>
        <p><strong>Data:</strong> ${currentDate}</p>
    </div>

    <p>Dzień dobry,</p>
    
    <p>Informuję o wystąpieniu błędów walidacji w danych przekazywanych do systemu <strong>dane.gov.pl</strong> dla dewelopera <strong>${developer.company_name}</strong>.</p>

    <div class="error-list">
        <h3>❌ WYKRYTE BŁĘDY:</h3>
        <ul>
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    </div>

    <p><strong>Dane techniczne:</strong></p>
    <ul>
        <li><strong>URL do pliku XML:</strong> <a href="${developer.xml_url}">${developer.xml_url}</a></li>
        <li><strong>URL do pliku MD5:</strong> <a href="${developer.md5_url}">${developer.md5_url}</a></li>
        <li><strong>Data wystąpienia:</strong> ${currentDate}</li>
    </ul>

    <p>Proszę o weryfikację konfiguracji harvestera i ewentualną pomoc w rozwiązaniu problemów technicznych.</p>

    <p>Z poważaniem,<br>
    <strong>${developer.name}</strong><br>
    ${developer.company_name}<br>
    <a href="mailto:${developer.email}">${developer.email}</a></p>

    <div class="footer">
        <p>Wygenerowano automatycznie przez system <strong>OTORAPORT</strong> | Data: ${currentDate}</p>
    </div>
</body>
</html>
  `.trim()

  return {
    to: 'kontakt@dane.gov.pl',
    subject,
    body: plainTextBody,
    htmlBody
  }
}