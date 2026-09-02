import { useState, type FormEvent } from 'react';
import { Boxes } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useRouter } from '@/context/RouterContext';
import { app } from '@/application/ApplicationService';

export function LoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await app.auth.signIn(email, password);
      navigate({ name: 'dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Onera</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="mt-1.5 text-sm text-slate-500">Sign in to your Onera workspace</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        No account?{' '}
        <button
          onClick={() => navigate({ name: 'signup' })}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Create one
        </button>
      </p>
    </div>
  );
}
