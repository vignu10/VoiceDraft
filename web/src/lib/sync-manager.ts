import { queueRequest, getQueuedRequests, removeQueuedRequest } from './indexedDB';

// Sync manager for handling background sync
export class SyncManager {
  private static instance: SyncManager;
  private syncInProgress = false;

  static getInstance() {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // Queue a request for background sync
  async queueRequest(options: {
    url: string;
    method: 'POST' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
  }) {
    const request = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: options.url,
      method: options.method,
      body: options.body,
      headers: options.headers,
      timestamp: Date.now(),
      retries: 0,
    };

    await queueRequest(request);

    // Register sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }

    return request.id;
  }

  // Process all queued requests
  async processQueue(token: string) {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const requests = await getQueuedRequests();
      const results = {
        successful: [] as string[],
        failed: [] as string[],
      };

      for (const request of requests) {
        // Skip requests that have been retried too many times
        if (request.retries >= 3) {
          await removeQueuedRequest(request.id);
          results.failed.push(request.id);
          continue;
        }

        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              ...(request.headers || {}),
              Authorization: `Bearer ${token}`,
            },
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (response.ok) {
            await removeQueuedRequest(request.id);
            results.successful.push(request.id);
          } else {
            // Increment retry count
            const db = await import('./indexedDB');
            await db.incrementRequestRetries(request.id);
            results.failed.push(request.id);
          }
        } catch (error) {
          const db = await import('./indexedDB');
          await db.incrementRequestRetries(request.id);
          results.failed.push(request.id);
        }
      }

      return results;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus() {
    return getQueuedRequests().then((requests) => ({
      pending: requests.length,
      inProgress: this.syncInProgress,
    }));
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
