export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
}

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'vercel';
  endpoints: {
    static: string;
    api: string;
    images: string;
  };
  caching: {
    static_ttl: number; // seconds
    api_ttl: number;
    browser_ttl: number;
  };
}

export interface CacheStrategy {
  key: string;
  ttl: number; // Time to live in seconds
  strategy: 'swr' | 'cache-first' | 'network-first' | 'no-cache';
  invalidation_tags?: string[];
}

export class PerformanceOptimizer {

  // Performance Monitoring
  static async measureWebVitals(): Promise<PerformanceMetrics | null> {
    if (typeof window === 'undefined') return null;

    return new Promise((resolve) => {
      // Use Web Vitals API
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

        // Use Performance Observer for LCP, CLS, FID
        let lcp = 0;
        let cls = 0;
        let fid = 0;

        if ('PerformanceObserver' in window) {
          // LCP Observer
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS Observer
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });

          // FID Observer
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              fid = (entry as any).processingStart - entry.startTime;
            }
          }).observe({ entryTypes: ['first-input'] });
        }

        // Calculate metrics
        const metrics: PerformanceMetrics = {
          fcp,
          lcp,
          cls,
          fid,
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart
        };

        // Wait a bit for observers to fire
        setTimeout(() => {
          metrics.lcp = lcp || metrics.lcp;
          metrics.cls = cls || metrics.cls;
          metrics.fid = fid || metrics.fid;
          resolve(metrics);
        }, 2000);

      } else {
        resolve(null);
      }
    });
  }

  // Report metrics to analytics
  static async reportMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Error reporting performance metrics:', error);
    }
  }

  // Image Optimization
  static getOptimizedImageUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): string {
    if (!src) return '';

    // If already optimized URL, return as is
    if (src.includes('/_next/image') || src.includes('cloudinary') || src.includes('imagekit')) {
      return src;
    }

    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);

    return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  // Lazy Loading Helper
  static setupLazyLoading(): void {
    if (typeof window === 'undefined') return;

    const lazyImages = document.querySelectorAll('img[data-lazy]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.lazy;
            if (src) {
              img.src = src;
              img.removeAttribute('data-lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      lazyImages.forEach(img => {
        const src = (img as HTMLImageElement).dataset.lazy;
        if (src) {
          (img as HTMLImageElement).src = src;
        }
      });
    }
  }

  // Resource Prefetching
  static prefetchResource(href: string, type: 'script' | 'style' | 'image' | 'fetch'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    if (type === 'script') link.as = 'script';
    else if (type === 'style') link.as = 'style';
    else if (type === 'image') link.as = 'image';
    else if (type === 'fetch') link.as = 'fetch';

    document.head.appendChild(link);
  }

  // Critical CSS Inlining
  static inlineCriticalCSS(css: string): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }

  // Bundle Analysis
  static async analyzeBundleSize(): Promise<{
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{ name: string; size: number; gzipped: number }>;
  } | null> {
    try {
      const response = await fetch('/_next/static/chunks/webpack-runtime.js');
      if (!response.ok) return null;

      // This would integrate with webpack-bundle-analyzer in a real implementation
      // For now, return mock data
      return {
        totalSize: 1024 * 1024 * 2.5, // 2.5MB
        gzippedSize: 1024 * 1024 * 0.8, // 800KB
        chunks: [
          { name: 'main', size: 1024 * 500, gzipped: 1024 * 150 },
          { name: 'vendor', size: 1024 * 800, gzipped: 1024 * 240 },
          { name: 'commons', size: 1024 * 300, gzipped: 1024 * 90 }
        ]
      };
    } catch (error) {
      console.error('Error analyzing bundle:', error);
      return null;
    }
  }
}

export class CacheManager {
  private static strategies = new Map<string, CacheStrategy>();

  // Register cache strategy
  static registerStrategy(strategy: CacheStrategy): void {
    this.strategies.set(strategy.key, strategy);
  }

