"use client"

import { useState } from "react"
import FileInput from "./components/FileInput";
import StreamingTextDisplay from "./components/StreamingTextDisplay"; // Import new component

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {/* Container for title, file input, and button (constrained width) */}
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mb-8">
        <h1 className="text-4xl text-center">doc-summarizer</h1>

        <FileInput onFileSelect={setFile} />

        {file && (
          <button 
            onClick={handleUpload} 
            className="bg-yellow-400 text-white px-6 py-3 rounded-lg text-md hover:bg-yellow-500 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        )}
      </div>

      {/* Result display (potentially wider) */}
      {result && (
        <pre className="p-4 rounded whitespace-pre-wrap w-full max-w-7xl text-center">
          <StreamingTextDisplay text={result.message} />
        </pre>
      )}
    </main>
  )
}