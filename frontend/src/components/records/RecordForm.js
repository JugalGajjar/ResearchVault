import React, { useState } from "react";

const TYPES = ["paper", "dataset", "software", "report", "presentation"];
const LICENSES = ["CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "MIT", "Apache-2.0", "GPL-3.0", "Proprietary"];

export default function RecordForm({ initialData = {}, onSubmit, isLoading, submitLabel = "Save" }) {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    record_type: "paper",
    version: "1.0.0",
    license: "CC-BY-4.0",
    status: "draft",
    publication_date: "",
    ...initialData,
  });

  const [authorsInput, setAuthorsInput] = useState(
    (initialData.authors || []).map((a) => `${a.name}${a.affiliation ? " (" + a.affiliation + ")" : ""}${a.orcid ? " [" + a.orcid + "]" : ""}`).join("\n")
  );
  const [tagsInput, setTagsInput] = useState(
    (initialData.tags || []).map((t) => t.name).join(", ")
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    return e;
  };

  const parseAuthors = (text) =>
    text.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const orcidMatch = line.match(/\[([^\]]+)\]/);
        const affMatch = line.match(/\(([^)]+)\)/);
        const name = line.replace(/\[[^\]]+\]/, "").replace(/\([^)]+\)/, "").trim();
        return { name, orcid: orcidMatch?.[1], affiliation: affMatch?.[1] };
      });

  const parseTags = (text) =>
    text.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).map((name) => ({ name }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      authors: parseAuthors(authorsInput),
      tags: parseTags(tagsInput),
      publication_date: form.publication_date || null,
    });
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left */}
        <div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className={`input ${errors.title ? "border-red" : ""}`} value={form.title} onChange={set("title")} placeholder="Enter a descriptive title..." />
            {errors.title && <div style={{ color: "var(--accent-red)", fontSize: "11px", marginTop: 4 }}>{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Abstract</label>
            <textarea className="textarea" value={form.abstract} onChange={set("abstract")} placeholder="Describe the content, methodology, and significance..." style={{ minHeight: 120 }} />
          </div>

          <div className="form-group">
            <label className="form-label">
              Authors <span style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 400 }}>(one per line — Name (Affiliation) [ORCID])</span>
            </label>
            <textarea
              className="textarea"
              value={authorsInput}
              onChange={(e) => setAuthorsInput(e.target.value)}
              placeholder={"J. Smith (University of Geneva) [0000-0001-2345-6789]\nM. Alioto (CERN)"}
              style={{ minHeight: 80 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags <span style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 400 }}>(comma separated)</span></label>
            <input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. machine-learning, particle-physics, open-data" />
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="form-group">
            <label className="form-label">Record Type</label>
            <select className="select" value={form.record_type} onChange={set("record_type")}>
              {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="select" value={form.status} onChange={set("status")}>
              {["draft", "published", "archived"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">License</label>
            <select className="select" value={form.license} onChange={set("license")}>
              {LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Version</label>
              <input className="input" value={form.version} onChange={set("version")} placeholder="1.0.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Publication Date</label>
              <input className="input" type="date" value={form.publication_date || ""} onChange={set("publication_date")} />
            </div>
          </div>

          <div style={{
            padding: "14px",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            marginTop: 8,
          }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              Preview
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", marginBottom: 6 }}>
              {form.title || <span style={{ color: "var(--text-muted)" }}>Untitled Record</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-blue">{form.record_type}</span>
              <span className="badge badge-amber">{form.status}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>v{form.version}</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : submitLabel}
        </button>
      </div>
    </form>
  );
}
