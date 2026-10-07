import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yuma-50 to-background px-4 dark:from-yuma-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
