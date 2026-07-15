import React, { useState } from "react";

export default function CopyableText({ text, children, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span 
      className={`copyable-text-container d-inline-flex align-items-center gap-1 ${className}`}
      onClick={handleCopy}
      title="Click to copy"
      style={{ 
        cursor: "pointer", 
        borderBottom: "1px dashed rgba(25, 135, 84, 0.4)",
        paddingBottom: "1px"
      }}
    >
      {children || <span className="font-monospace">{text}</span>}
      {copied ? (
        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "12px" }}></i>
      ) : (
        <i className="bi bi-clipboard text-muted" style={{ fontSize: "11px" }}></i>
      )}
    </span>
  );
}

/**
 * Helper to parse a text block and wrap any detected invoice numbers (starting with INV-, PUR-, etc.)
 * in the CopyableText component.
 */
export function CopyableTextParser({ text = "", className = "" }) {
  if (!text) return "";

  // Regex to match typical invoice patterns: e.g. INV-20231012-123456-7890 or SUP-INV-10214
  // Matches words containing INV- or PUR-
  const invoiceRegex = /\b((?:[A-Z0-9]+-)?(?:INV|PUR|SUP-INV)-[A-Za-z0-9-]+)\b/g;

  const parts = text.split(invoiceRegex);
  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Since we split by regex capturing group, every odd index is a match
        if (index % 2 === 1) {
          return <CopyableText key={index} text={part} className="mx-1" />;
        }
        return part;
      })}
    </span>
  );
}
