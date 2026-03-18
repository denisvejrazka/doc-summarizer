"use client"

import { useState, useEffect } from "react"
import Main from "./components/Main";
import Login from "./components/Login";
import UserStatus from "./components/UserStatus";

export default function Home() {
  const [user, setUser] = useState<{ username: string, tier: string } | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    const savedTier = localStorage.getItem("tier");

    if (savedToken && savedUsername && savedTier) {
      setUser({ username: savedUsername, tier: savedTier });
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    const { access_token, username, tier } = userData;
    localStorage.setItem("token", access_token);
    localStorage.setItem("username", username);
    localStorage.setItem("tier", tier);
    setUser({ username, tier });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("tier");
    setUser(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-12 relative">
      {!user ? (
        <Login onSuccess={handleLoginSuccess} />
      ) : (
        <>
          <UserStatus username={user.username} onLogout={handleLogout} />
          <div className="w-full flex flex-col items-center">
            <Main tier={user.tier} />
          </div>
        </>
      )}
    </main>
  )
}
