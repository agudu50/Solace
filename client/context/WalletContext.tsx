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
  registerWithEmail as apiRegisterEmail,
  loginWithEmail as apiLoginEmail,
  linkWalletToAccount as apiLinkWallet,
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
  loginWithEmail: (email: string, password: string) => Promise<AuthUser>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<AuthUser>;
  linkWallet: (address: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const [walletKey, setWalletKeyState] = useState<string>('');

  // Solace is strictly in the Stellar Testnet (Protocol 22) phase
  const [network, setNetworkState] = useState<'testnet' | 'mainnet'>('testnet');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [freighterReady, setFreighterReady] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');

  // Load authenticated session on mount from verified backend token
  useEffect(() => {
    fetchCurrentUserSession().then((authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setWalletKeyState(authenticatedUser.address || '');
      } else {
        setUser(null);
        setWalletKeyState('');
        try {
          localStorage.removeItem('solace_connected_wallet');
          localStorage.removeItem('solace_auth_token');
          localStorage.removeItem('solace_user_role');
        } catch (_) {}
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
  }, [syncWalletToStorageAndCookies]);

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
      localStorage.setItem('solace-network', 'testnet');
      document.cookie = `solace_network=testnet; path=/; max-age=31536000; SameSite=Lax`;
      setNetworkState('testnet');
    } catch (_) {}

    checkFreighterInstalled().then((installed) => {
      setFreighterReady(installed);
    });

    // Real-time WatchWalletChanges from Freighter extension:
    // Only update if the user has already explicitly authenticated and switches accounts in Freighter.
    let watcher: any = null;
    try {
      if (typeof window !== 'undefined' && WatchWalletChanges) {
        watcher = new WatchWalletChanges(2000);
        watcher.watch((params: any) => {
          setWalletKeyState((currentKey) => {
            // If the user has not authenticated or has logged out, DO NOT auto-connect
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
      const key = e.detail?.walletKey ?? '';
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
   * Cryptographic challenge authentication workflow.
   * Prompts wallet to unlock and sign cryptographic challenge.
   */
  const authenticate = async (
    action: 'solace-auth-login' | 'solace-admin-login' = 'solace-auth-login'
  ): Promise<AuthUser> => {
    setConnecting(true);
    try {
      // 1. Get wallet address after Freighter unlock & access approval
      const key = await freighterConnect();
      if (!key || !/^G[A-Z0-9]{55}$/.test(key)) {
        throw new Error('Wallet authorization was cancelled. Please unlock Freighter and approve access.');
      }

      // 2. Perform cryptographic challenge signature verification
      const authRes = await authenticateWalletSession(key, action);
      if (!authRes || !authRes.success || !authRes.user) {
        throw new Error(authRes?.error || 'Cryptographic signature verification failed.');
      }

      // 3. ONLY ONCE AUTHENTICATED: Set session state and storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      setUser(authRes.user);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('solace-wallet-updated', { detail: { walletKey: key, user: authRes.user } })
        );
      }

      return authRes.user;
    } catch (err: any) {
      setUser(null);
      setWalletKeyState('');
      syncWalletToStorageAndCookies('');
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Standard wallet connect:
   * Prompts user to unlock Freighter, types password, signs challenge, verifies on backend,
   * and ONLY THEN navigates to /dashboard.
   */
  const connect = async (): Promise<string> => {
    setConnecting(true);
    try {
      // 1. Prompt Freighter to unlock and request access
      const key = await freighterConnect();
      if (!key || !/^G[A-Z0-9]{55}$/.test(key)) {
        throw new Error('Wallet authorization was cancelled. Please unlock Freighter and approve access.');
      }

      // 2. Perform cryptographic challenge authentication - user MUST sign to authenticate!
      const authRes = await authenticateWalletSession(key, 'solace-auth-login');
      if (!authRes || !authRes.success || !authRes.user) {
        throw new Error(authRes?.error || 'Cryptographic signature verification failed.');
      }

      // 3. ONLY ONCE AUTHENTICATED: Set session state and storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      setUser(authRes.user);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('solace-wallet-updated', { detail: { walletKey: key, user: authRes.user } })
        );
      }

      // 4. Navigate to dashboard ONLY AFTER full cryptographic authentication is complete!
      try {
        router.push('/dashboard');
      } catch (_) {}

      return key;
    } catch (err: any) {
      setUser(null);
      setWalletKeyState('');
      syncWalletToStorageAndCookies('');
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const activeUser = await fetchCurrentUserSession();
      if (activeUser) {
        setUser(activeUser);
        if (activeUser.address) {
          setWalletKeyState(activeUser.address);
          syncWalletToStorageAndCookies(activeUser.address);
        }
      }
    } catch (_) {}
  }, [syncWalletToStorageAndCookies]);

  const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    setConnecting(true);
    try {
      const res = await apiLoginEmail(email, pass);
      setUser(res.user);
      if (res.user.address) {
        setWalletKeyState(res.user.address);
        syncWalletToStorageAndCookies(res.user.address);
      }
      return res.user;
    } finally {
      setConnecting(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string): Promise<AuthUser> => {
    setConnecting(true);
    try {
      const res = await apiRegisterEmail(name, email, pass);
      setUser(res.user);
      return res.user;
    } finally {
      setConnecting(false);
    }
  };

  const linkWallet = async (address: string): Promise<void> => {
    setConnecting(true);
    try {
      const res = await apiLinkWallet(address);
      setWalletKeyState(res.walletAddress);
      syncWalletToStorageAndCookies(res.walletAddress);
      await refreshUser();
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
        loginWithEmail,
        registerWithEmail,
        linkWallet,
        refreshUser,
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
