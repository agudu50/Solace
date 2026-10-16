'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Activity,
} from 'lucide-react';

interface SidebarDockProps {
  onOpenAudit?: () => void;
}

export default function SidebarDock({ onOpenAudit }: SidebarDockProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Audit', href: '/audit', icon: ShieldCheck },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Monitor', href: '/monitor', icon: Activity },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-50 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl px-2 py-1.5 flex md:hidden items-center justify-around"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              isActive
                ? 'bg-accent text-white shadow-md'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            }`}
            title={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
