"use client";

import React, { useState, useEffect } from 'react';

interface StreamingTextDisplayProps {
  text: string;
}

const StreamingTextDisplay: React.FC<StreamingTextDisplayProps> = ({ text: fullText }) => {
  const [displayedText, setDisplayedText] = useState("");
  const typingSpeed = 10;

  useEffect(() => {
    // Reset the animation when the input text changes
    setDisplayedText("");
  }, [fullText]);

  useEffect(() => {
    if (!fullText) return;

    // This effect creates a chain of timeouts to "type" the text
    if (displayedText.length < fullText.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, typingSpeed);

      return () => clearTimeout(timeoutId);
    }
  }, [displayedText, fullText]);

  return (
    <span className="whitespace-pre-wrap">{displayedText}</span>
  );
};

export default StreamingTextDisplay;
