import { useEffect, useState } from 'react';
import { Plus, FolderKanban, Trash2 } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Modal,
  Input,
  Badge,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { app } from '@/application/ApplicationService';
import type { Workspace } from '@/domain/types';

export function WorkspacesPage() {
  const { user, workspaces, refreshWorkspaces, setActiveWorkspace } = useAuth();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const userWorkspaces = await app.workspaces.getWorkspacesForUser(user.id);
    setAllWorkspaces(userWorkspaces);

    const userOrgs = await app.organizations.getOrganizationsForUser(user.id);
    if (userOrgs.length > 0 && !orgId) {
      setOrgId(userOrgs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !orgId) return;
    setCreating(true);
    try {
      await app.workspaces.createWorkspace(user.id, orgId, name);
      toast.show('Workspace created', 'success');
      setShowCreate(false);
      setName('');
      await loadData();
      await refreshWorkspaces();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await app.workspaces.deleteWorkspace(id, user.id);
      toast.show('Workspace deleted', 'success');
      await loadData();
      await refreshWorkspaces();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Workspaces</h2>
          <p className="mt-1 text-sm text-slate-500">Organize work into separate workspaces</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </div>

      {allWorkspaces.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <FolderKanban className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No workspaces yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create a workspace within your organization.
              </p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create Workspace
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allWorkspaces.map((ws) => (
            <Card key={ws.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
                      <FolderKanban className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{ws.name}</h3>
                      <p className="text-xs text-slate-400">/{ws.slug}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="success">Active</Badge>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveWorkspace(ws)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Set active
                    </button>
                    <button
                      onClick={() => handleDelete(ws.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Workspace"
      >
        <div className="space-y-4">
          <Input
            label="Workspace name"
            placeholder="Marketing Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
