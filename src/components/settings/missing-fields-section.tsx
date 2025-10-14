'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Loader2, Search, AlertTriangle, Info } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MissingField {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required: boolean
  description?: string
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
  options?: string[] // For select fields
}

interface PropertyWithMissingFields {
  id: string
  property_number: string
  property_type: string
  address: string // Formatted address for display
  missingRequiredFields: MissingField[]
  missingRecommendedFields: MissingField[]
}

interface FieldValue {
  [propertyId: string]: {
    [fieldName: string]: string | number | null
  }
}

export function MissingFieldsSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyWithMissingFields[]>([])
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'required' | 'recommended'>('all')
  const [fieldValues, setFieldValues] = useState<FieldValue>({})

  // Fetch properties with missing fields
  useEffect(() => {
    async function fetchMissingFields() {
      try {
        const response = await fetch('/api/properties/missing-fields')
        const data = await response.json()

        if (data.success && data.properties) {
          setProperties(data.properties)

          // Initialize field values
          const initialValues: FieldValue = {}
          data.properties.forEach((prop: PropertyWithMissingFields) => {
            initialValues[prop.id] = {}
          })
          setFieldValues(initialValues)
        } else {
          toast.error(data.error || 'Nie udało się pobrać danych o brakujących polach')
        }
      } catch (error) {
        console.error('Error fetching missing fields:', error)
        toast.error('Wystąpił błąd podczas pobierania danych')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMissingFields()
  }, [])

  // Filter properties based on search and filter type
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = searchQuery === '' ||
      prop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.property_number.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'required' && prop.missingRequiredFields.length > 0) ||
      (filterType === 'recommended' && prop.missingRecommendedFields.length > 0)

    return matchesSearch && matchesFilter
  })

  // Calculate progress statistics
  const totalProperties = properties.length
  const propertiesWithRequired = properties.filter(p => p.missingRequiredFields.length > 0).length
  const propertiesWithRecommended = properties.filter(p => p.missingRecommendedFields.length > 0).length
  const completeProperties = totalProperties - propertiesWithRequired

  // Handle field value change
  const handleFieldChange = (propertyId: string, fieldName: string, value: string | number) => {
    setFieldValues(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        [fieldName]: value
      }
    }))
  }

  // Save single field
  const handleSaveField = async (propertyId: string, field: MissingField) => {
    const value = fieldValues[propertyId]?.[field.field]

    if (!value && field.required) {
      toast.error(`${field.label} jest wymagane`)
      return
    }

    const savingKey = `${propertyId}-${field.field}`
    setSavingFields(prev => new Set(prev).add(savingKey))

    try {
      const response = await fetch(`/api/properties/${propertyId}/fill`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field.field]: value
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${field.label} zapisane`)

        // Update local state - remove field from missing fields
        setProperties(prev => prev.map(prop => {
          if (prop.id === propertyId) {
            return {
              ...prop,
              missingRequiredFields: prop.missingRequiredFields.filter(f => f.field !== field.field),
              missingRecommendedFields: prop.missingRecommendedFields.filter(f => f.field !== field.field)
            }
          }
          return prop
        }))
      } else {
        toast.error(data.error || 'Nie udało się zapisać pola')
      }
    } catch (error) {
      console.error('Error saving field:', error)
      toast.error('Wystąpił błąd podczas zapisywania')
    } finally {
      setSavingFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(savingKey)
        return newSet
      })
    }
  }

  // Render field input based on type
  const renderFieldInput = (propertyId: string, field: MissingField) => {
    const value = fieldValues[propertyId]?.[field.field] ?? ''
    const savingKey = `${propertyId}-${field.field}`
    const isSaving = savingFields.has(savingKey)

    return (
      <div key={field.field} className="space-y-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor={`${propertyId}-${field.field}`} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-red-500 text-xs">*</span>}
              {!field.required && <span className="text-yellow-600 text-xs">(zalecane)</span>}
              {field.description && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {field.description}
                </span>
              )}
            </Label>

            {field.type === 'select' && field.options ? (
              <Select
                value={value as string}
                onValueChange={(val) => handleFieldChange(propertyId, field.field, val)}
              >
                <SelectTrigger id={`${propertyId}-${field.field}`}>
                  <SelectValue placeholder="Wybierz..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${propertyId}-${field.field}`}
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(propertyId, field.field,
                  field.type === 'number' ? parseFloat(e.target.value) : e.target.value
                )}
                placeholder={`Wprowadź ${field.label.toLowerCase()}`}
                required={field.required}
                {...(field.validation?.pattern && { pattern: field.validation.pattern })}
                {...(field.validation?.min !== undefined && { min: field.validation.min })}
                {...(field.validation?.max !== undefined && { max: field.validation.max })}
                {...(field.validation?.minLength && { minLength: field.validation.minLength })}
                {...(field.validation?.maxLength && { maxLength: field.validation.maxLength })}
              />
            )}

            {field.validation?.pattern && (
              <p className="text-xs text-muted-foreground">
                Format: {getPatternDescription(field.validation.pattern)}
              </p>
            )}
          </div>

          <Button
            onClick={() => handleSaveField(propertyId, field)}
            disabled={isSaving || !value}
            size="sm"
            className="mt-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisuję...
              </>
            ) : (
              'Zapisz'
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uzupełnij brakujące dane</CardTitle>
          <CardDescription>
            Uzupełnij wymagane pola dla zgodności z wymogami ministerstwa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uzupełnij brakujące dane</CardTitle>
        <CardDescription>
          Uzupełnij wymagane i zalecane pola ministerstwa dla swoich nieruchomości
        </CardDescription>

        {/* Progress Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Kompletne</p>
              <p className="text-lg font-bold text-green-600">
                {completeProperties}/{totalProperties}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Wymagane pola</p>
              <p className="text-lg font-bold text-red-600">
                {propertiesWithRequired}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Zalecane pola</p>
              <p className="text-lg font-bold text-yellow-600">
                {propertiesWithRecommended}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po adresie lub numerze nieruchomości..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={(val) => setFilterType(val as typeof filterType)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="required">Tylko wymagane</SelectItem>
              <SelectItem value="recommended">Tylko zalecane</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties List */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Wszystkie dane są kompletne!
            </h3>
            <p className="text-sm text-muted-foreground">
              Twoje nieruchomości mają wszystkie wymagane pola wypełnione.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {filteredProperties.map(property => {
              const hasRequired = property.missingRequiredFields.length > 0
              const hasRecommended = property.missingRecommendedFields.length > 0

              return (
                <AccordionItem
                  key={property.id}
                  value={property.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        {hasRequired ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : hasRecommended ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <div className="text-left">
                          <p className="font-medium">{property.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {property.property_type} • {property.property_number}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasRequired && (
                          <Badge variant="destructive">
                            {property.missingRequiredFields.length} wymagane
                          </Badge>
                        )}
                        {hasRecommended && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            {property.missingRecommendedFields.length} zalecane
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="space-y-4 pt-4">
                    {/* Required Fields */}
                    {property.missingRequiredFields.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Pola wymagane
                        </h4>
                        {property.missingRequiredFields.map(field =>
                          renderFieldInput(property.id, field)
                        )}
                      </div>
                    )}

                    {/* Recommended Fields */}
                    {property.missingRecommendedFields.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-yellow-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Pola zalecane
                        </h4>
                        {property.missingRecommendedFields.map(field =>
                          renderFieldInput(property.id, field)
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to describe validation patterns
function getPatternDescription(pattern: string): string {
  const patterns: Record<string, string> = {
    '\\d{10}': '10 cyfr (np. 1234567890)',
    '\\d{9}|\\d{14}': '9 lub 14 cyfr',
    '[0-9]{2}-[0-9]{3}': 'XX-XXX (np. 00-950)',
    '\\+48\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}': '+48 XXX XXX XXX',
  }

  return patterns[pattern] || 'Sprawdź format'
}
