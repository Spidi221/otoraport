'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes: Record<string, string[]>
  maxSize?: number
}

export default function FileUpload({ 
  onFileSelect, 
  acceptedTypes = {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/xml': ['.xml'],
    'application/xml': ['.xml']
  },
  maxSize = 10 * 1024 * 1024 // 10MB
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setUploadMessage(`Plik jest za duży. Maksymalny rozmiar: ${maxSize / 1024 / 1024}MB`)
      } else {
        setUploadMessage('Nieobsługiwany format pliku. Obsługujemy: CSV, Excel (.xlsx, .xls), XML')
      }
      setUploadStatus('error')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadStatus('uploading')
      setUploadMessage(`Przesyłanie pliku: ${file.name}`)
      
      // Simulate upload process
      setTimeout(() => {
        onFileSelect(file)
        setUploadStatus('success')
        setUploadMessage(`Plik ${file.name} został pomyślnie przesłany`)
      }, 1500)
    }
  }, [onFileSelect, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: false
  })

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )
      case 'success':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        )
    }
  }

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'border-green-300 bg-green-50'
      case 'error':
        return 'border-red-300 bg-red-50'
      case 'uploading':
        return 'border-blue-300 bg-blue-50'
      default:
        return isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-gray-400 ${getStatusColor()}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center">
          {getStatusIcon()}
          
          <div className="mt-4">
            {uploadStatus === 'idle' && (
              <>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive 
                    ? 'Upuść plik tutaj...' 
                    : 'Przeciągnij plik lub kliknij aby wybrać'
                  }
                </p>
                <p className="text-gray-600 mb-4">
                  Obsługujemy pliki: CSV, Excel (.xlsx, .xls), XML
                </p>
                <p className="text-sm text-gray-500">
                  Maksymalny rozmiar: {maxSize / 1024 / 1024}MB
                </p>
              </>
            )}
            
            {uploadStatus !== 'idle' && (
              <p className={`text-lg font-medium ${
                uploadStatus === 'success' ? 'text-green-800' : 
                uploadStatus === 'error' ? 'text-red-800' : 
                'text-blue-800'
              }`}>
                {uploadMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {uploadStatus === 'success' && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              setUploadStatus('idle')
              setUploadMessage('')
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Prześlij kolejny plik
          </button>
        </div>
      )}
    </div>
  )
}