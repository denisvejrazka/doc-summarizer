"use client"

import { useState } from "react"
import Main from "./components/Main";
import Login from "./components/Login";
import UserStatus from "./components/UserStatus";

export default function Home() {
  const [user, setUser] = useState<{ username: string } | null>(null);

  const handleLoginSuccess = (userData: { username: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
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
            <Main />
          </div>
        </>
      )}
    </main>
  )
}
