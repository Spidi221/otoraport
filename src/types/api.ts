// API Response Types with strict typing

export interface BaseApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Property types
export interface PropertyData {
  readonly id: string;
  readonly property_number: string;
  readonly property_type: 'apartment' | 'house' | 'commercial' | 'other';
  readonly area: number | null; // CRITICAL: Allow null for sold properties without area data
  readonly price_per_m2: number;
  readonly total_price: number;
  readonly status: 'available' | 'reserved' | 'sold';
  readonly floor?: number;
  readonly rooms?: number;
  readonly building_number?: string;
  readonly project_id?: string;
  readonly project_name?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PropertyCreateData {
  property_number: string;
  property_type: PropertyData['property_type'];
  area: number;
  price_per_m2: number;
  total_price: number;
  status: PropertyData['status'];
  floor?: number;
  rooms?: number;
  building_number?: string;
  project_id?: string;
}

// Dashboard stats with strict typing
export interface DashboardStats {
  readonly projects: {
    readonly total: number;
    readonly active: number;
  };
  readonly properties: {
    readonly total: number;
    readonly available: number;
    readonly reserved: number;
    readonly sold: number;
    readonly recent: number;
  };
  readonly compliance: {
    readonly isCompliant: boolean;
    readonly xmlUrl: string | null;
    readonly mdUrl: string | null;
    readonly lastUpdate: string | null;
    readonly nextDeadline: string | null;
  };
  readonly subscription: {
    readonly plan: 'trial' | 'basic' | 'pro' | 'enterprise';
    readonly status: 'active' | 'cancelled' | 'expired' | 'trial';
    readonly isActive: boolean;
    readonly endDate: string | null;
    readonly daysRemaining: number;
  };
}

// File upload types
export interface FileUploadResponse extends BaseApiResponse {
  data: {
    fileId: string;
    fileName: string;
    processedCount: number;
    warnings: string[];
    errors: string[];
  };
}

export interface BulkOperationResult {
  readonly total: number;
  readonly processed: number;
  readonly failed: number;
  readonly errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  readonly warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// User and session types
export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly company_name?: string;
  readonly nip?: string;
  readonly phone?: string;
  readonly subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
  readonly subscription_end_date?: string;
  readonly ministry_approved: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly image?: string;
}

// Error types
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly userMessage: string;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly timestamp: string;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

// Form types
export interface FormState<T = unknown> {
  readonly data: T;
  readonly errors: ValidationError[];
  readonly isSubmitting: boolean;
  readonly isValid: boolean;
}

// Common utility types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Type guards
export function isApiSuccess<T>(response: BaseApiResponse<T>): response is BaseApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isApiError(response: BaseApiResponse): response is BaseApiResponse & { success: false; error: string } {
  return response.success === false;
}

export function isDashboardStats(data: unknown): data is DashboardStats {
  return (
    typeof data === 'object' &&
    data !== null &&
    'projects' in data &&
    'properties' in data &&
    'compliance' in data &&
    'subscription' in data
  );
}

export function isPropertyData(data: unknown): data is PropertyData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'property_number' in data &&
    'area' in data &&
    'price_per_m2' in data &&
    'total_price' in data
  );
}

// Constants for better type safety
export const PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'other'] as const;
export const PROPERTY_STATUSES = ['available', 'reserved', 'sold'] as const;
export const SUBSCRIPTION_PLANS = ['trial', 'basic', 'pro', 'enterprise'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'expired', 'trial'] as const;

export type PropertyType = typeof PROPERTY_TYPES[number];
export type PropertyStatus = typeof PROPERTY_STATUSES[number];
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];