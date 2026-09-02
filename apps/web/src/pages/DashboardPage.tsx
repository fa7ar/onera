import { useEffect, useState } from 'react';
import {
  Building2,
  FolderKanban,
  Users,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { app } from '@/application/ApplicationService';
import type { Organization, MembershipWithContext } from '@/domain/types';

export function DashboardPage() {
  const { user, activeWorkspace, refreshWorkspaces } = useAuth();
  const { navigate } = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<MembershipWithContext[]>([]);
  const [workspaceCount, setWorkspaceCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userOrgs = await app.organizations.getOrganizationsForUser(user.id);
      setOrgs(userOrgs);
      const userWorkspaces = await app.workspaces.getWorkspacesForUser(user.id);
      setWorkspaceCount(userWorkspaces.length);
      if (activeWorkspace) {
        try {
          const wsMembers = await app.memberships.getMembers(activeWorkspace.id, user.id);
          setMembers(wsMembers);
        } catch {
          setMembers([]);
        }
      }
    })();
  }, [user, activeWorkspace, refreshWorkspaces]);

  const stats = [
    {
      label: 'Organizations',
      value: orgs.length,
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Workspaces',
      value: workspaceCount,
      icon: FolderKanban,
      color: 'bg-success-50 text-success-600',
    },
    {
      label: 'Members',
      value: members.length,
      icon: Users,
      color: 'bg-warning-50 text-warning-600',
    },
    {
      label: 'Active Module',
      value: 'Core',
      icon: TrendingUp,
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.fullName?.split(' ')[0] || 'there'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's an overview of your Onera workspace
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Your Organizations"
            subtitle="Organizations you belong to"
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate({ name: 'organizations' })}>
                <Plus className="h-4 w-4" /> New
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {orgs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No organizations yet. Create one to get started.
              </p>
            ) : (
              orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-600">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{org.name}</p>
                    <p className="truncate text-xs text-slate-400">/{org.slug}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Team Members"
            subtitle={
              activeWorkspace ? `In ${activeWorkspace.name}` : 'No active workspace'
            }
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate({ name: 'members' })}>
                Manage
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {members.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No members to display.
              </p>
            ) : (
              members.slice(0, 5).map((m) => {
                const initials = (m.user.fullName || m.user.email)
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <div
                    key={m.membership.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {m.user.fullName || m.user.email}
                      </p>
                      <p className="truncate text-xs text-slate-400">{m.user.email}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {m.role.name}
                    </span>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
