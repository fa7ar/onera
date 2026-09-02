import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  Input,
  Select,
  Badge,
  Table,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { app } from '@/application/ApplicationService';
import type { MembershipWithContext, Role, Invitation } from '@/domain/types';

export function MembersPage() {
  const { user, activeWorkspace } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<MembershipWithContext[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    if (!user || !activeWorkspace) return;
    try {
      const [memberData, inviteData] = await Promise.all([
        app.memberships.getMembers(activeWorkspace.id, user.id),
        app.memberships.getInvitations(activeWorkspace.id, user.id),
      ]);
      setMembers(memberData);
      setInvitations(inviteData);

      const ws = await app.workspaces.getWorkspace(activeWorkspace.id, user.id);
      const org = await app.organizations.getOrganization(ws.organizationId, user.id);
      const orgRoles = await app.roles.getRolesForOrganization(org.id, user.id);
      setRoles(orgRoles);
    } catch {
      // permission errors
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeWorkspace]);

  const handleInvite = async () => {
    if (!user || !activeWorkspace || !inviteRoleId) return;
    setInviting(true);
    try {
      await app.memberships.inviteMember(
        activeWorkspace.id,
        inviteEmail,
        inviteRoleId,
        user.id,
      );
      toast.show('Invitation sent', 'success');
      setShowInvite(false);
      setInviteEmail('');
      setInviteRoleId('');
      await loadData();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to invite', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (membershipId: string) => {
    if (!user || !activeWorkspace) return;
    try {
      await app.memberships.removeMember(activeWorkspace.id, membershipId, user.id);
      toast.show('Member removed', 'success');
      await loadData();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
  };

  if (!activeWorkspace) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-500">
              Select a workspace from the sidebar to manage its members.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Members</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage members of {activeWorkspace.name}
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader title="Team Members" subtitle={`${members.length} members`} />
        <Table
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (row: MembershipWithContext) => {
                const m = row as unknown as MembershipWithContext;
                const initials = (m.user.fullName || m.user.email)
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {m.user.fullName || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'role',
              header: 'Role',
              render: (row: MembershipWithContext) => {
                const m = row as unknown as MembershipWithContext;
                return (
                  <Badge variant={m.role.name === 'Owner' ? 'primary' : 'default'}>
                    {m.role.name}
                  </Badge>
                );
              },
            },
            {
              key: 'joined',
              header: 'Joined',
              render: (row: MembershipWithContext) =>
                new Date((row as unknown as MembershipWithContext).membership.createdAt).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: '',
              render: (row: MembershipWithContext) => {
                const m = row as unknown as MembershipWithContext;
                if (m.role.name === 'Owner') return null;
                return (
                  <button
                    onClick={() => handleRemove(m.membership.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                );
              },
            },
          ]}
          data={members}
          rowKey={(row) => row.membership.id}
          emptyMessage="No members in this workspace yet."
        />
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader title="Pending Invitations" subtitle={`${invitations.length} pending`} />
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-50">
                  <Mail className="h-4 w-4 text-warning-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Invited {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select
            label="Role"
            placeholder="Select a role"
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              loading={inviting}
              disabled={!inviteEmail.trim() || !inviteRoleId}
            >
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
