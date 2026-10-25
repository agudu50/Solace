'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Coins,
  Activity,
  FileCode,
  FileText,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
  LogOut,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  Copy,
  Check,
  ChevronRight,
  Database,
  Terminal,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import {
  fetchCurrentUserSession,
  fetchAdminStats,
  fetchAdminUsers,
  updateUserStatusAdmin,
  updateUserRoleAdmin,
  fetchAdminAudits,
  fetchAdminPurchases,
  adjustCreditsAdmin,
  fetchAdminLogs,
  AuthUser,
} from '../../utils/solaceService';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { walletKey, user, isAdmin, disconnect } = useWallet();

  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audits' | 'purchases' | 'logs'>('overview');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditsList, setAuditsList] = useState<any[]>([]);
  const [purchasesList, setPurchasesList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Search & Filter
  const [userSearch, setUserSearch] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Credit Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [adjustTargetWallet, setAdjustTargetWallet] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(3);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);

  // 1. Verify Server-Side Authorization on Mount
  const loadDashboardData = useCallback(async () => {
    setRefreshing(true);
    setErrorMsg('');

    try {
      // Confirm authenticated admin session with backend
      const sessionUser = await fetchCurrentUserSession();
      if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'super_admin')) {
        setAuthorized(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCurrentUser(sessionUser);
      setAuthorized(true);

      // Fetch admin data in parallel
      const [statsData, usersData, auditsData, purchasesData, logsData] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminAudits().catch(() => []),
        fetchAdminPurchases().catch(() => []),
        fetchAdminLogs().catch(() => []),
      ]);

      setStats(statsData);
      setUsersList(usersData || []);
      setAuditsList(auditsData || []);
      setPurchasesList(purchasesData || []);
      setLogsList(logsData || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async (targetWallet: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatusAdmin(targetWallet, nextStatus, 'Admin console status toggle');
      setSuccessMsg(`Updated ${targetWallet.slice(0, 8)}... status to ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (targetWallet: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRoleAdmin(targetWallet, nextRole, 'Admin console role adjustment');
      setSuccessMsg(`Updated ${targetWallet.slice(0, 8)}... role to ${nextRole}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user role.');
    }
  };

  const openAdjustModal = (wallet: string) => {
    setAdjustTargetWallet(wallet);
    setAdjustAmount(3);
    setAdjustReason('Operator balance grant');
    setAdjustModalOpen(true);
  };

  const handleExecuteCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetWallet || !adjustAmount || !adjustReason) return;

    setAdjustSubmitting(true);
    try {
      await adjustCreditsAdmin(adjustTargetWallet, adjustAmount, adjustReason);
      setSuccessMsg(`Successfully adjusted credits for ${adjustTargetWallet.slice(0, 8)}... by ${adjustAmount}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setAdjustModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Credit adjustment failed.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return u.wallet_address.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  // Guard: Not Authenticated or Non-Admin
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying Server-Side Administrator Credentials...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#101522] rounded-3xl p-8 border border-red-900/60 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-red-950/80 text-red-300 font-bold border border-red-800 uppercase tracking-wider">
            Unauthorized
          </span>
          <h1 className="text-2xl font-black text-white mt-3 mb-2">Administrator Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
            This protected dashboard requires an active administrator wallet session. Your currently connected key is not
            authorized to access platform management.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/admin/login"
              className="py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Admin Login</span>
            </Link>
            <Link
              href="/"
              className="py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
            >
              Return to Public Platform
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-accent selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0d121d]/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center p-1 border border-accent/40 shadow-sm">
                <Image src="/solace-logo.jpg" alt="Solace" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-white tracking-tight">SOLACE</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>ADMIN CONSOLE</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition text-xs font-mono flex items-center gap-1.5"
              title="Refresh ledger state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* Authenticated Admin Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-white">
                {currentUser?.address ? `${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}` : ''}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase">
                {currentUser?.role || 'admin'}
              </span>
            </div>

            <button
              type="button"
              onClick={disconnect}
              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 transition"
              title="Logout Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Flash Notifications */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white font-mono text-xs">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white font-mono text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0f1420] border border-slate-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Analytics', icon: Activity },
            { id: 'users', label: `Users (${usersList.length})`, icon: Users },
            { id: 'audits', label: `Audits (${auditsList.length})`, icon: FileCode },
            { id: 'purchases', label: `XML Purchases (${purchasesList.length})`, icon: Coins },
            { id: 'logs', label: `Audit Trail (${logsList.length})`, icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & PLATFORM ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#101522] border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">Registered Wallets</span>
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div className="text-3xl font-black text-white">{stats?.users?.total || usersList.length}</div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">{stats?.users?.admins || 1} Admins</span>
                  <span>•</span>
                  <span>Server-Verified</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101522] border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">Audits Conducted</span>
                  <FileCode className="w-4 h-4 text-accent" />
                </div>
                <div className="text-3xl font-black text-white">{stats?.audits?.totalConducted || auditsList.length}</div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-accent font-bold">Soroban Protocol 22</span>
                  <span>•</span>
                  <span>On-Chain AST</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101522] border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">Estimated Volume</span>
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">{stats?.credits?.estimatedXLMVolume || 0} XLM</div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">{stats?.credits?.totalIssued || 0} Credits</span>
                  <span>issued</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101522] border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">Active Credits</span>
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <div className="text-3xl font-black text-white">{stats?.credits?.activeOutstanding || 0}</div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span>{stats?.credits?.totalConsumed || 0} consumed</span>
                </div>
              </div>
            </div>

            {/* AI Diagnostics & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-[#101522] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-accent" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      AI Invariant Threat Engine
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    HEALTHY 99.4%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { model: 'gemini-3.5-flash-lite', role: 'Primary AST Invariant Engine', latency: '380ms', status: 'Online' },
                    { model: 'gemini-3.1-flash-lite', role: 'Storage TTL & Panic Trap Engine', latency: '410ms', status: 'Online' },
                    { model: 'gemini-3.5-flash', role: 'Remediation & Patch Generator', latency: '460ms', status: 'Standby' },
                  ].map((m) => (
                    <div key={m.model} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-white">{m.model}</div>
                        <div className="text-[11px] text-slate-400">{m.role}</div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-accent font-bold">{m.latency}</span>
                        <div className="text-[10px] text-emerald-400">{m.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#101522] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-accent" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Persistence &amp; Ledger Architecture
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold">
                    PROTOCOL 22
                  </span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Database Layer:</span>
                    <span className="font-bold text-white">Neon PostgreSQL (Serverless Ed25519 Tables)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Stellar Network:</span>
                    <span className="font-bold text-emerald-400">Testnet (Soroban Smart Contract CAC2TVMF5...6PNPN2)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Admin Operator Policy:</span>
                    <span className="font-bold text-accent">Server-Enforced Nonce Challenge • No Password Fallbacks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#101522] border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search wallet address or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-accent"
                />
              </div>

              <div className="text-xs font-mono text-slate-400">
                Showing {filteredUsers.length} of {usersList.length} wallets
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-[#101522] border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b0e17] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Wallet Address</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Available Credits</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                          No matching wallets found in registry.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = u.wallet_address === currentUser?.address;
                        const isSuper = u.role === 'super_admin';
                        return (
                          <tr key={u.id || u.wallet_address} className="hover:bg-slate-900/50 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {u.wallet_address.slice(0, 8)}...{u.wallet_address.slice(-6)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(u.wallet_address)}
                                  className="text-slate-500 hover:text-white"
                                  title="Copy full key"
                                >
                                  {copiedKey === u.wallet_address ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.role === 'super_admin'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : u.role === 'admin'
                                    ? 'bg-accent/20 text-accent border border-accent/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                                  }`}
                                />
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-accent text-sm">{u.credit_balance || 0}</span>
                              <span className="text-slate-500 text-[10px] ml-1">audits</span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openAdjustModal(u.wallet_address)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition"
                                  title="Adjust user credits"
                                >
                                  Credits
                                </button>
                                {!isSelf && !isSuper && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRoleChange(u.wallet_address, u.role)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                                    >
                                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(u.wallet_address, u.status)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                                        u.status === 'active'
                                          ? 'bg-red-950/60 hover:bg-red-900 text-red-300'
                                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300'
                                      }`}
                                    >
                                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM AUDITS */}
        {activeTab === 'audits' && (
          <div className="rounded-2xl bg-[#101522] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b0e17] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Contract Name</th>
                    <th className="py-3 px-4">Auditor Wallet</th>
                    <th className="py-3 px-4">SHA-256 Fingerprint</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        No audits conducted yet. Launch audits via the Audit Studio.
                      </td>
                    </tr>
                  ) : (
                    auditsList.map((a) => (
                      <tr key={a.id || a.contract_hash} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 font-bold text-white">{a.contract_name || 'SorobanContract.rs'}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {a.wallet_address ? `${a.wallet_address.slice(0, 6)}...${a.wallet_address.slice(-4)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {a.contract_hash ? `${a.contract_hash.slice(0, 10)}...` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              (a.risk_score || 0) >= 80 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {a.risk_score || 0}/100
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.is_secure ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {a.is_secure ? 'SAFE' : 'FLAW IDENTIFIED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: XML PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="rounded-2xl bg-[#101522] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b0e17] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">Wallet Address</th>
                    <th className="py-3 px-4 text-right">Credits (+/-)</th>
                    <th className="py-3 px-4">Reason / Package</th>
                    <th className="py-3 px-4">Ledger Tx Hash</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchasesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        No credit purchases or adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    purchasesList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                              p.type === 'PURCHASE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.type === 'ADMIN_ADJUSTMENT'
                                ? 'bg-accent/20 text-accent'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.wallet_address ? `${p.wallet_address.slice(0, 8)}...` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-accent">
                          {p.amount > 0 ? `+${p.amount}` : p.amount}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{p.reason || (p.package_id ? `Bundle #${p.package_id}` : '—')}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {p.tx_hash ? (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${p.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline flex items-center gap-1"
                            >
                              <span>{p.tx_hash.slice(0, 10)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            'Administrative Action'
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADMINISTRATIVE AUDIT TRAIL LOGS */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl bg-[#101522] border border-slate-800 overflow-hidden">
            <div className="p-4 bg-[#0b0e17] border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span>Immutable Administrative Action Log</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Showing last {logsList.length} actions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0f1422] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Wallet</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                        No administrative actions recorded in log.
                      </td>
                    </tr>
                  ) : (
                    logsList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-white font-bold">
                          {log.actor_wallet.length === 56
                            ? `${log.actor_wallet.slice(0, 6)}...${log.actor_wallet.slice(-4)}`
                            : log.actor_wallet}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {log.target
                            ? `${log.target.slice(0, 8)}...${log.target.slice(-6)}`
                            : 'Platform'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '—')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Credit Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#101522] rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-lg font-black text-white tracking-tight mb-1">Adjust User Audit Credits</h2>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Target: {adjustTargetWallet.slice(0, 8)}...{adjustTargetWallet.slice(-6)}
            </p>

            <form onSubmit={handleExecuteCreditAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
                  Credit Amount (+ to grant, - to deduct)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-hidden focus:border-accent"
                    required
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(3)}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white"
                    >
                      +3
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(6)}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white"
                    >
                      +6
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(-1)}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-red-400"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
                  Administrative Reason (Audit Trail Required)
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Protocol compensation for re-audit..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-accent"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adjustSubmitting ? 'Recording On-Chain...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
