/**
 * CSV Parser Web Worker
 * Handles CSV/Excel parsing in a separate thread to keep UI responsive
 */

// Import PapaParse from CDN (Web Worker compatible)
importScripts('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');

/**
 * Message types:
 * - PARSE_FILE: Start parsing a file
 * - PARSE_PROGRESS: Parsing progress update
 * - PARSE_COMPLETE: Parsing finished successfully
 * - PARSE_ERROR: Parsing failed
 */

// Store current file info for error reporting
let currentFile = null;

self.onmessage = async function(e) {
  const { type, payload } = e.data;

  if (type === 'PARSE_FILE') {
    try {
      const { file, fileType, fileName } = payload;
      currentFile = { name: fileName || file.name, type: fileType };

      if (fileType === 'csv') {
        parseCSV(file);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        // For Excel files, we need to use xlsx library
        // Since we can't easily import xlsx in worker, we'll parse on main thread
        // and just use worker for CSV
        postMessage({
          type: 'PARSE_ERROR',
          payload: {
            error: 'Excel parsing not supported in Web Worker yet. Upload will use server-side parsing.',
            fileName: currentFile.name
          }
        });
      }
    } catch (error) {
      postMessage({
        type: 'PARSE_ERROR',
        payload: {
          error: error.message || 'Unknown parsing error',
          technicalError: error.message,
          fileName: currentFile?.name || 'unknown'
        }
      });
    }
  }
};

/**
 * Parse CSV file using PapaParse with streaming
 */
function parseCSV(file) {
  let rowCount = 0;
  let validRows = 0;
  const parsedData = [];
  let headers = [];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',

    // Streaming: process row by row
    step: function(row) {
      rowCount++;

      if (rowCount === 1) {
        // First row - capture headers
        headers = Object.keys(row.data);
      }

      // Basic validation: check if row has data
      if (row.data && Object.keys(row.data).length > 0) {
        // Check if property has sold marker ("X" in price fields)
        const priceFields = [
          row.data['cena_za_m2'] || row.data['price_per_m2'] || '',
          row.data['cena_bazowa'] || row.data['base_price'] || '',
          row.data['cena_koncowa'] || row.data['final_price'] || ''
        ];

        const isSold = priceFields.some(field =>
          field === 'X' || field === 'x' || field === '#VALUE!'
        );

        if (!isSold) {
          parsedData.push(row.data);
          validRows++;
        }

        // Send progress update every 100 rows
        if (rowCount % 100 === 0) {
          postMessage({
            type: 'PARSE_PROGRESS',
            payload: {
              rowCount,
              validRows,
              progress: Math.min(95, (rowCount / 1000) * 100) // Estimate progress
            }
          });
        }
      }
    },

    // Parsing complete
    complete: function(results) {
      postMessage({
        type: 'PARSE_COMPLETE',
        payload: {
          data: parsedData,
          totalRows: rowCount,
          validRows: validRows,
          skippedRows: rowCount - validRows,
          headers: headers,
          errors: results.errors || []
        }
      });
    },

    // Error during parsing
    error: function(error) {
      // Categorize error for user-friendly messages
      let userMessage = 'Błąd przetwarzania pliku CSV';
      let errorType = 'UNKNOWN';

      const errorMsg = error.message || error.toString();

      if (errorMsg.includes('delimiter') || errorMsg.includes('separator')) {
        userMessage = 'Nieprawidłowy separator w pliku CSV. Sprawdź czy plik używa przecinka jako separatora.';
        errorType = 'INVALID_DELIMITER';
      } else if (errorMsg.includes('encoding') || errorMsg.includes('charset')) {
        userMessage = 'Problem z kodowaniem pliku. Upewnij się, że plik jest w UTF-8.';
        errorType = 'ENCODING_ERROR';
      } else if (errorMsg.includes('malformed') || errorMsg.includes('invalid')) {
        userMessage = 'Plik zawiera nieprawidłowe dane. Sprawdź format CSV.';
        errorType = 'MALFORMED_DATA';
      } else if (errorMsg.includes('timeout') || errorMsg.includes('memory')) {
        userMessage = 'Plik jest zbyt duży lub przekroczono limit czasu przetwarzania.';
        errorType = 'SIZE_LIMIT';
      }

      postMessage({
        type: 'PARSE_ERROR',
        payload: {
          error: userMessage,
          technicalError: error.message || 'Unknown error',
          errorType: errorType,
          stack: error.stack,
          fileName: currentFile?.name || 'unknown'
        }
      });
    }
  });
}

// Signal worker is ready
postMessage({ type: 'WORKER_READY' });
