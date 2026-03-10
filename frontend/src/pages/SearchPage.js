import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { Link, useSearchParams } from "react-router-dom";
import { searchRecords } from "../api";
import { TYPE_COLORS, STATUS_COLORS, TYPE_ICONS, formatDate } from "../utils";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("q") || "");

  const q = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || "published";
  const tagsFilter = searchParams.get("tags") || "";
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    setInputValue(searchParams.get("q") || "");
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery(
    ["search", q, typeFilter, statusFilter, tagsFilter, page],
    () => searchRecords({
      q: q || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      tags: tagsFilter || undefined,
      page,
      per_page: 10,
    }),
    { select: (r) => r.data, keepPreviousData: true }
  );

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setParam("q", inputValue);
  };

  const aggs = data?.aggregations || {};

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2>Search Records</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "13px" }}>
          Full-text search across titles, abstracts, authors, and tags.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            style={{ fontSize: "15px", height: 44 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search research outputs, datasets, software..."
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap", height: 44 }}>
            ⊙ Search
          </button>
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        {/* Facets */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>
              Record Type
            </div>
            {[["", "All Types"], ["paper", "Paper"], ["dataset", "Dataset"], ["software", "Software"], ["report", "Report"], ["presentation", "Presentation"]].map(([val, label]) => {
              const count = val ? aggs.record_types?.[val] : data?.total;
              return (
                <button
                  key={val}
                  onClick={() => setParam("type", val)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "6px 8px",
                    background: typeFilter === val ? "rgba(59,130,246,0.12)" : "transparent",
                    color: typeFilter === val ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: "none",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    marginBottom: 2,
                  }}
                >
                  <span>{label}</span>
                  {count !== undefined && <span style={{ color: "var(--text-muted)" }}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>
              Status
            </div>
            {[["published", "Published"], ["draft", "Draft"], ["archived", "Archived"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setParam("status", statusFilter === val ? "" : val)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "6px 8px",
                  background: statusFilter === val ? "rgba(59,130,246,0.12)" : "transparent",
                  color: statusFilter === val ? "var(--accent-blue)" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  marginBottom: 2,
                }}
              >
                <span>{label}</span>
                {aggs.statuses?.[val] !== undefined && <span style={{ color: "var(--text-muted)" }}>{aggs.statuses[val]}</span>}
              </button>
            ))}
          </div>

          {aggs.top_tags?.length > 0 && (
            <div className="card">
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>
                Popular Tags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {aggs.top_tags.slice(0, 12).map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => setParam("tags", tagsFilter === t.tag ? "" : t.tag)}
                    className="tag"
                    style={{
                      background: tagsFilter === t.tag ? "rgba(59,130,246,0.2)" : undefined,
                      color: tagsFilter === t.tag ? "var(--accent-blue)" : undefined,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    #{t.tag} <span style={{ color: "var(--text-muted)" }}>{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div style={{ marginBottom: 14, color: "var(--text-muted)", fontSize: "12px" }}>
            {isLoading || isFetching ? "Searching..." : `${data?.total ?? 0} result${data?.total !== 1 ? "s" : ""} ${q ? `for "${q}"` : ""}`}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "48px" }}><span className="spinner" /></div>
          ) : data?.items?.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
              No results found. Try different keywords or remove filters.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data?.items?.map((record) => (
                <Link key={record.id} to={`/records/${record.id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <span>{TYPE_ICONS[record.record_type]}</span>
                      <span className={`badge ${TYPE_COLORS[record.record_type]}`}>{record.record_type}</span>
                      <span className={`badge ${STATUS_COLORS[record.status]}`}>{record.status}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{formatDate(record.publication_date || record.created_at)}</span>
                    </div>

                    <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 6, fontSize: "15px", lineHeight: 1.3 }}>
                      {record.title}
                    </h3>

                    {record.authors?.length > 0 && (
                      <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: 8 }}>
                        {record.authors.slice(0, 3).join(", ")}
                        {record.authors.length > 3 ? ` +${record.authors.length - 3} more` : ""}
                      </div>
                    )}

                    {record.abstract && (
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.6, marginBottom: 10 }}
                        title={record.abstract}
                      >
                        {record.abstract.slice(0, 200)}{record.abstract.length > 200 ? "..." : ""}
                      </p>
                    )}

                    {record.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {record.tags.slice(0, 6).map((t, i) => (
                          <span key={i} className="tag">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center gap-2" style={{ marginTop: 20, justifyContent: "center" }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setParam("page", page - 1)}>← Prev</button>
              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Page {page} of {data.pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === data.pages} onClick={() => setParam("page", page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
