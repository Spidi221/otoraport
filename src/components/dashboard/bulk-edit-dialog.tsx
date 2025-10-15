'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Edit3,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MapPin,
  Hash,
  Building,
  Mail,
  Calendar,
  Loader2,
} from 'lucide-react'
import type { ValidationMissingFieldsResponse } from '@/lib/api-schemas'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validationData: ValidationMissingFieldsResponse['data'] | null
  onSuccess: () => void
}

// Field mapping for database columns
const FIELD_DB_MAPPING: Record<string, string> = {
  'kod_pocztowy': 'kod_pocztowy',
  'ulica': 'ulica',
  'miejscowosc': 'miejscowosc',
  'numer_nieruchomosci': 'numer_nieruchomosci',
  'wojewodztwo': 'wojewodztwo',
  'powiat': 'powiat',
  'gmina': 'gmina',
  'liczba_pokoi': 'liczba_pokoi',
  'kondygnacja': 'kondygnacja',
  'construction_year': 'construction_year',
}

// Field type mapping for input rendering
const FIELD_TYPE_MAPPING: Record<string, 'text' | 'number' | 'postal' | 'date'> = {
  'kod_pocztowy': 'postal',
  'ulica': 'text',
  'miejscowosc': 'text',
  'numer_nieruchomosci': 'text',
  'wojewodztwo': 'text',
  'powiat': 'text',
  'gmina': 'text',
  'liczba_pokoi': 'number',
  'kondygnacja': 'number',
  'construction_year': 'number',
}

// Field icons
const FIELD_ICONS: Record<string, React.ReactNode> = {
  'kod_pocztowy': <Hash className="h-4 w-4" />,
  'ulica': <MapPin className="h-4 w-4" />,
  'miejscowosc': <MapPin className="h-4 w-4" />,
  'numer_nieruchomosci': <Building className="h-4 w-4" />,
  'wojewodztwo': <MapPin className="h-4 w-4" />,
  'powiat': <MapPin className="h-4 w-4" />,
  'gmina': <MapPin className="h-4 w-4" />,
  'liczba_pokoi': <Building className="h-4 w-4" />,
  'kondygnacja': <Building className="h-4 w-4" />,
  'construction_year': <Calendar className="h-4 w-4" />,
}

