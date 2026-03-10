import React, { useState, useCallback } from "react";

export default function FileUpload({ onUpload, isUploading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50 MB.");
      return;
    }
    setError("");
    onUpload(file, (p) => setProgress(p));
  }, [onUpload]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragging ? "var(--accent-blue)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          padding: "32px",
          textAlign: "center",
          background: isDragging ? "rgba(59,130,246,0.05)" : "var(--bg-secondary)",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("file-input").click()}
      >
        <div style={{ fontSize: "28px", marginBottom: 10 }}>📎</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: 6 }}>
          Drag & drop a file here, or <span style={{ color: "var(--accent-blue)" }}>click to browse</span>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
          PDF, DOC, CSV, JSON, ZIP, PY, IPYNB and more · Max 50 MB
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {isUploading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: 4, background: "var(--accent-blue)", width: `${progress}%`, transition: "width 0.2s", borderRadius: 2 }} />
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: 4 }}>Uploading... {progress}%</div>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}
