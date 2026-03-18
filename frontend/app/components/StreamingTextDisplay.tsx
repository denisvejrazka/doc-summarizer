"use client";

import React, { useState, useEffect, useRef } from 'react';

interface StreamingTextDisplayProps {
  text: string;
}

const StreamingTextDisplay: React.FC<StreamingTextDisplayProps> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const targetTextRef = useRef(text);
  const currentTextRef = useRef("");
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    if (text === "" || text.length < currentTextRef.current.length) {
      currentTextRef.current = "";
      setDisplayedText("");
    }
    targetTextRef.current = text;
  }, [text]);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      // Calculate how many characters to add based on time passed
      // This creates a smoother "typing" effect even if data arrives in chunks
      const deltaTime = time - lastUpdateTimeRef.current;
      
      // Update at most every ~16ms (60fps)
      if (deltaTime >= 16) {
        if (currentTextRef.current.length < targetTextRef.current.length) {
          // If we are far behind, catch up faster. 
          // Minimum 1 char, but more if the gap is large.
          const gap = targetTextRef.current.length - currentTextRef.current.length;
          // Slower catch-up: fewer characters per update
          const charsToAdd = Math.max(1, Math.floor(gap / 15)); 
          
          currentTextRef.current += targetTextRef.current.slice(
            currentTextRef.current.length,
            currentTextRef.current.length + charsToAdd
          );
          
          setDisplayedText(currentTextRef.current);
          lastUpdateTimeRef.current = time;
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <span className="whitespace-pre-wrap">{displayedText}</span>
  );
};

export default StreamingTextDisplay;
