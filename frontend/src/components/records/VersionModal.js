import React, { useState } from "react";

export default function VersionModal({ currentVersion, onClose, onSubmit }) {
  const bumpPatch = (v) => {
    const parts = v.split(".").map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join(".");
  };

  const [newVersion, setNewVersion] = useState(bumpPatch(currentVersion));
  const [changelog, setChangelog] = useState("");

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card" style={{ width: 440, padding: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3>Create New Version</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Current Version</label>
          <div style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontSize: "14px" }}>v{currentVersion}</div>
        </div>

        <div className="form-group">
          <label className="form-label">New Version *</label>
          <input className="input" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Changelog</label>
          <textarea className="textarea" value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="What changed in this version?" style={{ minHeight: 80 }} />
        </div>

        <div className="flex items-center gap-3" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => onSubmit({ new_version: newVersion, changelog })}>
            ⊕ Create Version
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
