"use client"

import { useState } from "react"
import Main from "./components/Main";
import Login from "./components/Login";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-12">
      {!isLoggedIn ? (
        <Login onSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <div className="w-full flex flex-col items-center">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="self-end mb-4 text-sm text-gray-500 hover:underline cursor-pointer"
          >
            Log Out
          </button>
          <Main />
        </div>
      )}
    </main>
  )
}
