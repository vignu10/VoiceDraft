'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { WithBottomNav } from '@/components/layout/BottomNav';
import { useAnalytics } from '@/stores/analytics-store';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import {
  BarChart,
  TrendingUp,
  FileText,
  Mic,
  Clock,
  Tag,
  Users,
} from 'lucide-react';

interface AnalyticsData {
  totalDrafts: number;
  totalWords: number;
  totalRecordings: number;
  totalRecordingTime: number;
  topTags: { name: string; count: number; color: string }[];
  recentActivity: { type: string; count: number; date: string }[];
}

export default function AnalyticsPage() {
  const { isConsent, setConsent, trackPageView } = useAnalytics();
  const { accessToken } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackPageView('/analytics');
  }, [trackPageView]);

  useEffect(() => {
    if (isConsent) {
      fetchAnalytics();
    }
  }, [isConsent]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/user/analytics');

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConsent === null) {
    return (
      <WithBottomNav>
        <div className="min-h-screen">
          <header className="bg-frosted border-b border-neutral-200/50 dark:border-neutral-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Analytics
              </h1>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardBody className="p-8 text-center">
                <BarChart className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Anonymous Analytics
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  VoiceDraft uses anonymous usage data to improve your experience. No
                  personal content is analyzed.
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setConsent(true)}>
                    Allow Analytics
                  </Button>
                  <Button variant="secondary" onClick={() => setConsent(false)}>
                    Decline
                  </Button>
                </div>
              </CardBody>
            </Card>
          </main>
        </div>
      </WithBottomNav>
    );
  }

  if (!isConsent) {
    return (
      <WithBottomNav>
        <div className="min-h-screen">
          <header className="bg-frosted border-b border-neutral-200/50 dark:border-neutral-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Analytics
              </h1>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardBody className="p-8 text-center">
                <BarChart className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Analytics Disabled
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Enable analytics to see your writing statistics and activity trends.
                </p>
                <Button onClick={() => setConsent(true)}>
                  Enable Analytics
                </Button>
              </CardBody>
            </Card>
          </main>
        </div>
      </WithBottomNav>
    );
  }

  return (
    <WithBottomNav>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-frosted border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Analytics
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your writing statistics and activity trends
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 h-32 animate-pulse"
                />
              ))}
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardBody className="p-6">
                    <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-2" />
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {analytics.totalDrafts}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Drafts
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                  <TrendingUp className="w-8 h-8 text-success-600 dark:text-success-400 mb-2" />
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {analytics.totalWords.toLocaleString()}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Words
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <Mic className="w-8 h-8 text-accent-600 dark:text-accent-400 mb-2" />
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {analytics.totalRecordings}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Recordings
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <Clock className="w-8 h-8 text-info-600 dark:text-info-400 mb-2" />
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {Math.floor(analytics.totalRecordingTime / 60)}h
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Recording Time
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Top Tags */}
              {analytics.topTags.length > 0 && (
                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Top Tags
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {analytics.topTags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span
                            className="px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                          <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                            <div
                              className="h-full rounded-full bg-primary-500"
                              style={{
                                width: `${Math.min(
                                  (tag.count / analytics.topTags[0].count) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 min-w-[3ch] text-right">
                            {tag.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Recent Activity */}
              {analytics.recentActivity.length > 0 && (
                <Card>
                  <CardBody className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {analytics.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-900 dark:text-neutral-100">
                              {activity.type === 'draft_created' && 'Created draft'}
                              {activity.type === 'recording' && 'Recorded audio'}
                              {activity.type === 'draft_published' && 'Published post'}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              {activity.count}x
                            </span>
                          </div>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            {activity.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardBody className="p-8 text-center">
                <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  No Data Yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Start creating drafts to see your analytics here.
                </p>
                <Button href="/record">Start Recording</Button>
              </CardBody>
            </Card>
          )}
        </main>
      </div>
    </WithBottomNav>
  );
}
