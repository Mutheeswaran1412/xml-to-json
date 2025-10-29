// Memory management and performance optimization utilities

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private memoryThreshold = 50 * 1024 * 1024; // 50MB
  private processingQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  // Memory monitoring
  getMemoryUsage(): MemoryStats | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  isMemoryLow(): boolean {
    const memory = this.getMemoryUsage();
    if (!memory) return false;
    
    return memory.usedJSHeapSize > this.memoryThreshold;
  }

  // Streaming XML parser for large files
  async parseXmlStream(xmlString: string, chunkSize = 1024 * 10): Promise<string> {
    if (xmlString.length < chunkSize) {
      // Small file, use regular parsing
      return xmlString;
    }

    return new Promise((resolve, reject) => {
      let processed = '';
      let index = 0;

      const processChunk = () => {
        try {
          const chunk = xmlString.slice(index, index + chunkSize);
          processed += chunk;
          index += chunkSize;

          if (index >= xmlString.length) {
            resolve(processed);
          } else {
            // Use requestIdleCallback for non-blocking processing
            if ('requestIdleCallback' in window) {
              requestIdleCallback(processChunk);
            } else {
              setTimeout(processChunk, 0);
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      processChunk();
    });
  }

  // Queue management for batch processing
  async addToQueue(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.processingQueue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const task = this.processingQueue.shift();
      if (task) {
        await task();
        
        // Check memory usage and yield if necessary
        if (this.isMemoryLow()) {
          await this.yieldToMain();
        }
      }
    }

    this.isProcessing = false;
  }

  private yieldToMain(): Promise<void> {
    return new Promise(resolve => {
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        (window as any).scheduler.postTask(resolve, { priority: 'background' });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  // Compression utilities
  compressData(data: string): string {
    // Simple compression using repeated pattern replacement
    let compressed = data;
    
    // Replace common XML patterns
    const patterns = [
      [/\s+/g, ' '], // Multiple spaces to single space
      [/>\s+</g, '><'], // Remove spaces between tags
      [/\n\s*/g, ''], // Remove newlines and indentation
    ];

    patterns.forEach(([pattern, replacement]) => {
      compressed = compressed.replace(pattern, replacement as string);
    });

    return compressed;
  }

  decompressData(data: string): string {
    // Simple decompression - add formatting back
    return data
      .replace(/></g, '>\n<')
      .replace(/([^>])\s*</g, '$1\n<');
  }

  // Lazy loading utility
  async loadComponent<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      console.error('Failed to load component:', error);
      throw error;
    }
  }

  // Code splitting utility
  async loadChunk(chunkName: string): Promise<any> {
    try {
      switch (chunkName) {
        case 'alteryx':
          return import('../utils/workflowConverter');
        case 'analytics':
          return import('../components/AdvancedAnalytics');
        case 'cloud':
          return import('../components/CloudStorage');
        default:
          throw new Error(`Unknown chunk: ${chunkName}`);
      }
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error);
      throw error;
    }
  }

  // Performance monitoring
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // Store performance metrics
    this.storeMetric(name, end - start);
    
    return result;
  }

  private storeMetric(name: string, duration: number): void {
    const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
    if (!metrics[name]) {
      metrics[name] = [];
    }
    
    metrics[name].push({
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (metrics[name].length > 100) {
      metrics[name] = metrics[name].slice(-100);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(metrics));
  }

  getPerformanceMetrics(): Record<string, Array<{duration: number, timestamp: number}>> {
    return JSON.parse(localStorage.getItem('performance_metrics') || '{}');
  }

  clearPerformanceMetrics(): void {
    localStorage.removeItem('performance_metrics');
  }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();

// Utility functions
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    // Yield to main thread between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}