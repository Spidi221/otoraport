/**
 * React hook for CSV parsing with Web Worker
 * Prevents UI thread blocking during large file parsing
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ParseProgress {
  rowCount: number;
  validRows: number;
  progress: number; // 0-100
}

export interface ParseResult {
  data: any[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  headers: string[];
  errors: any[];
}

export interface ParseError {
  error: string;
  technicalError?: string;
  errorType?: string;
  stack?: string;
  fileName?: string;
}

export function useCSVParserWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ParseError | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    try {
      const worker = new Worker('/csv-parser.worker.js');
      workerRef.current = worker;

      // Handle messages from worker
      worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data;

        switch (type) {
          case 'WORKER_READY':
            setIsReady(true);
            console.log('[CSV Worker] Ready');
            break;

          case 'PARSE_PROGRESS':
            setProgress(payload);
            console.log('[CSV Worker] Progress:', payload);
            break;

          case 'PARSE_COMPLETE':
            setParsing(false);
            setResult(payload);
            setProgress(null);
            console.log('[CSV Worker] Complete:', payload);
            break;

          case 'PARSE_ERROR':
            setParsing(false);
            setError(payload.error);
            setErrorDetails(payload); // Store full error details for Sentry
            setProgress(null);
            console.error('[CSV Worker] Error:', payload);
            break;

          default:
            console.warn('[CSV Worker] Unknown message type:', type);
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('[CSV Worker] Worker error:', error);
        setError('Worker initialization failed');
        setIsReady(false);
        setParsing(false);
      };

      // Cleanup on unmount
      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.error('[CSV Worker] Failed to create worker:', err);
      setError('Web Worker not supported in this browser');
    }
  }, []);

  // Parse file using worker
  const parseFile = useCallback((file: File) => {
    if (!workerRef.current || !isReady) {
      setError('Worker not ready');
      return;
    }

    // Reset state
    setParsing(true);
    setError(null);
    setErrorDetails(null);
    setResult(null);
    setProgress(null);

    // Determine file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let fileType: 'csv' | 'xlsx' | 'xls' | 'unknown' = 'unknown';

    if (fileExtension === 'csv') {
      fileType = 'csv';
    } else if (fileExtension === 'xlsx') {
      fileType = 'xlsx';
    } else if (fileExtension === 'xls') {
      fileType = 'xls';
    }

    // Send file to worker with filename for error context
    workerRef.current.postMessage({
      type: 'PARSE_FILE',
      payload: {
        file,
        fileType,
        fileName: file.name  // Add filename for error reporting
      }
    });
  }, [isReady]);

  // Reset state
  const reset = useCallback(() => {
    setParsing(false);
    setProgress(null);
    setResult(null);
    setError(null);
    setErrorDetails(null);
  }, []);

  return {
    // State
    isReady,
    parsing,
    progress,
    result,
    error,
    errorDetails,

    // Actions
    parseFile,
    reset
  };
}