  // Get cached data with strategy
  static async getCached<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    customStrategy?: Partial<CacheStrategy>
  ): Promise<T> {
    const strategy = customStrategy
      ? { ...this.strategies.get(key), ...customStrategy }
      : this.strategies.get(key);

    if (!strategy) {
      return fetchFunction();
    }

    const cacheKey = `cache_${key}`;
    const timestampKey = `cache_${key}_timestamp`;

    // Check if we have cached data
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);

    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp);
      const isExpired = age > strategy.ttl * 1000;

      switch (strategy.strategy) {
        case 'cache-first':
          if (!isExpired) {
            return JSON.parse(cachedData);
          }
          break;

        case 'swr': // Stale While Revalidate
          if (!isExpired) {
            return JSON.parse(cachedData);
          } else {
            // Return stale data immediately, fetch fresh in background
            this.fetchAndCache(key, fetchFunction, strategy);
            return JSON.parse(cachedData);
          }

        case 'network-first':
          try {
            const freshData = await fetchFunction();
            this.setCached(key, freshData, strategy);
            return freshData;
          } catch (error) {
            // Network failed, return cached if available
            if (!isExpired) {
              return JSON.parse(cachedData);
            }
            throw error;
          }

        case 'no-cache':
          return fetchFunction();
      }
    }

    // No cached data or cache-first with expired data
    const freshData = await fetchFunction();
    this.setCached(key, freshData, strategy);
    return freshData;
  }

  // Set cached data
  private static setCached<T>(key: string, data: T, strategy: CacheStrategy): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
      localStorage.setItem(`cache_${key}_timestamp`, Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  // Fetch and cache in background
  private static async fetchAndCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    strategy: CacheStrategy
  ): Promise<void> {
    try {
      const freshData = await fetchFunction();
      this.setCached(key, freshData, strategy);
    } catch (error) {
      console.warn('Background fetch failed:', error);
    }
  }

  // Invalidate cache
  static invalidate(key: string): void {
    localStorage.removeItem(`cache_${key}`);
    localStorage.removeItem(`cache_${key}_timestamp`);
  }

  // Invalidate by tags
  static invalidateByTags(tags: string[]): void {
    for (const [key, strategy] of this.strategies.entries()) {
      if (strategy.invalidation_tags?.some(tag => tags.includes(tag))) {
        this.invalidate(key);
      }
    }
  }

  // Clear all cache
  static clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export class CDNManager {
  private static config: CDNConfig = {
    enabled: process.env.NODE_ENV === 'production',
    provider: 'vercel',
    endpoints: {
      static: process.env.CDN_STATIC_URL || '',
      api: process.env.CDN_API_URL || '',
      images: process.env.CDN_IMAGES_URL || ''
    },
    caching: {
      static_ttl: 31536000, // 1 year
      api_ttl: 300, // 5 minutes
      browser_ttl: 86400 // 1 day
    }
  };

  // Get CDN URL for static assets
  static getStaticUrl(path: string): string {
    if (!this.config.enabled || !this.config.endpoints.static) {
      return path;
    }

    return `${this.config.endpoints.static}${path}`;
  }

  // Get CDN URL for API calls
  static getAPIUrl(path: string): string {
    if (!this.config.enabled || !this.config.endpoints.api) {
      return path;
    }

    return `${this.config.endpoints.api}${path}`;
  }

  // Get CDN URL for images
  static getImageUrl(path: string): string {
    if (!this.config.enabled || !this.config.endpoints.images) {
      return path;
    }

    return `${this.config.endpoints.images}${path}`;
  }

  // Set cache headers for response
  static setCacheHeaders(
    response: Response,
    type: 'static' | 'api' | 'dynamic'
  ): Response {
    const headers = new Headers(response.headers);

    switch (type) {
      case 'static':
        headers.set('Cache-Control', `public, max-age=${this.config.caching.static_ttl}, immutable`);
        headers.set('CDN-Cache-Control', `max-age=${this.config.caching.static_ttl}`);
        break;

      case 'api':
        headers.set('Cache-Control', `public, max-age=${this.config.caching.api_ttl}, s-maxage=${this.config.caching.api_ttl}`);
        headers.set('CDN-Cache-Control', `max-age=${this.config.caching.api_ttl}`);
        break;

      case 'dynamic':
        headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        headers.set('CDN-Cache-Control', 'no-store');
        break;
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Purge CDN cache
  static async purgeCache(paths: string[] = ['/*']): Promise<boolean> {
    try {
      // This would integrate with actual CDN provider APIs
      console.log(`Purging CDN cache for paths:`, paths);

      if (this.config.provider === 'cloudflare') {
        return this.purgeCloudflare(paths);
      } else if (this.config.provider === 'vercel') {
        return this.purgeVercel(paths);
      }

      return true;
    } catch (error) {
      console.error('CDN cache purge failed:', error);
      return false;
    }
  }

  private static async purgeCloudflare(paths: string[]): Promise<boolean> {
    // Implement Cloudflare cache purge
    return true;
  }

  private static async purgeVercel(paths: string[]): Promise<boolean> {
    // Implement Vercel cache purge
    return true;
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Register default cache strategies
  CacheManager.registerStrategy({
    key: 'analytics',
    ttl: 300, // 5 minutes
    strategy: 'swr',
    invalidation_tags: ['analytics']
  });

  CacheManager.registerStrategy({
    key: 'user_data',
    ttl: 60, // 1 minute
    strategy: 'swr',
    invalidation_tags: ['user']
  });

  CacheManager.registerStrategy({
    key: 'properties',
    ttl: 600, // 10 minutes
    strategy: 'cache-first',
    invalidation_tags: ['properties']
  });

  // Start performance monitoring
  window.addEventListener('load', async () => {
    const metrics = await PerformanceOptimizer.measureWebVitals();
    if (metrics) {
      await PerformanceOptimizer.reportMetrics(metrics);
    }

    // Setup lazy loading
    PerformanceOptimizer.setupLazyLoading();
  });
}