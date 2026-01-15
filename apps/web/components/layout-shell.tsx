'use client';

import { ReactNode } from 'react';

interface LayoutShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function LayoutShell({ sidebar, children }: LayoutShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <aside className="w-[400px] flex-shrink-0 border-r border-border flex flex-col bg-card">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
