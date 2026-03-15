'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { WithBottomNav } from '@/components/layout/BottomNav';
import { Bell, Lock, Download, Upload, Database, AlertTriangle, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsPermission, setNotificationsPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    // Check notification permission on mount
    if ('Notification' in window) {
      setNotificationsPermission(Notification.permission as 'default' | 'granted' | 'denied');
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Load settings from localStorage
    const savedEmailNotifs = localStorage.getItem('email_notifications');
    if (savedEmailNotifs) {
      setEmailNotifications(savedEmailNotifs === 'true');
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      setSaveMessage({ type: 'error', text: 'Your browser does not support notifications.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (notificationsPermission === 'granted') {
      // Disable notifications - we can't actually revoke, but we can track preference
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      setSaveMessage({ type: 'success', text: 'Notifications disabled. Note: You may need to disable this in your browser settings.' });
    } else if (notificationsPermission === 'denied') {
      setSaveMessage({ type: 'error', text: 'Notifications are blocked. Please enable them in your browser settings.' });
    } else {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission as 'default' | 'granted' | 'denied');
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        // Show a test notification
        new Notification('VoiceDraft', {
          body: 'Notifications enabled! You\'ll receive updates here.',
          icon: '/icons/icon-192x192.png',
        });
        setSaveMessage({ type: 'success', text: 'Notifications enabled successfully!' });
      } else {
        setSaveMessage({ type: 'error', text: 'Notifications permission denied.' });
      }
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Save to localStorage
      localStorage.setItem('email_notifications', String(emailNotifications));

      // Try to save to server (may fail if endpoint doesn't exist yet)
      if (accessToken) {
        try {
          await api.patch('/api/user/settings', {
            email_notifications: emailNotifications,
          });
        } catch (serverError) {
          console.warn('Server settings save failed:', serverError);
        }
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setImportResult(null);
    try {
      const response = await api.get('/api/user/backup');

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voicedraft-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setImportResult({ type: 'success', text: 'Backup exported successfully!' });
      } else {
        setImportResult({ type: 'error', text: 'Failed to export backup' });
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      setImportResult({ type: 'error', text: 'Error exporting backup' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/user/backup', formData);

      if (response.ok) {
        const result = await response.json();
        setImportResult({
          type: 'success',
          text: `Import successful! ${result.posts_count || 0} posts, ${result.tags_count || 0} tags restored.`
        });
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to import backup' }));
        setImportResult({ type: 'error', text: error.error || 'Failed to import backup' });
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      setImportResult({ type: 'error', text: 'Error importing backup' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (!accessToken) {
      setSaveMessage({ type: 'error', text: 'You must be signed in to delete your account.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await api.delete('/api/profile');

      if (response.ok) {
        localStorage.clear();
        setSaveMessage({ type: 'success', text: 'Your account has been permanently deleted.' });
        setTimeout(() => {
          router.push('/auth/signin');
          router.refresh();
        }, 2000);
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete account' }));
        setSaveMessage({ type: 'error', text: error.error || 'Failed to delete account. Please try again.' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSaveMessage({ type: 'error', text: 'Failed to delete account. Please check your connection and try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <WithBottomNav>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-frosted border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Settings
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Customize your app experience
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 lg:pb-8">
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Toggle: Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Browser Notifications
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {notificationsPermission === 'denied'
                          ? 'Blocked by browser. Enable in browser settings.'
                          : 'Receive updates in your browser'}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleNotifications}
                      className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        notificationsEnabled
                          ? 'bg-primary-500'
                          : 'bg-neutral-200 dark:bg-neutral-700'
                      )}
                      role="switch"
                      aria-checked={notificationsEnabled}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Toggle: Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email Notifications
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Receive updates and summaries via email
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        emailNotifications
                          ? 'bg-primary-500'
                          : 'bg-neutral-200 dark:bg-neutral-700'
                      )}
                      role="switch"
                      aria-checked={emailNotifications}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Privacy */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Privacy & Security
                  </h3>
                </div>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    variant="secondary"
                    className="justify-start"
                    onClick={() => router.push('/auth/signin?reset=true')}
                  >
                    Change Password
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    className="justify-start"
                    onClick={() => router.push('/profile')}
                  >
                    Manage Profile Data
                  </Button>
                  <Button
                    fullWidth
                    variant="danger"
                    className="justify-start"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This will permanently delete your account, all your drafts, and published posts. This action cannot be undone.')) {
                        handleDeleteAccount();
                      }
                    }}
                    isLoading={isDeletingAccount}
                    disabled={isDeletingAccount}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Data & Backup */}
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Data & Backup
                  </h3>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Export your data as a backup or import from a previous backup file.
                </p>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    variant="secondary"
                    className="justify-start"
                    onClick={handleExport}
                    isLoading={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Backup
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      disabled={isImporting}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Button
                      fullWidth
                      variant="secondary"
                      className="justify-start w-full"
                      isLoading={isImporting}
                      disabled={isImporting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Backup
                    </Button>
                  </div>

                  {importResult && (
                    <div className={cn(
                      'text-sm p-3 rounded-lg border flex items-start gap-2',
                      importResult.type === 'success'
                        ? 'bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
                        : 'bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800'
                    )}>
                      {importResult.type === 'success' ? (
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{importResult.text}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end items-center gap-4 pt-4">
              {saveMessage && (
                <div className={cn(
                  'text-sm px-4 py-2 rounded-lg border flex items-center gap-2',
                  saveMessage.type === 'success'
                    ? 'bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
                    : 'bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800'
                )}>
                  {saveMessage.type === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {saveMessage.text}
                </div>
              )}
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Settings
              </Button>
            </div>
          </div>
        </main>
      </div>
    </WithBottomNav>
  );
}
