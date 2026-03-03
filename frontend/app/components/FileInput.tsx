"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './FileInput.module.css';

interface FileInputProps {
  onFileSelect: (file: File | null) => void;
  tokens?: number | null;
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect, tokens }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert("Unsupported file type. Please select a .pdf, .md, or .txt file.");
        setSelectedFile(null);
        onFileSelect(null);
      }
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
        if (fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
        }
      } else {
        alert("Unsupported file type. Please select a .pdf, .md, or .txt file.");
        setSelectedFile(null);
        onFileSelect(null);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isValidFile = (file: File) => {
    const acceptedTypes = ['.pdf', '.md', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    return acceptedTypes.includes(fileExtension.toLowerCase());
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.md,.txt"
        style={{ display: 'none' }}
      />
      {selectedFile ? (
        <>
          <p>Selected file: {selectedFile.name}</p>
          {tokens !== undefined && tokens !== null && (
            <p className={styles.tokens}>{tokens} tokens</p>
          )}
        </>
      ) : (
        <p>Drag & drop a file here, or click to select a file</p>
      )}
    </div>
  );
};

export default FileInput;
