'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { WithBottomNav } from '@/components/layout/BottomNav';
import { OfflineStatusCompact } from '@/components/ui/OfflineIndicator';
import * as idb from '@/lib/indexedDB';
import { useAuthStore } from '@/stores/auth-store';
import {
  Cloud,
  CloudOff,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
  retries: number;
}

export default function SyncStatusPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    successful: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    loadQueuedRequests();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also reload when storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queued_requests_updated') {
        loadQueuedRequests();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadQueuedRequests = async () => {
    const requests = await idb.getQueuedRequests();
    setQueuedRequests(requests);
  };

  const handleSyncNow = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    setSyncResults(null);

    const token = accessToken;
    if (!token) {
      setIsSyncing(false);
      return;
    }

    try {
      const results = await idb.syncOfflineData(token);
      setSyncResults(results);

      // Reload queued requests after sync
      await loadQueuedRequests();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getActionLabel = (request: QueuedRequest) => {
    const path = new URL(request.url, window.location.origin).pathname;
    if (path.includes('/drafts')) {
      if (request.method === 'POST') return 'Create draft';
      if (request.method === 'PATCH') return 'Update draft';
      if (request.method === 'DELETE') return 'Delete draft';
    }
    if (path.includes('/profile')) {
      if (request.method === 'PATCH') return 'Update profile';
      if (request.method === 'DELETE') return 'Delete account';
    }
    return `${request.method} ${path}`;
  };

  const getStatusIcon = (retries: number) => {
    if (retries === 0) {
      return <Clock className="w-4 h-4 text-neutral-500" />;
    }
    if (retries < 3) {
      return <Clock className="w-4 h-4 text-warning-500" />;
    }
    return <XCircle className="w-4 h-4 text-accent-500" />;
  };

  return (
    <WithBottomNav>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Sync Status
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Manage your offline changes
                </p>
              </div>
              <OfflineStatusCompact />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 lg:pb-8">
          <div className="space-y-6">
            {/* Connection Status Card */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    {isOnline ? (
                      <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-950 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-950 flex items-center justify-center">
                        <CloudOff className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {isOnline ? 'Connected' : 'Offline'}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {isOnline
                          ? 'All changes will sync immediately'
                          : 'Changes will sync when you reconnect'}
                      </div>
                    </div>
                  </div>
                  {isOnline && queuedRequests.length > 0 && (
                    <Button
                      onClick={handleSyncNow}
                      isLoading={isSyncing}
                      disabled={!isOnline}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Sync Results */}
            {syncResults && (
              <Card
                className={
                  syncResults.failed > 0
                    ? 'border-accent-500'
                    : 'border-success-500'
                }
              >
                <CardBody className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    {syncResults.failed > 0 ? (
                      <XCircle className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
                    )}
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {syncResults.failed > 0
                          ? 'Partial Sync Complete'
                          : 'Sync Complete'}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {syncResults.successful} item
                        {syncResults.successful !== 1 ? 's' : ''} synced
                        {syncResults.failed > 0 &&
                          `, ${syncResults.failed} failed`}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Queued Changes */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Pending Changes
                  </h3>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {queuedRequests.length} item
                    {queuedRequests.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {queuedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Cloud className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                      All changes are synced
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queuedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                      >
                        {getStatusIcon(request.retries)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {getActionLabel(request)}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {formatTimestamp(request.timestamp)}
                            {request.retries > 0 &&
                              ` • ${request.retries} retry${request.retries !== 1 ? 'ies' : ''}`}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            idb.removeQueuedRequest(request.id);
                            loadQueuedRequests();
                          }}
                          className="p-2 text-neutral-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Remove from queue"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Info Card */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  About Offline Sync
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-success-600 dark:text-success-400" />
                    <span>
                      Changes made offline are automatically saved to your device
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-success-600 dark:text-success-400" />
                    <span>
                      When you reconnect, changes sync automatically in the background
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-success-600 dark:text-success-400" />
                    <span>
                      Failed syncs are retried up to 3 times before giving up
                    </span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </main>
      </div>
    </WithBottomNav>
  );
}
