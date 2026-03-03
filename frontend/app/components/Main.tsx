"use client"

import { useState } from "react"
import FileInput from "./FileInput";
import StreamingTextDisplay from "./StreamingTextDisplay";

export default function Main() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string } | null>(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false); 
  const [isProMode, setIsProMode] = useState(false); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);

  const handleSummarization = async () => {
    if (!file) return
    setLoading(true)
    setResult(null);

    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", isProMode ? "pro" : "standard");

    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.body) {
        throw new Error("Response body is empty");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setResult({message: ""});

      let accumulatedText = "";
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 50; // Update UI every 50ms

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          setResult({ message: accumulatedText });
          break;
        }
        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        const now = Date.now();
        if (now - lastUpdateTime > UPDATE_INTERVAL) {
          setResult({ message: accumulatedText });
          lastUpdateTime = now;
        }
      }
    
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (selectedFile: File) => {
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch("http://localhost:8000/count_tokens", {
        method: "POST",
        body: formData
      })
      const data = await res.json();
      setTokens(data.total_tokens);
    } catch (err) {
      console.error("Error counting tokens:", err);
      setTokens(null);
    }
  }

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResult(null);
    if (selectedFile) {
      handleUpload(selectedFile);
    } else {
      setTokens(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Container for title, file input, and button (constrained width) */}
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mb-8">
        <h1 className="text-4xl text-center">doc-summarizer</h1>

        <FileInput onFileSelect={handleFileChange} tokens={tokens} />

        {file && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative h-12 w-full flex justify-center items-center">
            {/* Search View */}
            <div className={`absolute flex gap-2 h-full transition-all duration-300 ${isSearchVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <input
                type="text"
                placeholder="Search the document..."
                className="px-4 py-3 rounded-lg border-1 border-gray-300 focus:outline-none focus:border-yellow-400 h-full bg-white dark:bg-zinc-800"
              />
              <button
                onClick={() => setIsSearchVisible(false)}
                className="bg-yellow-400 text-white px-4 py-3 rounded-lg hover:bg-yellow-500 cursor-pointer h-full"
              >
                Back
              </button>
            </div>

            {/* Default Buttons View */}
            <div className={`absolute flex gap-1 h-full transition-all duration-300 ${!isSearchVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              {/* Mode selection */}
              <div className="relative h-full w-32">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`bg-yellow-400 text-white px-4 py-3 hover:bg-yellow-500 disabled:bg-gray-400 cursor-pointer flex items-center justify-between gap-1 h-full w-full text-lg transition-all ${isDropdownOpen ? 'rounded-t-lg rounded-b-none' : 'rounded-lg'}`}
                  disabled={loading}
                >
                  <span>{isProMode ? "Pro" : "Standard"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-0 w-full bg-white dark:bg-zinc-800 border border-yellow-400 rounded-b-lg shadow-lg z-10 overflow-hidden border-t-0">
                    <button
                      onClick={() => { setIsProMode(false); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 ${!isProMode ? 'bg-gray-50 dark:bg-zinc-700 font-semibold' : ''}`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => { setIsProMode(true); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 ${isProMode ? 'bg-gray-50 dark:bg-zinc-700 font-semibold' : ''}`}
                    >
                      Pro
                    </button>
                  </div>
                )}
              </div>

              {/* searching */}
              <button
                onClick={() => setIsSearchVisible(true)}
                className="bg-yellow-400 text-white p-3 rounded-lg hover:bg-yellow-500 disabled:bg-gray-400 cursor-pointer h-full flex items-center"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              {/* summarization */}
              <button 
                onClick={handleSummarization} 
                className="bg-yellow-400 text-white px-6 py-3 rounded-lg text-lg hover:bg-yellow-500 disabled:bg-gray-400 cursor-pointer h-full flex items-center"
                disabled={loading}
              >
                {loading ? "Summarizing..." : "Summarize"}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Result display */}
      {result && (
        <pre className="p-4 rounded whitespace-pre-wrap w-full max-w-6xl text-center">
          <StreamingTextDisplay text={result.message} />
        </pre>
      )}
    </div>
  )
}
