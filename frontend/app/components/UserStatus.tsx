"use client";

interface UserStatusProps {
  username: string;
  onLogout: () => void;
}

export default function UserStatus({ username, onLogout }: UserStatusProps) {
  return (
    <div className="absolute top-6 right-8 flex items-center gap-4 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2 px-3 border-r border-gray-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-sm">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {username}
        </span>
      </div>
      <button
        onClick={onLogout}
        className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
