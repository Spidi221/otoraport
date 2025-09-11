// Generator plików Markdown dla ministerstwa
// Czytelna alternatywa dla XML

import { XMLGeneratorOptions } from './xml-generator';

export function generateMarkdownFile(options: XMLGeneratorOptions): string {
  const { properties, developer, projects } = options;
  
  const currentDate = new Date().toLocaleDateString('pl-PL');
  const currentYear = new Date().getFullYear();
  
  // Grupowanie nieruchomości per projekt
  const propertiesByProject = properties.reduce((acc, property) => {
    const project = projects.find(p => p.id === property.project_id);
    const projectName = project?.name || 'Nieznany projekt';
    
    if (!acc[projectName]) {
      acc[projectName] = {
        project: project,
        properties: []
      };
    }
    acc[projectName].properties.push(property);
    return acc;
  }, {} as Record<string, { project: any, properties: typeof properties }>);

  // Statistyki
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const soldProperties = properties.filter(p => p.status === 'sold').length;
  const reservedProperties = properties.filter(p => p.status === 'reserved').length;
  const averagePrice = properties.reduce((sum, p) => sum + p.price_per_m2, 0) / properties.length;
  const minPrice = Math.min(...properties.map(p => p.price_per_m2));
  const maxPrice = Math.max(...properties.map(p => p.price_per_m2));

  const markdown = `# Raport Cen Mieszkań - ${developer.company_name}

**Data aktualizacji:** ${currentDate}  
**Generowany przez:** System OTORAPORT  
**Zgodność z ustawą:** Ustawa z dnia 21 maja 2025 r. o zmianie ustawy o ochronie praw nabywcy lokalu mieszkalnego

---

## 📊 Podsumowanie Wykonawcze

### Dane dewelopera
- **Nazwa:** ${developer.company_name}
- **Osoba kontaktowa:** ${developer.name}
- **NIP:** ${developer.nip}
- **Email:** ${developer.email}
${developer.phone ? `- **Telefon:** ${developer.phone}` : ''}

### Statystyki ogólne
- **Liczba projektów:** ${Object.keys(propertiesByProject).length}
- **Wszystkie nieruchomości:** ${totalProperties}
- **Dostępne:** ${availableProperties}
- **Sprzedane:** ${soldProperties}
- **Zarezerwowane:** ${reservedProperties}

### Analiza cenowa
- **Średnia cena za m²:** ${averagePrice.toLocaleString('pl-PL')} zł
- **Najniższa cena za m²:** ${minPrice.toLocaleString('pl-PL')} zł
- **Najwyższa cena za m²:** ${maxPrice.toLocaleString('pl-PL')} zł

---

## 🏗️ Projekty Deweloperskie

${Object.entries(propertiesByProject).map(([projectName, data]) => {
  const { project, properties: projectProperties } = data;
  
  return `### ${projectName}

${project ? `**Lokalizacja:** ${project.location}  
**Adres:** ${project.address}` : ''}

**Liczba mieszkań:** ${projectProperties.length}  
**Dostępne:** ${projectProperties.filter(p => p.status === 'available').length}  
**Sprzedane:** ${projectProperties.filter(p => p.status === 'sold').length}  
**Zarezerwowane:** ${projectProperties.filter(p => p.status === 'reserved').length}

#### Cennik mieszkań

| Nr lokalu | Typ | Powierzchnia | Cena/m² | Cena całkowita | Status | Miejsce parkingowe |
|-----------|-----|--------------|---------|----------------|--------|--------------------|
${projectProperties.map(property => 
  `| ${property.property_number} | ${property.property_type} | ${property.area}m² | ${property.price_per_m2.toLocaleString('pl-PL')} zł | ${property.final_price.toLocaleString('pl-PL')} zł | ${getStatusLabel(property.status)} | ${property.parking_space || 'Brak'} ${property.parking_price ? `(${property.parking_price.toLocaleString('pl-PL')} zł)` : ''} |`
).join('\n')}

**Analiza cenowa projektu ${projectName}:**
- Średnia cena za m²: ${(projectProperties.reduce((sum, p) => sum + p.price_per_m2, 0) / projectProperties.length).toLocaleString('pl-PL')} zł
- Najniższa cena za m²: ${Math.min(...projectProperties.map(p => p.price_per_m2)).toLocaleString('pl-PL')} zł  
- Najwyższa cena za m²: ${Math.max(...projectProperties.map(p => p.price_per_m2)).toLocaleString('pl-PL')} zł

`;
}).join('\n---\n\n')}

---

## 📈 Szczegółowa Analiza Rynkowa

### Rozkład powierzchni mieszkań
${generateSurfaceAnalysis(properties)}

### Rozkład cen za m²
${generatePriceAnalysis(properties)}

### Trendy sprzedaży
- **Wskaźnik dostępności:** ${((availableProperties / totalProperties) * 100).toFixed(1)}%
- **Wskaźnik sprzedaży:** ${((soldProperties / totalProperties) * 100).toFixed(1)}%
- **Wskaźnik rezerwacji:** ${((reservedProperties / totalProperties) * 100).toFixed(1)}%

---

## 📋 Informacje Techniczne

### Metodologia
- Dane pochodzą z systemu zarządzania nieruchomościami dewelopera
- Aktualizacja: automatyczna, przy każdej zmianie statusu lub ceny
- Format danych: zgodny z wymogami ustawy mieszkaniowej
- Walidacja: automatyczna weryfikacja poprawności danych

### Źródło danych
- **System:** OTORAPORT - Automatyzacja raportowania cen nieruchomości
- **URL danych XML:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/data.xml\`
- **URL tego raportu:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/data.md\`

### Licencja i prawa autorskie
- **Licencja:** Creative Commons BY 4.0
- **Prawa autorskie:** © ${currentYear} ${developer.company_name}
- **Wykorzystanie:** Dozwolone wykorzystanie z podaniem źródła

---

## 🔗 Linki i Kontakt

### Dane kontaktowe
- **Email:** [${developer.email}](mailto:${developer.email})
${developer.phone ? `- **Telefon:** [${developer.phone}](tel:${developer.phone})` : ''}

### Zasoby online
- **Portal dewelopera:** \`https://ceny-sync.vercel.app/developer/${developer.id}\`
- **API endpointy:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/\`
- **Dokumentacja systemu:** [OTORAPORT Documentation](https://ceny-sync.vercel.app/docs)

---

*Ten raport został wygenerowany automatycznie przez system OTORAPORT w dniu ${currentDate}.*  
*Wszystkie dane są aktualne na moment generowania raportu.*  
*W przypadku pytań prosimy o kontakt z deweloperem pod adresem: ${developer.email}*

---

**Zgodność prawna:** Ten raport spełnia wymogi ustawy z dnia 21 maja 2025 r. o zmianie ustawy o ochronie praw nabywcy lokalu mieszkalnego w zakresie obowiązku publikacji aktualnych cen mieszkań przez deweloperów.`;

  return markdown;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return '🟢 Dostępne';
    case 'sold': return '🔴 Sprzedane';
    case 'reserved': return '🟡 Zarezerwowane';
    default: return '⚪ Nieznany';
  }
}

