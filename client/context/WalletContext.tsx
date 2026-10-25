'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  connectWallet as freighterConnect,
  detectWalletNetwork,
  checkFreighterInstalled,
  WatchWalletChanges,
  authenticateWalletSession,
  fetchCurrentUserSession,
  logoutUserSession,
  AuthUser,
} from '../utils/solaceService';

interface WalletContextType {
  walletKey: string;
  user: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  network: 'testnet' | 'mainnet';
  connecting: boolean;
  freighterReady: boolean | null;
  connect: () => Promise<string>;
  authenticate: (action?: 'solace-auth-login' | 'solace-admin-login') => Promise<AuthUser>;
  disconnect: () => void;
  setNetwork: (network: 'testnet' | 'mainnet') => void;
  toggleNetwork: () => void;
  setWalletKeyDirectly: (key: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({
  children,
  initialWallet = '',
  initialNetwork = 'testnet',
}: {
  children: ReactNode;
  initialWallet?: string;
  initialNetwork?: 'testnet' | 'mainnet';
}) {
  const router = useRouter();

  const [walletKey, setWalletKeyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('solace_wallet_disconnected') === 'true') {
          return '';
        }
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored && /^G[A-Z0-9]{55}$/.test(stored)) return stored;
      } catch (_) {}
    }
    if (initialWallet && /^G[A-Z0-9]{55}$/.test(initialWallet)) {
      return initialWallet;
    }
    return '';
  });

  // Solace is strictly in the Stellar Testnet (Protocol 22) phase
  const [network, setNetworkState] = useState<'testnet' | 'mainnet'>('testnet');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [freighterReady, setFreighterReady] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');

  // Load authenticated session on mount
  useEffect(() => {
    fetchCurrentUserSession().then((authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setWalletKeyState(authenticatedUser.address);
      }
    });
  }, []);

  const syncWalletToStorageAndCookies = useCallback((key: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (key && /^G[A-Z0-9]{55}$/.test(key)) {
        localStorage.removeItem('solace_wallet_disconnected');
        localStorage.setItem('solace_connected_wallet', key);
        document.cookie = `solace_connected_wallet=${key}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        localStorage.removeItem('solace_connected_wallet');
        document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'solace_connected_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
    } catch (_) {}
  }, []);

  const syncNetworkToStorageAndCookies = useCallback((net: 'testnet' | 'mainnet') => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('solace-network', 'testnet');
      document.cookie = `solace_network=testnet; path=/; max-age=31536000; SameSite=Lax`;
    } catch (_) {}
  }, []);

  const setWalletKeyDirectly = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('solace_wallet_disconnected');
    }
    setWalletKeyState(key);
    syncWalletToStorageAndCookies(key);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: key } }));
    }
    if (key) {
      try {
        router.push('/dashboard');
      } catch (_) {}
    }
  }, [syncWalletToStorageAndCookies, router]);

  const setNetwork = useCallback((net: 'testnet' | 'mainnet') => {
    setNetworkState('testnet');
    syncNetworkToStorageAndCookies('testnet');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-network-updated', { detail: { network: 'testnet' } }));
    }
  }, [syncNetworkToStorageAndCookies]);

  const toggleNetwork = useCallback(() => {
    // Contract is currently deployed on Testnet
    setNetwork('testnet');
  }, [setNetwork]);

  // Initial client hydration check and live wallet watcher
  useEffect(() => {
    try {
      const isExplicitlyDisconnected = localStorage.getItem('solace_wallet_disconnected') === 'true';
      if (isExplicitlyDisconnected) {
        setWalletKeyState('');
        syncWalletToStorageAndCookies('');
      } else {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored && /^G[A-Z0-9]{55}$/.test(stored)) {
          setWalletKeyState(stored);
          syncWalletToStorageAndCookies(stored);
        } else {
          setWalletKeyState('');
        }
      }
      localStorage.setItem('solace-network', 'testnet');
      document.cookie = `solace_network=testnet; path=/; max-age=31536000; SameSite=Lax`;
      setNetworkState('testnet');
    } catch (_) {}

    checkFreighterInstalled().then((installed) => {
      setFreighterReady(installed);
    });

    // Real-time WatchWalletChanges from Freighter extension:
    // CRITICAL: NEVER auto-connect an unauthenticated visitor!
    // Only update if the user has already explicitly authenticated and switches accounts in Freighter.
    let watcher: any = null;
    try {
      if (typeof window !== 'undefined' && WatchWalletChanges) {
        watcher = new WatchWalletChanges(2000);
        watcher.watch((params: any) => {
          setWalletKeyState((currentKey) => {
            // If the user has not connected or has logged out, DO NOT auto-connect
            if (!currentKey) return '';
            
            if (params && params.address && /^G[A-Z0-9]{55}$/.test(params.address)) {
              if (params.address !== currentKey) {
                syncWalletToStorageAndCookies(params.address);
                return params.address;
              }
            } else if (!params || !params.address) {
              syncWalletToStorageAndCookies('');
              return '';
            }
            return currentKey;
          });
        });
      }
    } catch (_) {}

    const handleWalletEvent = (e: any) => {
      const key = e.detail?.walletKey ?? (typeof window !== 'undefined' ? localStorage.getItem('solace_connected_wallet') : '') ?? '';
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
    };

    const handleNetworkEvent = () => {
      setNetworkState('testnet');
    };

    window.addEventListener('solace-wallet-updated', handleWalletEvent);
    window.addEventListener('solace-network-updated', handleNetworkEvent);

    return () => {
      if (watcher && typeof watcher.stop === 'function') {
        try {
          watcher.stop();
        } catch (_) {}
      }
      window.removeEventListener('solace-wallet-updated', handleWalletEvent);
      window.removeEventListener('solace-network-updated', handleNetworkEvent);
    };
  }, [syncWalletToStorageAndCookies, syncNetworkToStorageAndCookies]);

  /**
   * Cryptographic challenge authentication workflow
   */
  const authenticate = async (
    action: 'solace-auth-login' | 'solace-admin-login' = 'solace-auth-login'
  ): Promise<AuthUser> => {
    setConnecting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      // 1. Get wallet address
      const key = await freighterConnect();
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);

      // 2. Perform cryptographic challenge authentication
      const authRes = await authenticateWalletSession(key, action);
      setUser(authRes.user);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('solace-wallet-updated', { detail: { walletKey: key, user: authRes.user } })
        );
      }

      return authRes.user;
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Standard wallet connect (backward-compatible)
   */
  const connect = async (): Promise<string> => {
    setConnecting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      const key = await freighterConnect();
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: key } }));
      }

      // Establish authenticated session on backend in background
      authenticateWalletSession(key, 'solace-auth-login')
        .then((authRes) => setUser(authRes.user))
        .catch(() => {});

      // Automatically navigate to dashboard upon connection
      try {
        router.push('/dashboard');
      } catch (_) {}
      return key;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletKeyState('');
    setUser(null);
    logoutUserSession();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('solace_connected_wallet');
        localStorage.removeItem('solace_auth_token');
        localStorage.removeItem('solace_user_role');
        localStorage.setItem('solace_wallet_disconnected', 'true');
        document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'solace_connected_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: '', user: null } }));
      window.location.href = '/';
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletKey,
        user,
        isAdmin,
        isSuperAdmin,
        network,
        connecting,
        freighterReady,
        connect,
        authenticate,
        disconnect,
        setNetwork,
        toggleNetwork,
        setWalletKeyDirectly,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
