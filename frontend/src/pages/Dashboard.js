import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { getStats, getRecords } from "../api";
import { TYPE_COLORS, STATUS_COLORS, TYPE_ICONS, formatBytes, formatDate } from "../utils";

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 6 }}>
        {value ?? <span className="spinner" />}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: statsData } = useQuery("stats", getStats, { select: (r) => r.data });
  const { data: recentData } = useQuery("recent-records", () => getRecords({ per_page: 5, status: "published" }), {
    select: (r) => r.data.items,
  });

  const stats = statsData || {};

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "var(--text-primary)" }}>
          Research<span style={{ color: "var(--accent-blue)" }}>Vault</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
          Institutional repository for research outputs, datasets, and software.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Records" value={stats.total_records} accent="var(--accent-blue)" />
        <StatCard label="Published" value={stats.published} accent="var(--accent-green)" />
        <StatCard label="Authors" value={stats.total_authors} accent="var(--accent-purple)" />
        <StatCard label="Storage Used" value={formatBytes(stats.total_storage_bytes)} accent="var(--accent-cyan)" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Recent records */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3>Recent Published Records</h3>
            <Link to="/records" className="btn btn-secondary btn-sm">View all →</Link>
          </div>

          {!recentData ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}><span className="spinner" /></div>
          ) : recentData.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
              No published records yet. <Link to="/records/new">Create one →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentData.map((record) => (
                <Link
                  key={record.id}
                  to={`/records/${record.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    padding: "12px 14px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <span>{TYPE_ICONS[record.record_type]}</span>
                      <span className={`badge ${TYPE_COLORS[record.record_type]}`}>{record.record_type}</span>
                      <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px" }} className="truncate">
                        {record.title}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: "11px", color: "var(--text-muted)" }}>
                      {record.authors?.[0] && <span>{record.authors[0].name}{record.authors.length > 1 ? ` +${record.authors.length - 1}` : ""}</span>}
                      <span>{formatDate(record.publication_date || record.created_at)}</span>
                      {record.doi && <span style={{ color: "var(--accent-cyan)" }}>DOI: {record.doi}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* By type */}
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Records by Type</h3>
            {stats.by_type ? (
              Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{TYPE_ICONS[type]}</span>
                      <span className={`badge ${TYPE_COLORS[type]}`}>{type}</span>
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 2 }}>
                    <div style={{
                      height: 4,
                      width: `${(count / (stats.total_records || 1)) * 100}%`,
                      background: "var(--accent-blue)",
                      borderRadius: 2,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted text-sm">No data yet</div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link to="/records/new" className="btn btn-primary" style={{ justifyContent: "center" }}>
                + New Record
              </Link>
              <Link to="/search" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                ⊙ Search Records
              </Link>
              <Link to="/records?status=draft" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                ✎ Review Drafts ({stats.draft ?? 0})
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
