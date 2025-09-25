'use client'

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-muted-foreground',
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Ładowanie...', 
  size = 'md', 
  className 
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6', className)}>
      <LoadingSpinner size={size} />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-md bg-muted', 
        className
      )} 
    />
  );
}

// Skeleton variants for common use cases
export const SkeletonCard = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-6 space-y-4',
      className
    )}>
      {icon && (
        <div className="text-4xl text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
      {action && action}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = 'Wystąpił błąd',
  description = 'Nie udało się załadować danych. Spróbuj ponownie.',
  retry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-6 space-y-4',
      className
    )}>
      <div className="text-4xl">❌</div>
      <div className="space-y-2">
        <h3 className="font-medium text-destructive">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="text-sm text-primary hover:underline"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
}