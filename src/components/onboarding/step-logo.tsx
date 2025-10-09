'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { type LogoData } from '@/hooks/use-onboarding-wizard';
import { cn } from '@/lib/utils';

interface StepLogoProps {
  data: LogoData;
  onUpdate: (data: Partial<LogoData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepLogo({ data, onUpdate, onNext, onBack, onSkip }: StepLogoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Nieprawidłowy format pliku. Obsługiwane formaty: PNG, JPG, SVG';
    }

    if (file.size > maxSize) {
      return 'Plik jest za duży. Maksymalny rozmiar: 2MB';
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    onUpdate({
      file,
      preview: previewUrl,
      url: null, // Will be set after upload
    });
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
    if (data.preview) {
      URL.revokeObjectURL(data.preview);
    }

    onUpdate({
      file: null,
      preview: null,
      url: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setError('');
  };

  const handleNext = async () => {
    // If logo was uploaded, simulate upload to storage
    if (data.file) {
      // In real implementation, upload to Supabase storage here
      // For now, just use the preview URL
      onUpdate({ url: data.preview });
    }

    onNext();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasLogo = data.file || data.preview;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dodaj logo swojej firmy
        </h1>
        <p className="text-base text-gray-600">
          Logo będzie wyświetlane na Twojej publicznej stronie z ofertami
        </p>
      </div>

      <Card className="p-8">
        {!hasLogo ? (
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
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>

              <div>
                <p className="text-base font-medium text-gray-700 mb-1">
                  Przeciągnij logo tutaj lub kliknij aby wybrać
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, SVG (maksymalnie 2MB)
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
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 flex flex-col items-center">
              {/* Logo preview */}
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden mb-4">
                {data.preview ? (
                  <img
                    src={data.preview}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                )}
              </div>

              {/* File info */}
              {data.file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileImage className="w-4 h-4" />
                  <span className="font-medium">{data.file.name}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatFileSize(data.file.size)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Zmień
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-2" />
                Usuń
              </Button>
            </div>
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

            <Button type="button" onClick={handleNext} className="min-w-[120px]">
              Dalej
            </Button>
          </div>
        </div>
      </Card>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Możesz pominąć ten krok i dodać logo później w ustawieniach
        </p>
      </div>
    </div>
  );
}
