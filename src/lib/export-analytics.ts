import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Analytics data structure from API
export interface AnalyticsData {
  kpi: {
    averagePrice: number
    occupancyRate: number
    avgDaysToSell: number
    pricePerM2: number
    trends: {
      averagePrice: number
      occupancyRate: number
      avgDaysToSell: number
      pricePerM2: number
    }
  }
  priceTrends: Array<{ month: string; avgPrice: number; avgPricePerM2: number }>
  daysToSell: Array<{ range: string; count: number }>
  propertyStatus: Array<{ status: string; count: number; percentage: number }>
  cumulativeSales: Array<{ month: string; cumulative: number; monthly: number }>
  marketComparison: Array<{ category: string; myPrice: number; marketAvg: number }>
  metadata: {
    totalProperties: number
    dateRange: string
    propertyType: string
    location: string
    generatedAt: string
    developerName: string
  }
}

/**
 * Export analytics data to PDF
 * Generates a professional PDF report with charts data in table format
 */
export async function exportAnalyticsToPDF(data: AnalyticsData, developerName: string = 'Developer'): Promise<void> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OTO-RAPORT - Raport Analityczny', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Developer: ${developerName}`, pageWidth / 2, 30, { align: 'center' });

    const currentDate = new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Data wygenerowania: ${currentDate}`, pageWidth / 2, 37, { align: 'center' });

    let yPosition = 50;

    // KPI Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Kluczowe Wskaźniki (KPI)', 14, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Wskaźnik', 'Wartość', 'Trend']],
      body: [
        ['Średnia cena', `${formatCurrency(data.kpi.averagePrice)}`, `${formatTrend(data.kpi.trends.averagePrice)}%`],
        ['Wskaźnik zajętości', `${data.kpi.occupancyRate.toFixed(1)}%`, `${formatTrend(data.kpi.trends.occupancyRate)}%`],
        ['Średni czas sprzedaży', `${data.kpi.avgDaysToSell} dni`, `${formatTrend(data.kpi.trends.avgDaysToSell)}%`],
        ['Cena za m²', `${formatCurrency(data.kpi.pricePerM2)}`, `${formatTrend(data.kpi.trends.pricePerM2)}%`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Price Trends Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Trendy Cenowe', 14, yPosition);
    yPosition += 10;

    const priceRows = data.priceTrends.map(pt => [
      pt.month,
      formatCurrency(pt.avgPrice),
      formatCurrency(pt.avgPricePerM2)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Miesiąc', 'Średnia cena', 'Cena za m²']],
      body: priceRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Days to Sell Distribution
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Czas Sprzedaży - Rozkład', 14, yPosition);
    yPosition += 10;

    const daysRows = data.daysToSell.map(d => [
      d.range,
      d.count.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Przedział czasowy', 'Liczba nieruchomości']],
      body: daysRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Property Status
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Podział Według Statusu', 14, yPosition);
    yPosition += 10;

    const statusRows = data.propertyStatus.map(s => [
      s.status,
      s.count.toString(),
      `${s.percentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Liczba', 'Udział %']],
      body: statusRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Cumulative Sales
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprzedaż Skumulowana', 14, yPosition);
    yPosition += 10;

    const salesRows = data.cumulativeSales.map(s => [
      s.month,
      s.monthly.toString(),
      s.cumulative.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Miesiąc', 'Sprzedaż miesięczna', 'Sprzedaż skumulowana']],
      body: salesRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Market Comparison
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Porównanie z Rynkiem', 14, yPosition);
    yPosition += 10;

    const marketRows = data.marketComparison.map(m => [
      m.category,
      formatCurrency(m.myPrice),
      formatCurrency(m.marketAvg)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Kategoria', 'Twoja cena', 'Średnia rynkowa']],
      body: marketRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Raport wygenerowany przez OTO-RAPORT - System analityki nieruchomości',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save PDF
    const filename = `OTO-RAPORT_Analityka_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Nie udało się wygenerować raportu PDF');
  }
}

/**
 * Export analytics data to Excel
 * Generates an Excel workbook with multiple sheets for different data categories
 */
export function exportAnalyticsToExcel(data: AnalyticsData, developerName: string = 'Developer'): void {
  try {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: KPI Summary
    const kpiData = [
      ['OTO-RAPORT - Raport Analityczny', '', ''],
      [`Developer: ${developerName}`, '', ''],
      [`Data: ${new Date().toLocaleDateString('pl-PL')}`, '', ''],
      ['', '', ''],
      ['Wskaźnik', 'Wartość', 'Trend'],
      ['Średnia cena', formatCurrency(data.kpi.averagePrice), `${formatTrend(data.kpi.trends.averagePrice)}%`],
      ['Wskaźnik zajętości', `${data.kpi.occupancyRate.toFixed(1)}%`, `${formatTrend(data.kpi.trends.occupancyRate)}%`],
      ['Średni czas sprzedaży', `${data.kpi.avgDaysToSell} dni`, `${formatTrend(data.kpi.trends.avgDaysToSell)}%`],
      ['Cena za m²', formatCurrency(data.kpi.pricePerM2), `${formatTrend(data.kpi.trends.pricePerM2)}%`]
    ];
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);

    // Set column widths
    wsKPI['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, wsKPI, 'KPI');

    // Sheet 2: Price Trends
    const priceTrendsData = [
      ['Trendy Cenowe', '', ''],
      ['', '', ''],
      ['Miesiąc', 'Średnia cena', 'Cena za m²'],
      ...data.priceTrends.map(pt => [
        pt.month,
        pt.avgPrice,
        pt.avgPricePerM2
      ])
    ];
    const wsPriceTrends = XLSX.utils.aoa_to_sheet(priceTrendsData);
    wsPriceTrends['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsPriceTrends, 'Trendy Cenowe');

    // Sheet 3: Days to Sell
    const daysToSellData = [
      ['Czas Sprzedaży - Rozkład', ''],
      ['', ''],
      ['Przedział czasowy', 'Liczba nieruchomości'],
      ...data.daysToSell.map(d => [d.range, d.count])
    ];
    const wsDaysToSell = XLSX.utils.aoa_to_sheet(daysToSellData);
    wsDaysToSell['!cols'] = [
      { wch: 20 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsDaysToSell, 'Czas Sprzedaży');

    // Sheet 4: Property Status
    const statusData = [
      ['Podział Według Statusu', '', ''],
      ['', '', ''],
      ['Status', 'Liczba', 'Udział %'],
      ...data.propertyStatus.map(s => [
        s.status,
        s.count,
        `${s.percentage.toFixed(1)}%`
      ])
    ];
    const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
    wsStatus['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsStatus, 'Status');

    // Sheet 5: Cumulative Sales
    const salesData = [
      ['Sprzedaż Skumulowana', '', ''],
      ['', '', ''],
      ['Miesiąc', 'Sprzedaż miesięczna', 'Sprzedaż skumulowana'],
      ...data.cumulativeSales.map(s => [
        s.month,
        s.monthly,
        s.cumulative
      ])
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    wsSales['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsSales, 'Sprzedaż');

    // Sheet 6: Market Comparison
    const marketData = [
      ['Porównanie z Rynkiem', '', ''],
      ['', '', ''],
      ['Kategoria', 'Twoja cena', 'Średnia rynkowa'],
      ...data.marketComparison.map(m => [
        m.category,
        m.myPrice,
        m.marketAvg
      ])
    ];
    const wsMarket = XLSX.utils.aoa_to_sheet(marketData);
    wsMarket['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsMarket, 'Rynek');

    // Save Excel file
    const filename = `OTO-RAPORT_Analityka_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Nie udało się wygenerować pliku Excel');
  }
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatTrend(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}
