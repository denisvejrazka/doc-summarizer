"use client"

import { useState, useRef, useEffect } from "react"
import FileInput from "./FileInput";
import StreamingTextDisplay from "./StreamingTextDisplay";
import ChatHistoryCard from "./ChatHistoryCard";

interface HistoryEntry {
  question: string;
  answer: string;
  fileName: string;
}

interface MainProps {
  tier?: string;
  username?: string;
}

export default function Main({ tier = "standard", username = "User" }: MainProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string } | null>(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false); 
  const [isProMode, setIsProMode] = useState(false); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastQueryRef = useRef<string>("");
  const lastAnswerRef = useRef<string>("");

  const searchTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isSearchVisible && searchTextAreaRef.current) {
      searchTextAreaRef.current.focus();
    }
  }, [isSearchVisible]);

  useEffect(() => {
    if (searchTextAreaRef.current) {
      searchTextAreaRef.current.style.height = "0px";
      const scrollHeight = searchTextAreaRef.current.scrollHeight;
      searchTextAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [searchQuery]);


  const handleSearch = async () => {
    if (!searchQuery) return;
    if (!documentId) {
      setResult({ message: "Document is still being processed or upload failed. Please wait or try again." });
      return;
    }

    // Save previous Q&A to history before starting new search
    const prevQuery = lastQueryRef.current;
    const prevAnswer = lastAnswerRef.current;
    if (prevAnswer && prevQuery && file) {
      setHistory((prev) => [
        ...prev,
        { question: prevQuery, answer: prevAnswer, fileName: file.name },
      ]);
    }

    lastQueryRef.current = searchQuery;
    lastAnswerRef.current = "";
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          document_id: documentId,
          query: searchQuery,
          mode: isProMode ? "pro" : "standard"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setResult({ message: `Search failed: ${errorData.detail || "Unknown error"}` });
        setLoading(false);
        return;
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setResult({ message: "" });
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value);
        setResult({ message: accumulatedText });
      }
      lastAnswerRef.current = accumulatedText;
    } catch (err) {
      console.error("Search failed:", err);
      setResult({ message: "An error occurred while searching. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

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
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        setResult({ message: `Summarization failed: ${errorData.detail || "Unknown error"}` });
        setLoading(false);
        return;
      }

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
      console.error(err);
      setResult({ message: "An error occurred while summarizing. Please try again." });
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
      if (res.ok) {
        const data = await res.json();
        setTokens(data.total_tokens);
      }

      const uploadRes = await fetch("http://localhost:8000/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        console.error("Upload failed:", errorData.detail);
        setResult({ message: `Upload failed: ${errorData.detail}. Search will not be available.` });
        return;
      }

      const uploadData = await uploadRes.json();
      setDocumentId(uploadData.document_id)
    } catch (err) {
      console.error("Error during upload/token count:", err);
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
            <div className="relative min-h-[48px] w-full flex justify-center items-center">
            {/* Search View */}
            <div className={`w-full flex gap-2 items-start transition-all duration-300 ${isSearchVisible ? 'relative opacity-100 scale-100 z-10' : 'absolute opacity-0 scale-95 pointer-events-none'}`}>
              <textarea
                ref={searchTextAreaRef}
                placeholder="Search the document..."
                value={searchQuery}
                rows={1}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 min-h-[48px] max-h-[300px] resize-none overflow-hidden bg-white dark:bg-zinc-800 transition-all"
              />
              <button
                onClick={handleSearch}
                className="bg-yellow-400 text-white px-2 py-3 rounded-lg hover:bg-yellow-500 cursor-pointer h-12 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
              <button
                onClick={() => setIsSearchVisible(false)}
                className="bg-yellow-400 text-white px-4 py-3 rounded-lg hover:bg-yellow-500 cursor-pointer h-12"
              >
                Back
              </button>
            </div>

            {/* Default Buttons View */}
            <div className={`flex gap-1 h-12 transition-all duration-300 ${!isSearchVisible ? 'relative opacity-100 scale-100 z-10' : 'absolute opacity-0 scale-95 pointer-events-none'}`}>
              {/* Mode selection */}
              {tier === "pro" && (
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
              )}

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
                className={`bg-yellow-400 text-white px-6 py-3 text-lg hover:bg-yellow-500 disabled:bg-gray-400 cursor-pointer h-full flex items-center ${tier === "standard" ? 'rounded-lg' : 'rounded-r-lg'}`}
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

      {/* Chat history */}
      {history.length > 0 && (
        <div className="flex flex-col gap-4 w-full max-w-6xl mb-4">
          {history.map((entry, i) => (
            <ChatHistoryCard
              key={i}
              username={username}
              question={entry.question}
              answer={entry.answer}
              fileName={entry.fileName}
            />
          ))}
        </div>
      )}
    </div>
  )
}
