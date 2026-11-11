'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  connectWallet as freighterConnect,
  detectWalletNetwork,
  getFreighterNetworkDetails,
  type FreighterNetworkResult,
  checkFreighterInstalled,
  WatchWalletChanges,
  authenticateWalletSession,
  loginWalletSession,
  fetchCurrentUserSession,
  logoutUserSession,
  registerWithEmail as apiRegisterEmail,
  loginWithEmail as apiLoginEmail,
  linkWalletToAccount as apiLinkWallet,
  type AuthUser,
} from '../utils/solaceService';
import NetworkSwitchModal from '../components/auth/NetworkSwitchModal';

interface WalletContextType {
  walletKey: string;
  user: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  network: 'testnet' | 'mainnet';
  walletNetwork: string;
  networkMismatch: boolean;
  showNetworkModal: boolean;
  setShowNetworkModal: (show: boolean) => void;
  checkWalletNetwork: () => Promise<boolean>;
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
  const [detectedWalletNetwork, setDetectedWalletNetwork] = useState<string>('TESTNET');
  const [networkMismatch, setNetworkMismatch] = useState<boolean>(false);
  const [showNetworkModal, setShowNetworkModal] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [freighterReady, setFreighterReady] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');

  // Load authenticated session on mount ONLY if active verified token or session cookie exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDisconnected = localStorage.getItem('solace_wallet_disconnected') === 'true';
      const token = localStorage.getItem('solace_auth_token');
      const hasCookie = document.cookie.includes('solace_session=');
      if (isDisconnected || (!token && !hasCookie)) {
        setUser(null);
        setWalletKeyState('');
        try {
          localStorage.removeItem('solace_connected_wallet');
          localStorage.removeItem('solace_auth_token');
          localStorage.removeItem('solace_user_role');
          document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
          document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
        } catch (_) {}
        return;
      }
    }

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
          localStorage.setItem('solace_wallet_disconnected', 'true');
          document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
          document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
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
      window.removeEventListener('solace-wallet-updated', handleWalletEvent);
      window.removeEventListener('solace-network-updated', handleNetworkEvent);
    };
  }, [syncWalletToStorageAndCookies, syncNetworkToStorageAndCookies]);

  const checkWalletNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const netInfo = await getFreighterNetworkDetails();
      if (netInfo && !netInfo.isTestnet) {
        setDetectedWalletNetwork(netInfo.network);
        setNetworkMismatch(true);
        setShowNetworkModal(true);
        return false;
      }
      setDetectedWalletNetwork('TESTNET');
      setNetworkMismatch(false);
      setShowNetworkModal(false);
      return true;
    } catch (_) {
      return true;
    }
  }, []);

  // Listen for window focus to check wallet network changes without continuous polling loops (prevents EventEmitter memory leaks)
  useEffect(() => {
    if (!walletKey || typeof window === 'undefined') {
      return;
    }

    const handleWindowFocus = () => {
      checkWalletNetwork();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [walletKey, checkWalletNetwork]);

  /**
   * Cryptographic challenge authentication workflow.
   * Prompts wallet to unlock with password and sign cryptographic challenge.
   */
  const authenticate = async (
    action: 'solace-auth-login' | 'solace-admin-login' = 'solace-auth-login'
  ): Promise<AuthUser> => {
    setConnecting(true);
    try {
      // 1. Network Guard: Check network FIRST before requesting signature
      const netInfo = await getFreighterNetworkDetails();
      if (netInfo && !netInfo.isTestnet) {
        setDetectedWalletNetwork(netInfo.network);
        setNetworkMismatch(true);
        setShowNetworkModal(true);
        throw new Error(`NETWORK_MISMATCH: Freighter is currently connected to ${netInfo.network}. Please switch to Stellar Testnet (Protocol 22) in your Freighter extension.`);
      }

      // 2. Prompt Freighter to unlock and approve access (requires password)
      const key = await freighterConnect();
      if (!key || !/^G[A-Z0-9]{55}$/.test(key)) {
        throw new Error('Wallet authorization was cancelled. Please unlock Freighter and approve access.');
      }

      // 3. Cryptographically authenticate via challenge signature
      const authRes = await authenticateWalletSession(key, action);
      if (!authRes || !authRes.success || !authRes.user) {
        throw new Error('Authentication signature verification failed.');
      }

      const authUser = authRes.user;

      // 4. ONLY ONCE AUTHENTICATED: Set session state and storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      setUser(authUser);
      setNetworkMismatch(false);
      setShowNetworkModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('solace-wallet-updated', { detail: { walletKey: key, user: authUser } })
        );
      }

      return authUser;
    } catch (err: any) {
      // On ANY cancellation or failure: strictly wipe state and DO NOT allow system access
      setUser(null);
      setWalletKeyState('');
      syncWalletToStorageAndCookies('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('solace_wallet_disconnected', 'true');
        localStorage.removeItem('solace_connected_wallet');
        localStorage.removeItem('solace_auth_token');
        localStorage.removeItem('solace_user_role');
        document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
      }
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Standard wallet connect:
   * Prompts user to unlock Freighter with their password, verifies session on backend,
   * without auto-redirecting or falling back on cancellation.
   */
  const connect = async (): Promise<string> => {
    setConnecting(true);
    try {
      // 1. Network Guard: Check network FIRST
      const netInfo = await getFreighterNetworkDetails();
      if (netInfo && !netInfo.isTestnet) {
        setDetectedWalletNetwork(netInfo.network);
        setNetworkMismatch(true);
        setShowNetworkModal(true);
        throw new Error(`NETWORK_MISMATCH: Freighter is currently connected to ${netInfo.network}. Please switch to Stellar Testnet (Protocol 22) in your Freighter extension.`);
      }

      // 2. Prompt Freighter to unlock and request access (user MUST type password in Freighter)
      const key = await freighterConnect();
      if (!key || !/^G[A-Z0-9]{55}$/.test(key)) {
        throw new Error('Wallet authorization was cancelled. Please unlock Freighter and approve access.');
      }

      // 3. Establish cryptographically verified session on backend
      const authRes = await authenticateWalletSession(key, 'solace-auth-login');
      if (!authRes || !authRes.success || !authRes.user) {
        throw new Error('Wallet authentication failed.');
      }

      const authUser = authRes.user;

      // 4. Set session state and storage ONLY on successful verification
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solace_wallet_disconnected');
      }
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      setUser(authUser);
      setNetworkMismatch(false);
      setShowNetworkModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('solace-wallet-updated', { detail: { walletKey: key, user: authUser } })
        );
      }

      return key;
    } catch (err: any) {
      // On ANY cancellation or failure: strictly wipe state and DO NOT auto-connect
      setUser(null);
      setWalletKeyState('');
      syncWalletToStorageAndCookies('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('solace_wallet_disconnected', 'true');
        localStorage.removeItem('solace_connected_wallet');
        localStorage.removeItem('solace_auth_token');
        localStorage.removeItem('solace_user_role');
        document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
      }
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
    setNetworkMismatch(false);
    setShowNetworkModal(false);
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

  const handleRecheckAndConnect = async (): Promise<boolean> => {
    try {
      const netInfo = await getFreighterNetworkDetails();
      if (!netInfo || netInfo.isTestnet) {
        setDetectedWalletNetwork('TESTNET');
        setNetworkMismatch(false);
        setShowNetworkModal(false);
        await connect();
        return true;
      }
      setDetectedWalletNetwork(netInfo.network);
      setNetworkMismatch(true);
      return false;
    } catch (err: any) {
      if (err?.message?.includes('NETWORK_MISMATCH')) {
        return false;
      }
      throw err;
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
        walletNetwork: detectedWalletNetwork,
        networkMismatch,
        showNetworkModal,
        setShowNetworkModal,
        checkWalletNetwork,
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
      <NetworkSwitchModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        currentNetwork={detectedWalletNetwork}
        requiredNetwork="Stellar Testnet (Protocol 22)"
        onRecheckAndConnect={handleRecheckAndConnect}
      />
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
