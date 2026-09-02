import { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Button, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { app } from '@/application/ApplicationService';

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { container } = await import('@/infrastructure/container');
      await container.userRepo.updateProfile(user.id, { fullName });
      toast.show('Profile updated', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    try {
      await app.auth.updatePassword(newPassword);
      toast.show('Password updated', 'success');
      setNewPassword('');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader title="Profile" subtitle="Update your personal information" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
              {(fullName || user?.email || '?')[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{fullName || 'Your name'}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
          <Input
            label="Email"
            value={user?.email ?? ''}
            disabled
            hint="Email cannot be changed here"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} loading={savingProfile} disabled={!fullName.trim()}>
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Security" subtitle="Update your password" />
        <CardBody className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              loading={savingPassword}
              disabled={newPassword.length < 6}
            >
              Update Password
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="About" subtitle="System information" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <User className="h-4 w-4" /> User ID
            </div>
            <div className="font-mono text-xs text-slate-700">{user?.id}</div>
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="h-4 w-4" /> Email
            </div>
            <div className="text-slate-700">{user?.email}</div>
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="h-4 w-4" /> Platform
            </div>
            <div className="text-slate-700">Onera Core v0.1.0</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
