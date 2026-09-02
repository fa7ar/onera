import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { ToastProvider } from '@/components/ui';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AppShell } from '@/components/layouts/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { WorkspacesPage } from '@/pages/WorkspacesPage';
import { MembersPage } from '@/pages/MembersPage';
import { RolesPage } from '@/pages/RolesPage';
import { SettingsPage } from '@/pages/SettingsPage';

function Routes() {
  const { route } = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  if (route.name === 'landing' && !user) {
    return <LandingPage />;
  }

  if (!user) {
    return (
      <AuthLayout>
        {route.name === 'signup' ? <SignupPage /> : <LoginPage />}
      </AuthLayout>
    );
  }

  const page = (() => {
    switch (route.name) {
      case 'dashboard':
        return <DashboardPage />;
      case 'organizations':
        return <OrganizationsPage />;
      case 'workspaces':
        return <WorkspacesPage />;
      case 'members':
        return <MembersPage />;
      case 'roles':
        return <RolesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  })();

  return <AppShell>{page}</AppShell>;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider>
          <Routes />
        </RouterProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
