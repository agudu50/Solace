'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Activity,
  Home,
  Terminal,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface SidebarDockProps {
  onOpenAudit?: () => void;
}

export default function SidebarDock({ onOpenAudit }: SidebarDockProps) {
  const pathname = usePathname();
  const { walletKey } = useWallet();

  // Only display mobile bottom navigation bar when wallet is connected
  if (!walletKey) {
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    { label: 'Audit', href: '/audit', icon: ShieldCheck },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Monitor', href: '/monitor', icon: Activity },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-3 left-3 right-3 sm:left-8 sm:right-8 z-50 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-1.5 flex md:hidden items-center justify-between gap-1"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition border text-center ${
              isActive
                ? 'bg-accent text-white border-accent shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            }`}
            title={item.label}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight block truncate w-full">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
