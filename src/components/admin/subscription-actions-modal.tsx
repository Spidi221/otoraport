'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, XCircle, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'trialing' | 'past_due';
  mrr: number;
  nextBillingDate: string;
}

interface SubscriptionActionsModalProps {
  subscription: Subscription;
  actionType: 'upgrade-pro' | 'upgrade-enterprise' | 'downgrade-starter' | 'cancel';
  onClose: () => void;
  onConfirm: () => void;
}

const PLAN_PRICES: Record<string, number> = {
  Starter: 99,
  Pro: 299,
  Enterprise: 799,
};

export function SubscriptionActionsModal({
  subscription,
  actionType,
  onClose,
  onConfirm,
}: SubscriptionActionsModalProps) {
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'next_billing'>('immediate');
  const [newPlan, setNewPlan] = useState<string>('');

  const isUpgrade = actionType.includes('upgrade');
  const isDowngrade = actionType === 'downgrade-starter';
  const isCancel = actionType === 'cancel';

  // Determine new plan based on action
  const targetPlan = (() => {
    if (actionType === 'upgrade-pro') return 'Pro';
    if (actionType === 'upgrade-enterprise') return 'Enterprise';
    if (actionType === 'downgrade-starter') return 'Starter';
    return '';
  })();

  // Calculate proration
  const currentPlanPrice = PLAN_PRICES[subscription.plan];
  const newPlanPrice = PLAN_PRICES[targetPlan] || 0;
  const priceDifference = newPlanPrice - currentPlanPrice;
  const daysUntilBilling = Math.floor(
    (new Date(subscription.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const prorationAmount = effectiveDate === 'immediate' ? (priceDifference * daysUntilBilling) / 30 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getIcon = () => {
    if (isUpgrade) return <ArrowUpCircle className="h-12 w-12 text-emerald-600" />;
    if (isDowngrade) return <ArrowDownCircle className="h-12 w-12 text-blue-600" />;
    if (isCancel) return <XCircle className="h-12 w-12 text-red-600" />;
    return null;
  };

  const getTitle = () => {
    if (isUpgrade) return `Upgrade do planu ${targetPlan}`;
    if (isDowngrade) return 'Downgrade do planu Starter';
    if (isCancel) return 'Anulowanie subskrypcji';
    return '';
  };

  const getDescription = () => {
    if (isUpgrade)
      return `Czy na pewno chcesz zmienić plan klienta ${subscription.customerName} na ${targetPlan}?`;
    if (isDowngrade)
      return `Czy na pewno chcesz obniżyć plan klienta ${subscription.customerName} do Starter?`;
    if (isCancel)
      return `Czy na pewno chcesz anulować subskrypcję klienta ${subscription.customerName}?`;
    return '';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {getIcon()}
            <div>
              <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
              <DialogDescription className="text-base mt-2">{getDescription()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Klient:</span>
              <span className="text-sm font-semibold text-gray-900">{subscription.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="text-sm text-gray-900">{subscription.customerEmail}</span>
            </div>
            {subscription.company && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Firma:</span>
                <span className="text-sm text-gray-900">{subscription.company}</span>
              </div>
            )}
          </div>

          {!isCancel && (
            <>
              {/* Plan Change Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Obecny plan</p>
                    <Badge className="mt-1 bg-gray-600">{subscription.plan}</Badge>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {formatCurrency(currentPlanPrice)}/miesiąc
                    </p>
                  </div>
                  <div className="text-3xl text-gray-400">→</div>
                  <div>
                    <p className="text-sm text-gray-600">Nowy plan</p>
                    <Badge className="mt-1 bg-emerald-600">{targetPlan}</Badge>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {formatCurrency(newPlanPrice)}/miesiąc
                    </p>
                  </div>
                </div>

                {/* Effective Date Selector */}
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate" className="text-sm font-semibold text-gray-900">
                    Data wejścia w życie
                  </Label>
                  <Select value={effectiveDate} onValueChange={(value: any) => setEffectiveDate(value)}>
                    <SelectTrigger id="effectiveDate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Natychmiast</SelectItem>
                      <SelectItem value="next_billing">Przy następnym rozliczeniu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Proration Info */}
                {effectiveDate === 'immediate' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-semibold">Proporcjonalne rozliczenie</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Różnica w cenie planu:</span>
                        <span className="font-mono font-semibold">
                          {formatCurrency(Math.abs(priceDifference))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pozostałe dni w okresie rozliczeniowym:</span>
                        <span className="font-mono">{daysUntilBilling} dni</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-bold">
                        <span>{isUpgrade ? 'Do zapłaty dzisiaj:' : 'Zwrot na konto:'}</span>
                        <span
                          className={`font-mono ${
                            isUpgrade ? 'text-emerald-700' : 'text-blue-700'
                          }`}
                        >
                          {formatCurrency(Math.abs(prorationAmount))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {effectiveDate === 'next_billing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Zmiana wejdzie w życie:</strong>{' '}
                      {new Date(subscription.nextBillingDate).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      Klient będzie kontynuował obecny plan do następnej daty rozliczenia.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {isCancel && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Ostrzeżenie</span>
              </div>
              <p className="text-sm text-red-700">
                Anulowanie subskrypcji spowoduje utratę dostępu do premium features po zakończeniu bieżącego
                okresu rozliczeniowego.
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Ostatni dzień dostępu:</span>
                  <span className="font-semibold">
                    {new Date(subscription.nextBillingDate).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Bieżący MRR zostanie utracony:</span>
                  <span className="font-semibold font-mono text-red-700">
                    {formatCurrency(subscription.mrr)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            className={
              isCancel
                ? 'bg-red-600 hover:bg-red-700'
                : isUpgrade
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            {isCancel ? 'Potwierdź anulowanie' : 'Zatwierdź zmianę planu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
