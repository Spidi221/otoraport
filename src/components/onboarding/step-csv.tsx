'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, FileSpreadsheet, Download, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { type CSVData } from '@/hooks/use-onboarding-wizard';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

interface StepCSVProps {
  data: CSVData;
  onUpdate: (data: Partial<CSVData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepCSV({ data, onUpdate, onNext, onBack, onSkip }: StepCSVProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['text/csv', 'application/csv', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const requiredColumns = [
    'nazwa',
    'pokoje',
    'powierzchnia',
    'cena',
    'status',
  ];

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return 'Nieprawidłowy format pliku. Obsługiwane formaty: CSV';
    }

    if (file.size > maxSize) {
      return 'Plik jest za duży. Maksymalny rozmiar: 10MB';
    }

    return null;
  };

  const parseCSV = (file: File) => {
    setIsUploading(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for required columns
        const headers = results.meta.fields || [];
        const missingColumns = requiredColumns.filter(
          (col) => !headers.some((h) => h.toLowerCase().includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          errors.push(`Brakujące kolumny: ${missingColumns.join(', ')}`);
        }

        // Check data quality
        const data = results.data as any[];
        const rowCount = data.length;

        if (rowCount === 0) {
          errors.push('Plik CSV jest pusty');
        }

        // Check for empty required fields
        let emptyFieldCount = 0;
        data.forEach((row, index) => {
          requiredColumns.forEach((col) => {
            const field = Object.keys(row).find((k) =>
              k.toLowerCase().includes(col.toLowerCase())
            );
            if (field && !row[field]) {
              emptyFieldCount++;
            }
          });
        });

        if (emptyFieldCount > 0) {
          warnings.push(`Znaleziono ${emptyFieldCount} pustych pól w wymaganych kolumnach`);
        }

        onUpdate({
          file,
          parsed_data: data,
          row_count: rowCount,
          errors: errors.length > 0 ? errors : null,
          warnings: warnings.length > 0 ? warnings : null,
        });

        setIsUploading(false);
      },
      error: (error) => {
        setError(`Błąd parsowania CSV: ${error.message}`);
        setIsUploading(false);
      },
    });
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    parseCSV(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onUpdate({
      file: null,
      parsed_data: null,
      row_count: null,
      errors: null,
      warnings: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setError('');
  };

  const handleDownloadSample = () => {
    const sampleCSV = `nazwa,pokoje,powierzchnia,cena,status,pietro,balkon
Apartament Słoneczny 1,2,45.5,450000,dostępny,3,tak
Mieszkanie Parkowe 12,3,67.2,620000,dostępny,5,tak
Studio Centrum 8,1,32.0,320000,zarezerwowane,2,nie
Penthouse Premium,4,120.5,1450000,dostępny,10,tak`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'przyklad-dane-mieszkan.csv';
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasCSV = data.file || data.parsed_data;
  const hasErrors = data.errors && data.errors.length > 0;
  const canProceed = hasCSV && !hasErrors;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prześlij dane nieruchomości
        </h1>
        <p className="text-base text-gray-600">
          Wgraj plik CSV z danymi Twoich mieszkań
        </p>
      </div>

      {/* Help Panel */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Jak przygotować plik CSV?
            </span>
          </div>
          {showHelp ? (
            <ChevronUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600" />
          )}
        </button>

        {showHelp && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h4 className="font-medium text-sm text-blue-900 mb-2">Wymagane kolumny:</h4>
              <div className="bg-white rounded-md p-3 border border-blue-200">
                <div className="grid grid-cols-5 gap-2 text-xs font-mono">
                  {requiredColumns.map((col) => (
                    <div key={col} className="bg-blue-50 px-2 py-1 rounded text-center">
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-blue-900 mb-2">Wskazówki:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Użyj przecinka jako separatora kolumn</li>
                <li>Pierwsza linia powinna zawierać nagłówki</li>
                <li>Pola tekstowe z przecinkami należy ująć w cudzysłów</li>
                <li>Kodowanie pliku: UTF-8</li>
              </ul>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="w-full bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Pobierz przykładowy plik CSV
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-8">
        {!hasCSV ? (
          /* Upload Zone */
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-12 transition-all duration-200',
              'hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer',
              isDragging && 'border-blue-500 bg-blue-50',
              error && 'border-red-300 bg-red-50/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,application/csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <Upload className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <div>
                <p className="text-base font-medium text-gray-700 mb-1">
                  {isUploading
                    ? 'Analizowanie pliku...'
                    : 'Przeciągnij plik CSV tutaj lub kliknij aby wybrać'}
                </p>
                <p className="text-sm text-gray-500">
                  CSV (maksymalnie 10MB)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 w-full">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preview Zone */
          <div className="space-y-6">
            {/* File info */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">{data.file?.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {data.file && formatFileSize(data.file.size)}
                    </p>

                    {data.row_count !== null && (
                      <div className="flex items-center gap-2 mt-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Wykryto {data.row_count} {data.row_count === 1 ? 'mieszkanie' : 'mieszkań'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Errors */}
              {hasErrors && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Znaleziono błędy:</p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    {data.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {data.warnings && data.warnings.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">Ostrzeżenia:</p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    {data.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Change file button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Zmień plik
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,application/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 mt-8 border-t">
          <Button type="button" variant="outline" onClick={onBack}>
            Wstecz
          </Button>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onSkip}>
              Pomiń ten krok
            </Button>

            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className="min-w-[120px]"
            >
              Dalej
            </Button>
          </div>
        </div>
      </Card>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Możesz pominąć ten krok i wgrać dane później w panelu
        </p>
      </div>
    </div>
  );
}
