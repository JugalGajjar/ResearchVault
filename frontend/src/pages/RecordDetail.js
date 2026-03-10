import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRecord, publishRecord, deleteRecord, uploadFile, getDownloadUrl, addVersion } from "../api";
import { TYPE_COLORS, STATUS_COLORS, TYPE_ICONS, formatBytes, formatDate } from "../utils";
import FileUpload from "../components/records/FileUpload";
import VersionModal from "../components/records/VersionModal";

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showVersionModal, setShowVersionModal] = useState(false);

  const { data: record, isLoading, error } = useQuery(
    ["record", id],
    () => getRecord(id),
    { select: (r) => r.data }
  );

  const publishMutation = useMutation(() => publishRecord(id), {
    onSuccess: () => queryClient.invalidateQueries(["record", id]),
  });

  const deleteMutation = useMutation(() => deleteRecord(id), {
    onSuccess: () => navigate("/records"),
  });

  const uploadMutation = useMutation(
    ({ file, onProgress }) => uploadFile(id, file, onProgress),
    { onSuccess: () => queryClient.invalidateQueries(["record", id]) }
  );

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><span className="spinner" /></div>;
  if (error || !record) return <div className="alert alert-error">Record not found.</div>;

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: "12px", color: "var(--text-muted)" }}>
        <Link to="/records" style={{ color: "var(--text-muted)" }}>Records</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "var(--text-secondary)" }}>{record.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Main */}
        <div>
          {/* Header card */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: "24px" }}>{TYPE_ICONS[record.record_type]}</span>
              <span className={`badge ${TYPE_COLORS[record.record_type]}`}>{record.record_type}</span>
              <span className={`badge ${STATUS_COLORS[record.status]}`}>{record.status}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>v{record.version}</span>
            </div>

            <h2 style={{ marginBottom: 12, lineHeight: 1.3 }}>{record.title}</h2>

            {record.authors?.length > 0 && (
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {record.authors.map((a, i) => (
                  <span key={i} style={{
                    padding: "4px 10px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}>
                    {a.name}
                    {a.affiliation && <span style={{ color: "var(--text-muted)" }}> · {a.affiliation}</span>}
                  </span>
                ))}
              </div>
            )}

            {record.doi && (
              <div style={{ marginBottom: 12, fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>DOI: </span>
                <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{record.doi}</span>
              </div>
            )}

            {record.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {record.tags.map((t, i) => (
                  <Link key={i} to={`/search?tags=${t.name}`} className="tag">#{t.name}</Link>
                ))}
              </div>
            )}
          </div>

          {/* Abstract */}
          {record.abstract && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12, color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Abstract</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "13px" }}>{record.abstract}</p>
            </div>
          )}

          {/* File upload */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14 }}>Attached File</h3>
            {record.file_name ? (
              <div className="flex items-center justify-between" style={{
                padding: "12px 14px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}>
                <div>
                  <div style={{ color: "var(--text-primary)", fontSize: "13px" }}>{record.file_name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: 2 }}>{formatBytes(record.file_size)}</div>
                </div>
                <a href={getDownloadUrl(id)} className="btn btn-secondary btn-sm" download>↓ Download</a>
              </div>
            ) : (
              <FileUpload
                onUpload={(file, onProgress) => uploadMutation.mutate({ file, onProgress })}
                isUploading={uploadMutation.isLoading}
              />
            )}
          </div>

          {/* Version history */}
          {record.versions?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Version History</h3>
              {record.versions.map((v, i) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  marginBottom: 8,
                  fontSize: "13px",
                }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>v{v.version}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{formatDate(v.created_at)}</span>
                  </div>
                  {v.changelog && <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>{v.changelog}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Actions */}
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link to={`/records/${id}/edit`} className="btn btn-secondary" style={{ justifyContent: "center" }}>
                ✎ Edit Record
              </Link>
              {record.status === "draft" && (
                <button
                  className="btn btn-success"
                  style={{ justifyContent: "center" }}
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isLoading}
                >
                  {publishMutation.isLoading ? "Publishing..." : "✓ Publish"}
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "center" }}
                onClick={() => setShowVersionModal(true)}
              >
                ⊕ New Version
              </button>
              <hr className="divider" />
              <button
                className="btn btn-danger"
                style={{ justifyContent: "center" }}
                onClick={() => window.confirm("Delete this record?") && deleteMutation.mutate()}
                disabled={deleteMutation.isLoading}
              >
                ✕ Delete
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Metadata</h3>
            {[
              ["License", record.license],
              ["Published", formatDate(record.publication_date)],
              ["Created", formatDate(record.created_at)],
              ["Updated", formatDate(record.updated_at)],
              ["ID", record.id?.slice(0, 10) + "..."],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: 2, fontFamily: "var(--font-mono)" }}>{value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showVersionModal && (
        <VersionModal
          currentVersion={record.version}
          onClose={() => setShowVersionModal(false)}
          onSubmit={(data) => {
            addVersion(id, data).then(() => {
              queryClient.invalidateQueries(["record", id]);
              setShowVersionModal(false);
            });
          }}
        />
      )}
    </div>
  );
}