export function BulkEditDialog({
  open,
  onOpenChange,
  validationData,
  onSuccess,
}: BulkEditDialogProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [newValue, setNewValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  // Reset dialog state
  const resetDialog = () => {
    setCurrentStep(1)
    setSelectedField(null)
    setSelectedProperties(new Set())
    setNewValue('')
    setInputError(null)
  }

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      resetDialog()
    }
    onOpenChange(newOpen)
  }

  // Validate postal code format (XX-XXX)
  const validatePostalCode = (value: string): boolean => {
    const postalRegex = /^\d{2}-\d{3}$/
    return postalRegex.test(value)
  }

  // Validate input based on field type
  const validateInput = (value: string): boolean => {
    if (!selectedField) return false
    if (!value.trim()) {
      setInputError('To pole jest wymagane')
      return false
    }

    const fieldType = FIELD_TYPE_MAPPING[selectedField]

    if (fieldType === 'postal') {
      if (!validatePostalCode(value)) {
        setInputError('Format: XX-XXX (np. 84-230)')
        return false
      }
    }

    if (fieldType === 'number') {
      const num = parseFloat(value)
      if (isNaN(num)) {
        setInputError('Wartość musi być liczbą')
        return false
      }
    }

    setInputError(null)
    return true
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!validateInput(newValue)) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/properties/bulk-edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: Array.from(selectedProperties),
          field: FIELD_DB_MAPPING[selectedField!],
          value: newValue.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Nie udało się zaktualizować nieruchomości')
      }

      // Success
      toast.success(`Zaktualizowano ${selectedProperties.size} ${selectedProperties.size === 1 ? 'nieruchomość' : 'nieruchomości'}`)
      onSuccess()
      handleOpenChange(false)
    } catch (error) {
      console.error('Bulk edit error:', error)
      toast.error(error instanceof Error ? error.message : 'Nie udało się zaktualizować nieruchomości')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get properties missing the selected field
  const getPropertiesForField = () => {
    if (!selectedField || !validationData) return []

    return validationData.properties.filter((property) =>
      property.missingRequired.includes(selectedField) ||
      property.missingRecommended.includes(selectedField)
    )
  }

  // Step 1: Select field
  const renderStep1 = () => {
    if (!validationData) return null

    const sortedFields = Object.entries(validationData.missingFieldsSummary)
      .sort((a, b) => {
        // Sort by: critical first, then by count (most missing first)
        if (a[1].severity === 'critical' && b[1].severity !== 'critical') return -1
        if (a[1].severity !== 'critical' && b[1].severity === 'critical') return 1
        return b[1].count - a[1].count
      })

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wybierz pole, które chcesz uzupełnić dla wielu nieruchomości jednocześnie
        </p>

        <RadioGroup
          value={selectedField || ''}
          onValueChange={setSelectedField}
          className="space-y-2"
        >
          {sortedFields.map(([fieldKey, fieldData]) => (
            <label
              key={fieldKey}
              htmlFor={`field-${fieldKey}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-accent/50 cursor-pointer transition-all"
            >
              <RadioGroupItem
                id={`field-${fieldKey}`}
                value={fieldKey}
                className="mt-0"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {FIELD_ICONS[fieldKey] || <Mail className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{fieldData.fieldLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Brakuje w {fieldData.count} {fieldData.count === 1 ? 'nieruchomości' : 'nieruchomościach'}
                  {' '}({fieldData.percentage.toFixed(1)}%)
                </p>
              </div>
              <Badge
                variant={fieldData.severity === 'critical' ? 'destructive' : 'secondary'}
                className={
                  fieldData.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : fieldData.severity === 'info'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : ''
                }
              >
                {fieldData.severity === 'critical'
                  ? 'Krytyczne'
                  : fieldData.severity === 'warning'
                  ? 'Ostrzeżenie'
                  : 'Info'}
              </Badge>
            </label>
          ))}
        </RadioGroup>
      </div>
    )
  }

  // Step 2: Select properties
  const renderStep2 = () => {
    const properties = getPropertiesForField()

    const handleSelectAll = () => {
      setSelectedProperties(new Set(properties.map((p) => p.id)))
    }

    const handleDeselectAll = () => {
      setSelectedProperties(new Set())
    }

    const handleToggleProperty = (propertyId: string) => {
      const newSet = new Set(selectedProperties)
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId)
      } else {
        newSet.add(propertyId)
      }
      setSelectedProperties(newSet)
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Zaznacz nieruchomości, dla których chcesz uzupełnić pole:{' '}
            <span className="font-semibold text-foreground">
              {validationData?.missingFieldsSummary[selectedField!]?.fieldLabel}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedProperties.size === properties.length}
          >
            Zaznacz wszystkie
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={selectedProperties.size === 0}
          >
            Odznacz wszystkie
          </Button>
        </div>

        <Separator />

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Brak nieruchomości z brakującym tym polem</p>
            </div>
          ) : (
            properties.map((property) => (
              <label
                key={property.id}
                htmlFor={`property-${property.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-accent/50 cursor-pointer transition-all"
              >
                <Checkbox
                  id={`property-${property.id}`}
                  checked={selectedProperties.has(property.id)}
                  onCheckedChange={() => handleToggleProperty(property.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{property.propertyNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{property.address}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-blue-900">
            Zaznaczono: {selectedProperties.size} / {properties.length}
          </p>
        </div>
      </div>
    )
  }

  // Step 3: Enter value
  const renderStep3 = () => {
    const fieldType = selectedField ? FIELD_TYPE_MAPPING[selectedField] : 'text'
    const fieldLabel = validationData?.missingFieldsSummary[selectedField!]?.fieldLabel || ''

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewValue(e.target.value)
      setInputError(null)
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wprowadź nową wartość dla pola:{' '}
          <span className="font-semibold text-foreground">{fieldLabel}</span>
        </p>

        <div className="space-y-2">
          <Label htmlFor="new-value">Nowa wartość</Label>
          <Input
            id="new-value"
            type={fieldType === 'number' ? 'number' : 'text'}
            placeholder={
              fieldType === 'postal'
                ? 'XX-XXX (np. 84-230)'
                : fieldType === 'number'
                ? 'Wpisz liczbę'
                : 'Wpisz wartość'
            }
            value={newValue}
            onChange={handleValueChange}
            className={inputError ? 'border-destructive' : ''}
            disabled={isSubmitting}
            autoFocus
          />
          {inputError && (
            <p className="text-xs text-destructive">{inputError}</p>
          )}
          {fieldType === 'postal' && !inputError && (
            <p className="text-xs text-muted-foreground">Format: XX-XXX (dwie cyfry, myślnik, trzy cyfry)</p>
          )}
        </div>

        <Separator />

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                {selectedProperties.size}{' '}
                {selectedProperties.size === 1 ? 'nieruchomość zostanie zaktualizowana' : 'nieruchomości zostanie zaktualizowanych'}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Pole "{fieldLabel}" zostanie ustawione na wartość: {newValue || '(pusta)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Wybierz pole'
      case 2:
        return 'Wybierz nieruchomości'
      case 3:
        return 'Wprowadź wartość'
    }
  }

  // Can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedField !== null
      case 2:
        return selectedProperties.size > 0
      case 3:
        return newValue.trim() !== '' && !inputError
      default:
        return false
    }
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep === 3) {
      handleSubmit()
    } else {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)
    }
  }

  // Handle back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
      setInputError(null)
    }
  }

  // Empty state
  if (!validationData || Object.keys(validationData.missingFieldsSummary).length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Brak brakujących pól
            </DialogTitle>
            <DialogDescription>
              Wszystkie nieruchomości zawierają kompletne dane. Nie ma nic do edycji zbiorczej.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edycja zbiorcza brakujących pól
          </DialogTitle>
          <DialogDescription>
            Uzupełnij brakujące pola dla wielu nieruchomości jednocześnie
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-all ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 w-16 mx-2 rounded-full transition-all ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Krok {currentStep} z 3: {getStepTitle()}
          </p>
        </div>

        <Separator />

        {/* Step content */}
        <div className="py-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4" />
            Wstecz
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : currentStep === 3 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Zapisz zmiany
              </>
            ) : (
              <>
                Dalej
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
