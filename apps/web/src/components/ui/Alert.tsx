import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Variant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

const config: Record<Variant, { icon: typeof Info; classes: string }> = {
  info: { icon: Info, classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  success: { icon: CheckCircle2, classes: 'bg-success-50 text-success-700 border-success-100' },
  warning: { icon: AlertCircle, classes: 'bg-warning-50 text-warning-700 border-warning-100' },
  error: { icon: XCircle, classes: 'bg-danger-50 text-danger-700 border-danger-100' },
};

export function Alert({ variant = 'info', title, children }: AlertProps) {
  const { icon: Icon, classes } = config[variant];
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 ${classes}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        <div className={title ? 'mt-1 text-sm opacity-90' : 'text-sm'}>{children}</div>
      </div>
    </div>
  );
}
