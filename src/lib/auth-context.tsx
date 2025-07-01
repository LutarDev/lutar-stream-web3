"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { signLoginPayload } from "thirdweb/auth";

interface User {
  address: string;
  token: string;
  streamToken: string;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const account = useActiveAccount();
  const wallet = useActiveWallet();

  useEffect(() => {
    // Check for existing tokens on mount
    const token = localStorage.getItem("jwt");
    const streamToken = localStorage.getItem("streamToken");
    const address = localStorage.getItem("address");

    if (token && streamToken && address) {
      setUser({ address, token, streamToken });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, []);

  const login = async () => {
    if (!account?.address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!wallet) {
      alert("No wallet instance found.");
      return;
    }

    // 1. Fetch the login payload from your backend
    const payloadRes = await axios.get("/api/auth/login-payload", {
      params: { address: account.address }
    });
    const loginPayload = payloadRes.data; // This should be a full EIP-4361 payload

    // 2. Sign the payload
    const { signature } = await signLoginPayload({ payload: loginPayload, account });

    // 3. Send to backend for verification and JWT issuance
    const response = await axios.post("/api/auth/login", {
      payload: loginPayload,
      signature,
    });

    const { token, streamToken, address } = response.data;

    // Store tokens
    localStorage.setItem("jwt", token);
    localStorage.setItem("streamToken", streamToken);
    localStorage.setItem("address", address);

    // Set axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser({ address, token, streamToken });
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("streamToken");
    localStorage.removeItem("address");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    // Optionally, disconnect wallet here if you want
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