function generateSurfaceAnalysis(properties: any[]): string {
  const surfaceRanges = {
    'do 30m²': properties.filter(p => p.area <= 30).length,
    '31-50m²': properties.filter(p => p.area > 30 && p.area <= 50).length,
    '51-70m²': properties.filter(p => p.area > 50 && p.area <= 70).length,
    '71-90m²': properties.filter(p => p.area > 70 && p.area <= 90).length,
    'ponad 90m²': properties.filter(p => p.area > 90).length,
  };

  return Object.entries(surfaceRanges)
    .map(([range, count]) => `- **${range}:** ${count} mieszkań`)
    .join('\n');
}

function generatePriceAnalysis(properties: any[]): string {
  const priceRanges = {
    'do 8000 zł/m²': properties.filter(p => p.price_per_m2 <= 8000).length,
    '8001-10000 zł/m²': properties.filter(p => p.price_per_m2 > 8000 && p.price_per_m2 <= 10000).length,
    '10001-12000 zł/m²': properties.filter(p => p.price_per_m2 > 10000 && p.price_per_m2 <= 12000).length,
    '12001-15000 zł/m²': properties.filter(p => p.price_per_m2 > 12000 && p.price_per_m2 <= 15000).length,
    'ponad 15000 zł/m²': properties.filter(p => p.price_per_m2 > 15000).length,
  };

  return Object.entries(priceRanges)
    .map(([range, count]) => `- **${range}:** ${count} mieszkań`)
    .join('\n');
}