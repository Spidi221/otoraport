// Presentation website generator for developers (Pro/Enterprise feature)

export interface PropertyData {
  id: string
  property_number: string
  area: number
  total_price: number
  price_per_m2: number
  floor: number | null
  rooms: number | null
  status: 'available' | 'reserved' | 'sold'
  building_number: string | null
  created_at: string
  updated_at: string
}

export interface ProjectData {
  id: string
  name: string
  description: string | null
  location: string | null
  properties: PropertyData[]
}

export interface DeveloperData {
  name: string
  nip: string
  phone: string | null
  email: string
}

export interface PresentationSiteData {
  developer: DeveloperData
  projects: ProjectData[]
  totalProperties: number
  avgPrice: number
  priceRange: { min: number, max: number }
  generatedAt: string
  presentationUrl: string
}

/**
 * Generate HTML for a presentation website
 */
export function generatePresentationHTML(siteData: PresentationSiteData): string {
  const { developer, projects, totalProperties, avgPrice, priceRange } = siteData
  
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${developer.name} - Oferta Mieszkań</title>
  <meta name="description" content="Aktualna oferta mieszkań od dewelopera ${developer.name}. ${totalProperties} mieszkań w ofercie.">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${developer.name} - Oferta Mieszkań">
  <meta property="og:description" content="${totalProperties} mieszkań w ofercie. Ceny od ${formatPrice(priceRange.min)} do ${formatPrice(priceRange.max)}.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${siteData.presentationUrl}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8fafc;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .header {
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    
    .contact-info {
      display: flex;
      gap: 20px;
      align-items: center;
      font-size: 14px;
      color: #666;
    }
    
    .hero {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 80px 0;
      text-align: center;
    }
    
    .hero h1 {
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    .hero p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      margin-top: 50px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-number {
      font-size: 36px;
      font-weight: bold;
      display: block;
    }
    
    .stat-label {
      font-size: 16px;
      opacity: 0.8;
    }
    
    .main {
      padding: 60px 0;
    }
    
    .section-title {
      font-size: 36px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 50px;
      color: #1e293b;
    }
    
    .projects-grid {
      display: grid;
      gap: 40px;
      margin-bottom: 60px;
    }
    
    .project {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    
    .project-header {
      background: #f1f5f9;
      padding: 30px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .project-title {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 10px;
    }
    
    .project-location {
      color: #64748b;
      font-size: 16px;
    }
    
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 30px;
    }
    
    .property {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .property:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .property-number {
      font-weight: bold;
      font-size: 18px;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .property-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
      font-size: 14px;
      color: #64748b;
    }
    
    .property-price {
      font-size: 20px;
      font-weight: bold;
      color: #16a34a;
      text-align: center;
      padding: 10px;
      background: #f0fdf4;
      border-radius: 6px;
    }
    
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      margin-top: 10px;
    }
    
    .status.available {
      background: #dcfce7;
      color: #166534;
    }
    
    .status.reserved {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status.sold {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .footer {
      background: #1e293b;
      color: white;
      padding: 40px 0;
      text-align: center;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .footer-section h3 {
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    .footer-section p {
      color: #94a3b8;
      line-height: 1.6;
    }
    
    .footer-bottom {
      border-top: 1px solid #374151;
      padding-top: 20px;
      color: #94a3b8;
      font-size: 14px;
    }
    
    .filters {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin-bottom: 30px;
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .filter-group label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    
    .filter-group select, .filter-group input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 32px;
      }
      
      .stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      
      .properties-grid {
        grid-template-columns: 1fr;
        padding: 20px;
      }
      
      .contact-info {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <div class="logo">${developer.name}</div>
        <div class="contact-info">
          ${developer.phone ? `<span>📞 ${developer.phone}</span>` : ''}
          <span>✉️ ${developer.email}</span>
          ${developer.nip ? `<span>NIP: ${developer.nip}</span>` : ''}
        </div>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Mieszkania od Dewelopera</h1>
      <p>Sprawdź aktualną ofertę mieszkań bezpośrednio od ${developer.name}</p>
      
      <div class="stats">
        <div class="stat">
          <span class="stat-number">${totalProperties}</span>
          <span class="stat-label">Mieszkań w ofercie</span>
        </div>
        <div class="stat">
          <span class="stat-number">${formatPrice(avgPrice)}</span>
          <span class="stat-label">Średnia cena</span>
        </div>
        <div class="stat">
          <span class="stat-number">${formatPrice(priceRange.min)}</span>
          <span class="stat-label">Cena od</span>
        </div>
        <div class="stat">
          <span class="stat-number">${formatPrice(priceRange.max)}</span>
          <span class="stat-label">Cena do</span>
        </div>
      </div>
    </div>
  </section>

  <main class="main">
    <div class="container">
      <h2 class="section-title">Dostępne Mieszkania</h2>
      
      <div class="filters">
        <div class="filter-group">
          <label>Min. powierzchnia (m²)</label>
          <input type="number" id="minArea" placeholder="np. 40">
        </div>
        <div class="filter-group">
          <label>Max. powierzchnia (m²)</label>
          <input type="number" id="maxArea" placeholder="np. 120">
        </div>
        <div class="filter-group">
          <label>Min. cena</label>
          <input type="number" id="minPrice" placeholder="np. 300000">
        </div>
        <div class="filter-group">
          <label>Max. cena</label>
          <input type="number" id="maxPrice" placeholder="np. 800000">
        </div>
        <div class="filter-group">
          <label>Status</label>
          <select id="statusFilter">
            <option value="">Wszystkie</option>
            <option value="available">Dostępne</option>
            <option value="reserved">Zarezerwowane</option>
            <option value="sold">Sprzedane</option>
          </select>
        </div>
      </div>
      
      <div class="projects-grid">
        ${projects.map(project => generateProjectHTML(project)).join('')}
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Kontakt</h3>
          <p><strong>${developer.name}</strong></p>
          ${developer.phone ? `<p>Telefon: ${developer.phone}</p>` : ''}
          <p>Email: ${developer.email}</p>
          ${developer.nip ? `<p>NIP: ${developer.nip}</p>` : ''}
        </div>
        <div class="footer-section">
          <h3>Informacje</h3>
          <p>Wszystkie ceny podane są w PLN brutto i mogą ulec zmianie.</p>
          <p>Aktualizacja: ${formatDate(siteData.generatedAt)}</p>
        </div>
        <div class="footer-section">
          <h3>Zgodność</h3>
          <p>Dane zgodne z wymaganiami ustawy z dnia 21 maja 2025 r.</p>
          <p>Oferta skierowana wyłącznie do konsumentów.</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${developer.name}. Wszelkie prawa zastrzeżone.</p>
        <p>Strona wygenerowana automatycznie przez system CenySync.pl</p>
      </div>
    </div>
  </footer>

  <script>
    // Simple filtering functionality
    function filterProperties() {
      const minArea = document.getElementById('minArea').value;
      const maxArea = document.getElementById('maxArea').value;
      const minPrice = document.getElementById('minPrice').value;
      const maxPrice = document.getElementById('maxPrice').value;
      const status = document.getElementById('statusFilter').value;
      
      const properties = document.querySelectorAll('.property');
      
      properties.forEach(property => {
        const area = parseFloat(property.dataset.area);
        const price = parseFloat(property.dataset.price);
        const propStatus = property.dataset.status;
        
        let show = true;
        
        if (minArea && area < parseFloat(minArea)) show = false;
        if (maxArea && area > parseFloat(maxArea)) show = false;
        if (minPrice && price < parseFloat(minPrice)) show = false;
        if (maxPrice && price > parseFloat(maxPrice)) show = false;
        if (status && propStatus !== status) show = false;
        
        property.style.display = show ? 'block' : 'none';
      });
    }
    
    // Add event listeners
    document.getElementById('minArea').addEventListener('input', filterProperties);
    document.getElementById('maxArea').addEventListener('input', filterProperties);
    document.getElementById('minPrice').addEventListener('input', filterProperties);
    document.getElementById('maxPrice').addEventListener('input', filterProperties);
    document.getElementById('statusFilter').addEventListener('change', filterProperties);
  </script>
</body>
</html>`
}

function generateProjectHTML(project: ProjectData): string {
  return `
    <div class="project">
      <div class="project-header">
        <div class="project-title">${project.name}</div>
        ${project.location ? `<div class="project-location">📍 ${project.location}</div>` : ''}
        ${project.description ? `<p style="margin-top: 10px; color: #64748b;">${project.description}</p>` : ''}
      </div>
      <div class="properties-grid">
        ${project.properties.map(property => generatePropertyHTML(property)).join('')}
      </div>
    </div>
  `
}

function generatePropertyHTML(property: PropertyData): string {
  const statusLabels = {
    available: 'Dostępne',
    reserved: 'Zarezerwowane', 
    sold: 'Sprzedane'
  }
  
  return `
    <div class="property" 
         data-area="${property.area}" 
         data-price="${property.total_price}" 
         data-status="${property.status}">
      <div class="property-number">Mieszkanie ${property.property_number}</div>
      <div class="property-details">
        <span>Powierzchnia: ${property.area} m²</span>
        <span>Piętro: ${property.floor || 'N/A'}</span>
        <span>Pokoje: ${property.rooms || 'N/A'}</span>
        <span>Cena za m²: ${formatPrice(property.price_per_m2)}</span>
      </div>
      <div class="property-price">
        ${formatPrice(property.total_price)}
      </div>
      <div class="status ${property.status}">
        ${statusLabels[property.status]}
      </div>
    </div>
  `
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generate robots.txt for the presentation site
 */
export function generateRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: https://${siteUrl}/sitemap.xml`
}

/**
 * Generate sitemap.xml for SEO
 */
export function generateSitemap(siteUrl: string, projects: ProjectData[]): string {
  const urls = [
    `<url>
      <loc>https://${siteUrl}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>1.0</priority>
    </url>`
  ]
  
  projects.forEach(project => {
    urls.push(`<url>
      <loc>https://${siteUrl}#project-${project.id}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>0.8</priority>
    </url>`)
  })
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('\n  ')}
</urlset>`
}