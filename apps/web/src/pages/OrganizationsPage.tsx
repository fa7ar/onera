import { useEffect, useState } from 'react';
import { Plus, Building2, MoreVertical, Trash2 } from 'lucide-react';
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
import type { Organization } from '@/domain/types';

export function OrganizationsPage() {
  const { user, refreshWorkspaces } = useAuth();
  const toast = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadOrgs = async () => {
    if (!user) return;
    setLoading(true);
    const data = await app.organizations.getOrganizationsForUser(user.id);
    setOrgs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrgs();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      await app.organizations.createOrganization(user.id, name, slug || undefined);
      toast.show('Organization created', 'success');
      setShowCreate(false);
      setName('');
      setSlug('');
      await loadOrgs();
      await refreshWorkspaces();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to create organization', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await app.organizations.deleteOrganization(id, user.id);
      toast.show('Organization deleted', 'success');
      await loadOrgs();
      await refreshWorkspaces();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Organizations</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your business organizations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Organization
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : orgs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No organizations yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first organization to start managing your business.
              </p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create Organization
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id} className="relative">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                      {org.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{org.name}</h3>
                      <p className="text-xs text-slate-400">/{org.slug}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === org.id ? null : org.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === org.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-scale-in">
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {org.ownerId === user?.id ? (
                    <Badge variant="primary">Owner</Badge>
                  ) : (
                    <Badge>Member</Badge>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Organization"
      >
        <div className="space-y-4">
          <Input
            label="Organization name"
            placeholder="Acme Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Slug (optional)"
            placeholder="acme-inc"
            hint="Used in URLs. Auto-generated from name if left empty."
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
