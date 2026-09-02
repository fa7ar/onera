import { type ReactNode, useState } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, type Route } from '@/context/RouterContext';

const navItems: { route: Route['name']; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'organizations', label: 'Organizations', icon: Building2 },
  { route: 'workspaces', label: 'Workspaces', icon: FolderKanban },
  { route: 'members', label: 'Members', icon: Users },
  { route: 'roles', label: 'Roles & Permissions', icon: Shield },
  { route: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut, workspaces, activeWorkspace, setActiveWorkspace } = useAuth();
  const { route, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsDropdown, setWsDropdown] = useState(false);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email[0]?.toUpperCase() ?? '?';

  const handleNavigate = (name: Route['name']) => {
    navigate({ name });
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Onera</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace selector */}
        {workspaces.length > 0 && (
          <div className="relative border-b border-slate-200 px-3 py-3">
            <button
              onClick={() => setWsDropdown(!wsDropdown)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-400">Workspace</p>
                <p className="truncate font-medium text-slate-700">
                  {activeWorkspace?.name ?? 'Select'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
            </button>
            {wsDropdown && (
              <div className="absolute left-3 right-3 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-scale-in">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setWsDropdown(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = route.name === item.route;
            return (
              <button
                key={item.route}
                onClick={() => handleNavigate(item.route)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {user?.fullName || 'User'}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900">
              {navItems.find((n) => n.route === route.name)?.label ?? 'Onera'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
