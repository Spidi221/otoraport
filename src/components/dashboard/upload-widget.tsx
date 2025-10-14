import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useCSVParserWorker } from "@/hooks/use-csv-parser-worker";
import { trackUploadSuccess } from "@/lib/ga4-tracking";
import { trackFileUpload } from "@/lib/analytics-events";

interface UploadResult {
  fileName: string;
  propertiesAdded: number;
  autoImportedFields?: number;
}

interface ValidationError {
  valid: false;
  complianceScore: number;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    propertiesWithErrors: number;
    propertiesWithWarnings: number;
  };
  globalErrors: string[];
  globalWarnings: string[];
  missingCriticalFields: string[];
  rowErrors: Array<{
    rowNumber: number;
    propertyNumber?: string;
    errors: string[];
    warnings: string[];
  }>;
}

// Feature flag: Use Web Worker for CSV parsing (prevents UI freezing)
// TEMPORARY FIX: Disabled to use server-side parser with Polish char fix
const USE_WEB_WORKER_FOR_CSV = false; // typeof window !== 'undefined' && 'Worker' in window;

export function UploadWidget() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Worker for CSV parsing
  const csvWorker = useCSVParserWorker();

  // FIXED: Use ref to prevent duplicate uploads
  const uploadedRef = useRef(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // HOISTED: Define uploadParsedData before useEffect that references it (fixes TDZ)
  // FIXED: Remove csvWorker from dependencies to prevent re-creation
  const uploadParsedData = useCallback(async (parsedData: Record<string, unknown>[], validRows: number) => {
    // FIXED: Guard against duplicate uploads
    if (uploadedRef.current) {
      console.log('[Upload] Skipping duplicate upload attempt');
      return;
    }
    uploadedRef.current = true;

    try {
      setParsingStatus('Uploading to server...');

      const response = await fetch('/api/upload-parsed', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: parsedData,
          validRecords: validRows
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a validation error with detailed report
        if (data?.validation) {
          setValidationError(data.validation);
        } else {
          setError(data?.error || 'Wystąpił błąd podczas przesyłania');
        }
        uploadedRef.current = false; // Reset on error to allow retry
        setParsingStatus(null);
        setUploading(false);
        return;
      }

      const autoImportedFields = data?.data?.autoImportedFields || 0;
      setUploadResult({
        fileName: 'parsed-data.csv',
        propertiesAdded: validRows,
        autoImportedFields: autoImportedFields
      });

      // Track successful upload in GA4 and PostHog
      if (data?.data?.trackingData) {
        trackUploadSuccess(
          'parsed-data.csv',
          data.data.trackingData.recordsCount,
          data.data.trackingData.fileType
        );
        trackFileUpload('parsed-data.csv', data.data.trackingData.recordsCount);
      }

      setParsingStatus(null);
      csvWorker.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
      setParsingStatus(null);
      uploadedRef.current = false; // Reset on error to allow retry
    } finally {
      setUploading(false);
    }
  }, []); // FIXED: Empty deps to prevent re-creation

  // Handle Web Worker parse completion
  // FIXED: Only depend on result, not uploadParsedData
  useEffect(() => {
    if (csvWorker.result && csvWorker.result.data.length > 0) {
      // Worker finished parsing - now send parsed data to server
      uploadParsedData(csvWorker.result.data, csvWorker.result.validRows);
    }
  }, [csvWorker.result]); // FIXED: Removed uploadParsedData dependency

  // Handle Web Worker errors with Sentry logging
  useEffect(() => {
    if (csvWorker.error) {
      setError(csvWorker.error);
      setUploading(false);
      setParsingStatus(null);

      // Log to Sentry in production with detailed context
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        import('@sentry/nextjs').then((Sentry) => {
          const errorDetails: any = csvWorker.errorDetails || {};

          Sentry.captureException(new Error(errorDetails.technicalError || csvWorker.error), {
            level: 'error',
            tags: {
              component: 'upload-widget',
              error_type: errorDetails.errorType || 'csv_parsing_error',
              parsing_method: 'web_worker',
              file_name: errorDetails.fileName || 'unknown'
            },
            extra: {
              userMessage: csvWorker.error,
              technicalError: errorDetails.technicalError,
              errorType: errorDetails.errorType,
              fileName: errorDetails.fileName,
              stack: errorDetails.stack
            }
          });

          console.log('[Sentry] Logged CSV parsing error:', {
            userMessage: csvWorker.error,
            errorType: errorDetails.errorType
          });
        });
      }
    }
  }, [csvWorker.error, csvWorker.errorDetails]);

  // Update parsing status from worker progress
  useEffect(() => {
    if (csvWorker.progress) {
      setParsingStatus(`Parsing: ${csvWorker.progress.validRows} rows (${Math.round(csvWorker.progress.progress)}%)`);
    }
  }, [csvWorker.progress]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setValidationError(null);
    setUploadResult(null);
    setParsingStatus(null);
    uploadedRef.current = false; // FIXED: Reset upload guard for new file

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isCSV = fileExtension === 'csv';

      // Use Web Worker for CSV if available (prevents UI freezing on large files)
      if (isCSV && USE_WEB_WORKER_FOR_CSV && csvWorker.isReady) {
        console.log('[Upload] Using Web Worker for CSV parsing');
        setParsingStatus('Parsing CSV file...');
        csvWorker.parseFile(file);
        // Worker will handle the rest via useEffect hooks above
        return;
      }

      // Fallback: server-side parsing for Excel or if worker unavailable
      console.log('[Upload] Using server-side parsing');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a validation error with detailed report
        if (data?.validation) {
          setValidationError(data.validation);
        } else {
          setError(data?.error || 'Wystąpił błąd podczas przesyłania');
        }
        return;
      }

      // Simplified result: just filename and count
      const recordsCount = data?.data?.validRecords || data?.data?.recordsCount || 0;
      const autoImportedFields = data?.data?.autoImportedFields || 0;
      setUploadResult({
        fileName: file.name,
        propertiesAdded: recordsCount,
        autoImportedFields: autoImportedFields
      });

      // Track successful upload in GA4 and PostHog
      if (data?.data?.trackingData) {
        trackUploadSuccess(
          file.name,
          data.data.trackingData.recordsCount,
          data.data.trackingData.fileType
        );
        trackFileUpload(file.name, data.data.trackingData.recordsCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Download validation report as CSV
  const downloadValidationReport = () => {
    if (!validationError) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `validation-report-${timestamp}.csv`;

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push('=== RAPORT WALIDACJI CSV - OTO-RAPORT ===');
    lines.push(`Data: ${new Date().toLocaleString('pl-PL')}`);
    lines.push(`Wynik zgodności: ${validationError.complianceScore}%`);
    lines.push('');

    // Summary
    lines.push('=== PODSUMOWANIE ===');
    lines.push(`Liczba błędów: ${validationError.summary.totalErrors}`);
    lines.push(`Liczba ostrzeżeń: ${validationError.summary.totalWarnings}`);
    lines.push(`Nieruchomości z błędami: ${validationError.summary.propertiesWithErrors}`);
    lines.push(`Nieruchomości z ostrzeżeniami: ${validationError.summary.propertiesWithWarnings}`);
    lines.push('');

    // Global errors
    if (validationError.globalErrors.length > 0) {
      lines.push('=== BŁĘDY KRYTYCZNE (GLOBALNE) ===');
      validationError.globalErrors.forEach((err, idx) => {
        lines.push(`${idx + 1}. ${err}`);
      });
      lines.push('');
    }

    // Global warnings
    if (validationError.globalWarnings.length > 0) {
      lines.push('=== OSTRZEŻENIA (GLOBALNE) ===');
      validationError.globalWarnings.forEach((warn, idx) => {
        lines.push(`${idx + 1}. ${warn}`);
      });
      lines.push('');
    }

    // Missing critical fields
    if (validationError.missingCriticalFields.length > 0) {
      lines.push('=== BRAKUJĄCE POLA KRYTYCZNE ===');
      validationError.missingCriticalFields.forEach((field, idx) => {
        lines.push(`${idx + 1}. ${field}`);
      });
      lines.push('');
    }

    // Row-level errors
    if (validationError.rowErrors.length > 0) {
      lines.push('=== BŁĘDY W WIERSZACH ===');
      lines.push('Wiersz,Nr lokalu,Błędy,Ostrzeżenia');
      validationError.rowErrors.forEach((rowError) => {
        const propertyNum = rowError.propertyNumber || 'N/A';
        const errors = rowError.errors.join('; ');
        const warnings = rowError.warnings.join('; ');
        lines.push(`${rowError.rowNumber},"${propertyNum}","${errors}","${warnings}"`);
      });
      lines.push('');
    }

    // Recommendations
    lines.push('=== SUGEROWANE DZIAŁANIA ===');
    lines.push('1. Popraw wszystkie błędy krytyczne (czerwone) w pliku CSV');
    lines.push('2. Rozważ uzupełnienie pól zalecanych (żółte ostrzeżenia)');
    lines.push('3. Sprawdź format danych (daty: YYYY-MM-DD, kody pocztowe: XX-XXX, NIP: 10 cyfr)');
    lines.push('4. Wgraj poprawiony plik ponownie do systemu OTO-RAPORT');

    // Create and download CSV file
    const csvContent = lines.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Cennika
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="mx-auto flex max-w-xs flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-3">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm font-medium">
                {uploading
                  ? parsingStatus || "Przesyłanie i przetwarzanie..."
                  : "Przeciągnij plik tutaj lub kliknij aby wybrać"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {uploading
                  ? "Przetwarzanie pliku..."
                  : "CSV lub Excel (XLSX) do 10MB"
                }
              </p>
            </div>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={openFileDialog}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przesyłanie...
                </>
              ) : (
                "Wybierz plik"
              )}
            </Button>
          </div>
        </div>
        
        {/* Upload results */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Validation errors with detailed report */}
        {validationError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-red-900">
                  Walidacja nie powiodła się (zgodność: {validationError.complianceScore}%)
                </h4>
                <p className="text-sm text-red-700">
                  Znaleziono <strong>{validationError.summary.totalErrors}</strong> {validationError.summary.totalErrors === 1 ? 'błąd' : 'błędów'}
                  {validationError.summary.totalWarnings > 0 && (
                    <> i <strong>{validationError.summary.totalWarnings}</strong> {validationError.summary.totalWarnings === 1 ? 'ostrzeżenie' : 'ostrzeżeń'}</>
                  )}
                </p>

                {/* Global errors */}
                {validationError.globalErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-red-900">Błędy krytyczne:</p>
                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                      {validationError.globalErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Row-level errors (first 3) */}
                {validationError.rowErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-red-900">
                      Przykładowe błędy w wierszach (pokazano {Math.min(3, validationError.rowErrors.length)} z {validationError.summary.propertiesWithErrors}):
                    </p>
                    <div className="space-y-2">
                      {validationError.rowErrors.slice(0, 3).map((rowError, idx) => (
                        <div key={idx} className="text-xs bg-white/50 p-2 rounded">
                          <p className="font-medium text-red-800">
                            Wiersz {rowError.rowNumber}{rowError.propertyNumber ? ` (${rowError.propertyNumber})` : ''}:
                          </p>
                          <ul className="mt-1 space-y-0.5 list-disc list-inside text-red-700">
                            {rowError.errors.map((err, errIdx) => (
                              <li key={errIdx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action hint */}
                <div className="mt-3 pt-3 border-t border-red-300 space-y-2">
                  <p className="text-xs text-red-700">
                    💡 <strong>Sugerowane działania:</strong> Popraw błędy w pliku CSV zgodnie z wymogami ministerstwa i wgraj ponownie.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadValidationReport}
                    className="w-full text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz pełny raport walidacji (CSV)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Dodano <strong>{uploadResult.propertiesAdded}</strong> mieszkań z pliku: {uploadResult.fileName}</span>
              </div>
              {uploadResult.autoImportedFields && uploadResult.autoImportedFields > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-700 ml-6">
                  <span>✨ Profil auto-uzupełniony: <strong>{uploadResult.autoImportedFields}</strong> {uploadResult.autoImportedFields === 1 ? 'pole' : uploadResult.autoImportedFields < 5 ? 'pola' : 'pól'}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}