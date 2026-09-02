import { useEffect, useState } from 'react';
import { Plus, Shield, Trash2, Check } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  Input,
  Badge,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { app } from '@/application/ApplicationService';
import type { Role, Permission } from '@/domain/types';

export function RolesPage() {
  const { user, activeWorkspace } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user || !activeWorkspace) return;
    try {
      const ws = await app.workspaces.getWorkspace(activeWorkspace.id, user.id);
      const org = await app.organizations.getOrganization(ws.organizationId, user.id);
      setOrgId(org.id);

      const [orgRoles, perms] = await Promise.all([
        app.roles.getRolesForOrganization(org.id, user.id),
        app.roles.getAllPermissions(),
      ]);
      setRoles(orgRoles);
      setAllPermissions(perms);

      const permMap: Record<string, string[]> = {};
      for (const role of orgRoles) {
        const rolePerms = await app.roles.getRolePermissions(role.id);
        permMap[role.id] = rolePerms.map((p) => p.key);
      }
      setRolePerms(permMap);
    } catch {
      // permission errors
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeWorkspace]);

  const handleCreate = async () => {
    if (!user || !orgId) return;
    setCreating(true);
    try {
      const permIds = allPermissions
        .filter((p) => selectedPerms.includes(p.key))
        .map((p) => p.id);
      await app.roles.createRole(orgId, newRoleName, permIds, user.id);
      toast.show('Role created', 'success');
      setShowCreate(false);
      setNewRoleName('');
      setSelectedPerms([]);
      await loadData();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to create role', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!user) return;
    try {
      await app.roles.deleteRole(roleId, user.id);
      toast.show('Role deleted', 'success');
      await loadData();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete role', 'error');
    }
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  if (!activeWorkspace) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              Select a workspace to manage roles.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const permissionsByModule = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Roles & Permissions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define roles and assign permissions for your organization
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader
              title={role.name}
              subtitle={`${rolePerms[role.id]?.length ?? 0} permissions`}
              action={
                role.isSystem ? (
                  <Badge variant="primary">System</Badge>
                ) : (
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              }
            />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {(rolePerms[role.id] ?? []).map((permKey) => (
                  <span
                    key={permKey}
                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {permKey}
                  </span>
                ))}
                {(!rolePerms[role.id] || rolePerms[role.id].length === 0) && (
                  <span className="text-xs text-slate-400">No permissions assigned</span>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Role"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Role name"
            placeholder="Editor"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Permissions</label>
            <div className="space-y-3">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {module}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => {
                      const checked = selectedPerms.includes(perm.key);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePerm(perm.key)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                            checked
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded ${
                              checked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="font-mono text-xs">{perm.key}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newRoleName.trim()}>
              Create Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
