import React from 'react';
import { SemanticProcessor } from '../engine/SemanticProcessor';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export default function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query.trim()) return <>{text}</>;

  const pattern = SemanticProcessor.buildHighlightRegex(query);
  
  if (!pattern) return <>{text}</>;

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => 
        index % 2 === 1 ? (
          <mark key={index} className="highlight-match">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
