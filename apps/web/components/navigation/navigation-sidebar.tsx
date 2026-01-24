'use client';

import { MessageSquare, Settings, FileText, List } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function NavigationSidebar() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: MessageSquare, label: 'Messages' },
        { href: '/devices', icon: Settings, label: 'Devices' },
        { href: '/docs', icon: FileText, label: 'Docs' },
        { href: '/queue', icon: List, label: 'Queue' },
    ];

    return (
        <div className="w-20 bg-slate-900 flex flex-col items-center py-4 gap-4 flex-shrink-0">
            {/* Logo */}
            <div className="mb-4">
                <div className="size-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                    W
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-2 w-full px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                ${isActive
                                    ? 'bg-green-500 text-white'
                                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                }
              `}
                            title={item.label}
                        >
                            <Icon className="size-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
