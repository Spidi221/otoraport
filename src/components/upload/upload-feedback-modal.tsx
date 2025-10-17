/**
 * Upload Feedback Modal Component
 * Task #104 - Professional upload success feedback with compliance summary
 *
 * Shows users:
 * - Upload success confirmation
 * - Auto-imported developer fields
 * - Overall compliance score with color coding
 * - Section breakdown (Developer, Location, Pricing, Technical)
 * - Top missing critical fields
 * - CTA to complete data now or later
 */

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, TrendingUp, FileText, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type {
  UploadFeedbackModalProps,
  ValidationResponse,
  MissingFieldSummary,
  DataCompletionBadge,
} from './types'
import {
  getComplianceColor,
  getComplianceBgColor,
  getComplianceLevel,
} from './types'

const BADGE_STORAGE_KEY = 'oto-raport-data-completion-badge'

export function UploadFeedbackModal({
  isOpen,
  onClose,
  uploadData,
  developerId,
  onStartCompletion,
}: UploadFeedbackModalProps) {
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch validation data when modal opens
  useEffect(() => {
    if (isOpen && developerId) {
      fetchValidationData()
    }
  }, [isOpen, developerId])

  const fetchValidationData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/validation/missing-fields?developerId=${developerId}&includeSections=true`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch validation data')
      }

      const data: ValidationResponse = await response.json()
      setValidationData(data)
    } catch (err) {
      console.error('Error fetching validation data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDoLater = () => {
    if (validationData) {
      // Store badge notification in localStorage
      const badgeData: DataCompletionBadge = {
        hasPendingDataCompletion: true,
        timestamp: Date.now(),
        complianceScore: validationData.data.summary.complianceScore,
        fileName: uploadData.fileName,
      }

      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(badgeData))

      // Emit custom event for parent components to listen
      window.dispatchEvent(
        new CustomEvent('data-completion-pending', {
          detail: badgeData,
        })
      )
    }

    onClose()
  }

  const handleCompleteNow = () => {
    onStartCompletion()
    onClose()
  }

  // Get top 10 missing fields sorted by severity and count
  const getTopMissingFields = (): Array<[string, MissingFieldSummary]> => {
    if (!validationData) return []

    const entries = Object.entries(validationData.data.missingFieldsSummary)

    // Sort by: critical first, then by count descending
    return entries
      .sort((a, b) => {
        const [, fieldA] = a
        const [, fieldB] = b

        // Critical fields first
        if (fieldA.severity === 'critical' && fieldB.severity !== 'critical') return -1
        if (fieldA.severity !== 'critical' && fieldB.severity === 'critical') return 1

        // Then by count descending
        return fieldB.count - fieldA.count
      })
      .slice(0, 10)
  }

  const complianceScore = validationData?.data.summary.complianceScore ?? 0
  const complianceLevel = getComplianceLevel(complianceScore)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Success Icon with gradient background */}
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-3 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>

          <DialogTitle className="text-center text-2xl font-bold">
            Upload Successful!
          </DialogTitle>

          <DialogDescription className="text-center text-base">
            {uploadData.validRecords} properties from <strong>{uploadData.fileName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Mapping Summary Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Data Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium truncate" title={uploadData.fileName}>
                    {uploadData.fileName}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Total Records</p>
                  <p className="font-medium">{uploadData.recordsCount}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Valid Properties</p>
                  <p className="font-medium text-green-600">{uploadData.validRecords}</p>
                </div>

                {uploadData.autoImportedFields > 0 && (
                  <div>
                    <p className="text-muted-foreground">Auto-Imported Fields</p>
                    <p className="font-medium text-blue-600">
                      {uploadData.autoImportedFields} fields
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Score Section */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8 space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing data compliance...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Could not load compliance data
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your upload was successful, but we couldn't analyze data completeness.
                      You can check validation status in the dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && validationData && (
            <>
              {/* Overall Compliance Score */}
              <Card className={getComplianceBgColor(complianceScore)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className={`h-5 w-5 ${getComplianceColor(complianceScore)}`} />
                    <h3 className="font-semibold text-lg">Compliance Score</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className={`text-4xl font-bold ${getComplianceColor(complianceScore)}`}>
                          {complianceScore}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {complianceLevel === 'high' && 'Excellent compliance'}
                          {complianceLevel === 'medium' && 'Good - some fields missing'}
                          {complianceLevel === 'low' && 'Needs improvement'}
                        </p>
                      </div>

                      <Badge
                        variant={
                          complianceLevel === 'high'
                            ? 'default'
                            : complianceLevel === 'medium'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {validationData.data.summary.propertiesValid} /{' '}
                        {validationData.data.summary.totalProperties} valid
                      </Badge>
                    </div>

                    <Progress value={complianceScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Section Breakdown */}
              {validationData.data.sectionBreakdown && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-4">Section Completion</h3>

                    <div className="space-y-4">
                      {Object.entries(validationData.data.sectionBreakdown).map(
                        ([sectionKey, section]) => {
                          const sectionName =
                            sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)
                          const percentage = Math.round(section.percentage)

                          return (
                            <div key={sectionKey} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{sectionName} Data</span>
                                <span className="text-muted-foreground">
                                  {percentage}%
                                </span>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                          )
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Fields List */}
              {getTopMissingFields().length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-lg">Missing Critical Fields</h3>
                    </div>

                    <div className="space-y-2">
                      {getTopMissingFields().map(([fieldName, field]) => (
                        <div
                          key={fieldName}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Badge
                              variant={
                                field.severity === 'critical'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="flex-shrink-0"
                            >
                              {field.severity}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {field.fieldLabel}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Missing in {field.count}{' '}
                                {field.count === 1 ? 'property' : 'properties'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-sm font-semibold text-red-600">
                              {field.percentage}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {Object.keys(validationData.data.missingFieldsSummary).length > 10 && (
                      <p className="text-xs text-muted-foreground mt-4 text-center">
                        Showing top 10 of{' '}
                        {Object.keys(validationData.data.missingFieldsSummary).length}{' '}
                        missing fields
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleDoLater}
              className="flex-1"
            >
              I'll Do This Later
            </Button>

            <Button
              onClick={handleCompleteNow}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Missing Fields Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
