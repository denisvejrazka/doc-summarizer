"use client";

import { useState } from "react";

interface LoginProps {
  onSuccess?: (userData: any) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/register" : "/login";
    const payload = isRegister 
      ? { email, username, password } 
      : { username, password };

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Something went wrong");
      }

      const data = await res.json();
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800">
      <h2 className="text-3xl font-bold mb-6 text-center">
        {isRegister ? "Create Account" : "Welcome Back"}
      </h2>
      
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {isRegister && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-zinc-800"
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-zinc-800"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-zinc-800"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400 cursor-pointer"
        >
          {loading ? "Processing..." : (isRegister ? "Sign Up" : "Log In")}
        </button>
      </form>

      <button
        onClick={() => setIsRegister(!isRegister)}
        className="mt-6 text-sm text-gray-600 dark:text-gray-400 hover:underline cursor-pointer"
      >
        {isRegister 
          ? "Already have an account? Log in" 
          : "Don't have an account? Sign up"}
      </button>
    </div>
  );
}
