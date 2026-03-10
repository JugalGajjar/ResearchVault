import React, { useState } from "react";
import { useQuery } from "react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getRecords } from "../api";
import { TYPE_COLORS, STATUS_COLORS, TYPE_ICONS, formatBytes, formatDate } from "../utils";

const TYPES = ["", "paper", "dataset", "software", "report", "presentation"];
const STATUSES = ["", "published", "draft", "archived"];

export default function RecordsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const typeFilter = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || "";

  const { data, isLoading } = useQuery(
    ["records", page, typeFilter, statusFilter],
    () => getRecords({ page, per_page: 10, type: typeFilter || undefined, status: statusFilter || undefined }),
    { select: (r) => r.data, keepPreviousData: true }
  );

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h2>Records</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "13px" }}>
            {data?.total ?? "—"} records total
          </p>
        </div>
        <Link to="/records/new" className="btn btn-primary">+ New Record</Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select className="select" style={{ width: "auto" }} value={typeFilter} onChange={(e) => setFilter("type", e.target.value)}>
          {TYPES.map((t) => <option key={t} value={t}>{t || "All Types"}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setFilter("status", e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {["Title", "Type", "Status", "Authors", "Date", "DOI", ""].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--text-muted)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center" }}><span className="spinner" /></td></tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                  No records found. <Link to="/records/new">Create the first one →</Link>
                </td>
              </tr>
            ) : (
              data?.items?.map((record) => (
                <tr key={record.id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 14px", maxWidth: 280 }}>
                    <Link to={`/records/${record.id}`} style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px" }} className="truncate" title={record.title}>
                      <span style={{ marginRight: 6 }}>{TYPE_ICONS[record.record_type]}</span>
                      {record.title}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className={`badge ${TYPE_COLORS[record.record_type]}`}>{record.record_type}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className={`badge ${STATUS_COLORS[record.status]}`}>{record.status}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "12px", maxWidth: 160 }} className="truncate">
                    {record.authors?.map((a) => a.name).join(", ") || "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {formatDate(record.publication_date || record.created_at)}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "11px", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", maxWidth: 160 }} className="truncate">
                    {record.doi || "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Link to={`/records/${record.id}`} className="btn btn-secondary btn-sm">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center gap-2" style={{ marginTop: 16, justifyContent: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setFilter("page", page - 1)}>← Prev</button>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Page {page} of {data.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === data.pages} onClick={() => setFilter("page", page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
