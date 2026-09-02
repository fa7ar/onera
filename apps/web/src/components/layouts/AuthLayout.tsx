import { type ReactNode } from 'react';
import { Boxes } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Onera</span>
          </div>
        </div>
        <div className="relative space-y-6 text-white">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            The open-source<br />business operating system
          </h1>
          <p className="max-w-md text-lg text-slate-300">
            A modular ERP platform for running your entire business —
            organizations, teams, roles, and modules that work together.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold">Modular</div>
              <div className="text-sm text-slate-400">Add capabilities as you grow</div>
            </div>
            <div>
              <div className="text-2xl font-bold">Multi-tenant</div>
              <div className="text-sm text-slate-400">Built-in org & workspace isolation</div>
            </div>
            <div>
              <div className="text-2xl font-bold">Open</div>
              <div className="text-sm text-slate-400">Self-host or use the cloud</div>
            </div>
          </div>
        </div>
        <div className="relative text-sm text-slate-400">
          Open source · MIT License
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
