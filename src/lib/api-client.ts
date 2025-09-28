/**
 * API Client with automatic cookie handling for Supabase auth
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Authenticated fetch that includes cookies automatically
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 🔑 CRITICAL for Supabase auth cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Handle non-JSON responses
    const contentType = response.headers.get('Content-Type') || ''
    let data

    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      console.error(`API Error [${response.status}]:`, data)
      return {
        success: false,
        error: data?.error || data?.message || `HTTP ${response.status}`,
        data
      }
    }

    return {
      success: true,
      data: data?.data || data,
      message: data?.message
    }
  } catch (error) {
    console.error('API Fetch Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Upload file with cookies
 */
export async function apiUpload(
  url: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<ApiResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include', // 🔑 CRITICAL for auth cookies
      body: formData,
      // Don't set Content-Type - let browser set it with boundary for FormData
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`Upload Error [${response.status}]:`, data)
      return {
        success: false,
        error: data?.error || `Upload failed: ${response.status}`,
        data
      }
    }

    return {
      success: true,
      data: data?.data || data,
      message: data?.message
    }
  } catch (error) {
    console.error('Upload Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Common API endpoints
 */
export const api = {
  // Dashboard
  getDashboardStats: () => apiFetch('/api/dashboard/stats'),
  getProperties: () => apiFetch('/api/properties'),
  getUserProfile: () => apiFetch('/api/user/profile'),

  // Analytics
  getAnalyticsDashboard: () => apiFetch('/api/analytics/dashboard'),
  getAnalyticsPredictions: () => apiFetch('/api/analytics/predictions'),

  // Upload
  uploadFile: (file: File) => apiUpload('/api/upload', file),

  // Presentation
  deployPresentation: () => apiFetch('/api/presentation/deploy', { method: 'POST' }),

  // Admin
  getAdminStats: () => apiFetch('/api/admin?action=stats'),
  getAdminDevelopers: () => apiFetch('/api/admin?action=developers&limit=10'),
  getAdminLogs: () => apiFetch('/api/admin?action=logs&limit=20'),
}

export default api