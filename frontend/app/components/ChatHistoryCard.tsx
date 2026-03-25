"use client";

interface ChatHistoryCardProps {
  username: string;
  question: string;
  answer: string;
  fileName: string;
}

export default function ChatHistoryCard({ username, question, answer, fileName }: ChatHistoryCardProps) {
  return (
    <div className="w-full max-w-6xl border border-gray-200 dark:border-zinc-700 rounded-lg p-4 flex flex-col gap-2 bg-white dark:bg-zinc-800">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {username}: {question}
      </p>
      <p className="text-base whitespace-pre-wrap text-left text-gray-800 dark:text-gray-100 flex-1">
        {answer}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {fileName}
      </p>
    </div>
  );
}
