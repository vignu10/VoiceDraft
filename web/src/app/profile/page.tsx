'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card, CardBody } from '@/components/ui/Card';
import { User, Mail, Calendar, LogOut, Key } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFullName(data.user.full_name || '');
        setBio(data.user.bio || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName, bio }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        localStorage.clear();
        router.push('/auth/signup');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Profile
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {fullName ? fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {fullName || 'Add your name'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {memberSince}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6">
                    <div>
                      <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">0</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">Drafts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">0</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">Published</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Edit Profile Form */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Edit Profile
              </h3>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-5 h-5" />}
                />

                <Textarea
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  showCharacterCount
                />

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Account Actions
              </h3>

              <div className="space-y-3">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => router.push('/auth/signin?reset=true')}
                  className="justify-start"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleSignOut}
                  className="justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>

                <Button
                  fullWidth
                  variant="danger-outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="justify-start"
                >
                  Delete Account
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        variant="destructive"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>All your drafts will be permanently deleted</li>
            <li>Published blog posts will be removed</li>
            <li>Your account data will be erased</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
