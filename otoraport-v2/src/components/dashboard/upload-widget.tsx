import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { api } from "@/lib/api-client";

interface UploadResult {
  fileName: string;
  propertiesAdded: number;
}

export function UploadWidget() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      // Use API client with automatic cookie handling
      const result = await api.uploadFile(file);

      if (!result.success) {
        throw new Error(result.error || 'Wystąpił błąd podczas przesyłania');
      }

      // Simplified result: just filename and count
      setUploadResult({
        fileName: file.name,
        propertiesAdded: result.data?.validRecords || result.data?.recordsCount || 0
      });
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
                  ? "Przesyłanie i przetwarzanie..."
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
              className="w-full" 
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