import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useCSVParserWorker } from "@/hooks/use-csv-parser-worker";
import { trackUploadSuccess } from "@/lib/ga4-tracking";

interface UploadResult {
  fileName: string;
  propertiesAdded: number;
}

// Feature flag: Use Web Worker for CSV parsing (prevents UI freezing)
const USE_WEB_WORKER_FOR_CSV = typeof window !== 'undefined' && 'Worker' in window;

export function UploadWidget() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Worker for CSV parsing
  const csvWorker = useCSVParserWorker();

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
  const uploadParsedData = useCallback(async (parsedData: Record<string, unknown>[], validRows: number) => {
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
        throw new Error(data?.error || 'Wystąpił błąd podczas przesyłania');
      }

      setUploadResult({
        fileName: 'parsed-data.csv',
        propertiesAdded: validRows
      });

      // Track successful upload in GA4
      if (data?.data?.trackingData) {
        trackUploadSuccess(
          'parsed-data.csv',
          data.data.trackingData.recordsCount,
          data.data.trackingData.fileType
        );
      }

      setParsingStatus(null);
      csvWorker.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
      setParsingStatus(null);
    } finally {
      setUploading(false);
    }
  }, [csvWorker]);

  // Handle Web Worker parse completion
  useEffect(() => {
    if (csvWorker.result && csvWorker.result.data.length > 0) {
      // Worker finished parsing - now send parsed data to server
      uploadParsedData(csvWorker.result.data, csvWorker.result.validRows);
    }
  }, [csvWorker.result, uploadParsedData]);

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
    setUploadResult(null);
    setParsingStatus(null);

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
        throw new Error(data?.error || 'Wystąpił błąd podczas przesyłania');
      }

      // Simplified result: just filename and count
      const recordsCount = data?.data?.validRecords || data?.data?.recordsCount || 0;
      setUploadResult({
        fileName: file.name,
        propertiesAdded: recordsCount
      });

      // Track successful upload in GA4
      if (data?.data?.trackingData) {
        trackUploadSuccess(
          file.name,
          data.data.trackingData.recordsCount,
          data.data.trackingData.fileType
        );
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

        {uploadResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Dodano <strong>{uploadResult.propertiesAdded}</strong> mieszkań z pliku: {uploadResult.fileName}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}