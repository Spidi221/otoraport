'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { type CSVData } from '@/hooks/use-onboarding-wizard';
import { cn } from '@/lib/utils';

interface StepVerificationProps {
  data: CSVData;
  onNext: () => void;
  onBack: () => void;
}

export function StepVerification({ data, onNext, onBack }: StepVerificationProps) {
  const [showAll, setShowAll] = useState(false);

  const parsedData = data.parsed_data || [];
  const totalRows = parsedData.length;
  const displayRows = showAll ? parsedData : parsedData.slice(0, 10);

  // Calculate statistics
  const validRows = parsedData.filter((row) => {
    // Check if required fields are present and non-empty
    const requiredFields = ['nazwa', 'pokoje', 'powierzchnia', 'cena', 'status'];
    return requiredFields.every((field) => {
      const key = Object.keys(row).find((k) =>
        k.toLowerCase().includes(field.toLowerCase())
      );
      return key && row[key];
    });
  });

  const validCount = validRows.length;
  const errorCount = totalRows - validCount;

  // Get column headers
  const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  const displayHeaders = headers.slice(0, 6); // Show first 6 columns

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Zweryfikuj swoje dane
        </h1>
        <p className="text-base text-gray-600">
          Sprawdź czy wszystko wygląda dobrze
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wszystkich mieszkań</p>
              <p className="text-2xl font-bold text-gray-900">{totalRows}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Poprawnych</p>
              <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                {validCount}
                <CheckCircle className="w-5 h-5" />
              </p>
            </div>

            {errorCount > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Z błędami</p>
                <p className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                  {errorCount}
                  <AlertTriangle className="w-5 h-5" />
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Ostrzeżenia:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              {data.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Podgląd danych
          </h2>
          {totalRows > 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Pokaż mniej' : `Zobacz wszystkie (${totalRows})`}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 text-center">#</TableHead>
                {displayHeaders.map((header) => (
                  <TableHead key={header} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => {
                // Check if row has errors
                const requiredFields = ['nazwa', 'pokoje', 'powierzchnia', 'cena', 'status'];
                const hasError = requiredFields.some((field) => {
                  const key = Object.keys(row).find((k) =>
                    k.toLowerCase().includes(field.toLowerCase())
                  );
                  return !key || !row[key];
                });

                return (
                  <TableRow
                    key={index}
                    className={cn(
                      hasError && 'bg-red-50 hover:bg-red-100'
                    )}
                  >
                    <TableCell className="text-center text-sm text-gray-500">
                      {index + 1}
                    </TableCell>
                    {displayHeaders.map((header) => {
                      const value = row[header];
                      const isEmpty = !value || String(value).trim() === '';

                      return (
                        <TableCell
                          key={header}
                          className={cn(
                            'text-sm',
                            isEmpty && 'bg-red-100 text-red-600 font-medium'
                          )}
                        >
                          {isEmpty ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Brak
                            </span>
                          ) : (
                            String(value)
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        {errorCount > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded border border-red-200" />
              <span className="text-gray-600">Pole z błędem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 rounded border border-red-200" />
              <span className="text-gray-600">Wiersz z błędami</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t">
          <Button type="button" variant="outline" onClick={onBack}>
            Popraw plik
          </Button>

          <Button
            type="button"
            onClick={onNext}
            className="min-w-[120px]"
          >
            {errorCount > 0 ? 'Kontynuuj mimo błędów' : 'Dalej'}
          </Button>
        </div>
      </Card>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          {errorCount > 0
            ? 'Możesz kontynuować i poprawić błędy później, lub wrócić i poprawić plik CSV'
            : 'Dane wyglądają poprawnie! Możesz przejść do następnego kroku'}
        </p>
      </div>
    </div>
  );
}
