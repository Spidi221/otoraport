'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Building2, Phone, MapPin, FileText } from 'lucide-react';
import { companyInfoSchema, type CompanyInfo } from '@/hooks/use-onboarding-wizard';
import { cn } from '@/lib/utils';

interface StepWelcomeProps {
  data: CompanyInfo;
  onUpdate: (data: Partial<CompanyInfo>) => void;
  onNext: () => void;
}

export function StepWelcome({ data, onUpdate, onNext }: StepWelcomeProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    onUpdate({ [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: keyof CompanyInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof CompanyInfo) => {
    try {
      companyInfoSchema.pick({ [field]: true }).parse({ [field]: data[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
      return true;
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Nieprawidłowa wartość';
      setErrors((prev) => ({ ...prev, [field]: message }));
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields
    setTouched({
      company_name: true,
      tax_id: true,
      phone: true,
      address: true,
    });

    // Validate all fields
    try {
      companyInfoSchema.parse(data);
      setErrors({});
      onNext();
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  const formatNIP = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XXX-XXX-XX-XX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  };

  const formatPhone = (value: string) => {
    // Remove all non-digits and +
    const cleaned = value.replace(/[^\d+]/g, '');

    // Keep only first + if present
    const hasPlus = cleaned.startsWith('+');
    const digits = cleaned.replace(/\+/g, '');

    // Format as +48 XXX XXX XXX or XXX XXX XXX
    if (hasPlus) {
      if (digits.length <= 2) return `+${digits}`;
      if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
    } else {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Witamy w OTORAPORT! 🎉
        </h1>
        <p className="text-base text-gray-600">
          Zacznijmy od kilku podstawowych informacji o Twojej firmie
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Nazwa firmy <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              type="text"
              placeholder="np. Inwestycje Deweloperskie Sp. z o.o."
              value={data.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              onBlur={() => handleBlur('company_name')}
              className={cn(
                touched.company_name && errors.company_name && 'border-red-500 focus-visible:ring-red-500'
              )}
              autoFocus
            />
            {touched.company_name && errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name}</p>
            )}
          </div>

          {/* NIP */}
          <div className="space-y-2">
            <Label htmlFor="tax_id" className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              NIP <span className="text-gray-400 text-xs font-normal">(opcjonalne)</span>
            </Label>
            <Input
              id="tax_id"
              type="text"
              placeholder="123-456-78-90"
              value={data.tax_id}
              onChange={(e) => handleChange('tax_id', formatNIP(e.target.value))}
              onBlur={() => handleBlur('tax_id')}
              className={cn(
                touched.tax_id && errors.tax_id && 'border-red-500 focus-visible:ring-red-500'
              )}
              maxLength={13} // XXX-XXX-XX-XX
            />
            {touched.tax_id && errors.tax_id && (
              <p className="text-sm text-red-500">{errors.tax_id}</p>
            )}
            <p className="text-xs text-gray-500">Format: XXX-XXX-XX-XX</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Telefon <span className="text-gray-400 text-xs font-normal">(opcjonalne)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+48 123 456 789"
              value={data.phone}
              onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
              onBlur={() => handleBlur('phone')}
              className={cn(
                touched.phone && errors.phone && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {touched.phone && errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500">Format: +48 XXX XXX XXX lub XXX XXX XXX</p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Adres <span className="text-gray-400 text-xs font-normal">(opcjonalne)</span>
            </Label>
            <textarea
              id="address"
              placeholder="ul. Przykładowa 123, 00-001 Warszawa"
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                touched.address && errors.address && 'border-red-500 focus-visible:ring-red-500'
              )}
              rows={3}
            />
            {touched.address && errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="min-w-[120px]">
              Dalej
            </Button>
          </div>
        </form>
      </Card>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Te informacje pomogą nam lepiej dostosować OTORAPORT do Twoich potrzeb
        </p>
      </div>
    </div>
  );
}
