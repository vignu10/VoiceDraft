'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { WithBottomNav } from '@/components/layout/BottomNav';
import { Select } from '@/components/ui/Select';
import { Moon, Sun, Bell, Lock, Globe, Download, Upload, Database } from 'lucide-react';
import { useTheme } from 'next-themes';

type ThemePreference = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    (theme as ThemePreference) || 'system'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme) {
      setThemePreference(savedTheme as ThemePreference);
      setTheme(savedTheme);
    }

    const savedNotifs = localStorage.getItem('notifications_enabled');
    if (savedNotifs) {
      setNotificationsEnabled(savedNotifs === 'true');
    }

    const savedEmailNotifs = localStorage.getItem('email_notifications');
    if (savedEmailNotifs) {
      setEmailNotifications(savedEmailNotifs === 'true');
    }

    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, [setTheme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('theme_preference', themePreference);
      localStorage.setItem('notifications_enabled', String(notificationsEnabled));
      localStorage.setItem('email_notifications', String(emailNotifications));
      localStorage.setItem('language', language);

      // Apply theme
      setTheme(themePreference);

      // Simulate API call for server-side preferences
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            theme_preference: themePreference,
            notifications_enabled: notificationsEnabled,
            email_notifications: emailNotifications,
            language,
          }),
        });
      }

      // Wait a bit to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/user/backup', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
        setImportResult('Backup exported successfully!');
      } else {
        setImportResult('Failed to export backup');
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      setImportResult('Error exporting backup');
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
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(
          `Import successful! ${result.posts_count || 0} posts, ${result.tags_count || 0} tags restored.`
        );
      } else {
        const error = await response.json();
        setImportResult(error.error || 'Failed to import backup');
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      setImportResult('Error importing backup');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleThemeChange = (value: string) => {
    setThemePreference(value as ThemePreference);
    setTheme(value);
  };

  return (
    <WithBottomNav>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Settings
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Customize your app experience
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
          <div className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Appearance
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Theme
                    </label>
                    <Select
                      options={themeOptions}
                      value={themePreference}
                      onChange={handleThemeChange}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Notifications */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Toggle: Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Push Notifications
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Receive notifications in your browser
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
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
                    <div>
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email Notifications
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Receive updates via email
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

            {/* Language & Region */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Language & Region
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Language
                    </label>
                    <Select
                      options={languageOptions}
                      value={language}
                      onChange={setLanguage}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Privacy */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Privacy
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
                </div>
              </CardBody>
            </Card>

            {/* Data & Backup */}
            <Card>
              <CardBody className="p-6">
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
                      'text-sm p-3 rounded-lg border',
                      importResult.includes('success')
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                    )}>
                      {importResult}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
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

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
