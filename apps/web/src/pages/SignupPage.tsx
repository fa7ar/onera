import { useState, type FormEvent } from 'react';
import { Boxes } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useRouter } from '@/context/RouterContext';
import { app } from '@/application/ApplicationService';

export function SignupPage() {
  const { navigate } = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await app.auth.signUp(email, password, fullName);
      navigate({ name: 'dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-1.5 text-sm text-slate-500">Start running your business on Onera</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          name="fullName"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          onClick={() => navigate({ name: 'login' })}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
