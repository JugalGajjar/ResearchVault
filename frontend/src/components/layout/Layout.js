import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "◈", end: true },
  { path: "/records", label: "Records", icon: "⊞" },
  { path: "/search", label: "Search", icon: "⊙" },
];

const TYPE_COLORS = {
  paper: "badge-blue",
  dataset: "badge-green",
  software: "badge-purple",
  report: "badge-amber",
  presentation: "badge-cyan",
};

export default function Layout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}>
            Research<span style={{ color: "var(--accent-blue)" }}>Vault</span>
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: 2 }}>
            INSTITUTIONAL REPOSITORY
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--radius)",
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 400,
                marginBottom: 2,
                borderLeft: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
                transition: "all 0.15s",
                textDecoration: "none",
              })}
            >
              <span style={{ fontSize: "16px", opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* New Record button */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
          <button
            className="btn btn-primary w-full"
            onClick={() => navigate("/records/new")}
            style={{ justifyContent: "center" }}
          >
            + New Record
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 16px",
          fontSize: "10px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          borderTop: "1px solid var(--border)",
        }}>
          v1.0.0 · CERN-inspired
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 220,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        {/* Top bar */}
        <header style={{
          height: 56,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480 }}>
            <input
              className="input"
              placeholder="⊙  Search records, authors, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ height: 36 }}
            />
          </form>
          <div style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
            {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: "28px 28px" }} className="grid-bg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
