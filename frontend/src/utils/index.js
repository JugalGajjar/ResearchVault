export const TYPE_COLORS = {
  paper: "badge-blue",
  dataset: "badge-green",
  software: "badge-purple",
  report: "badge-amber",
  presentation: "badge-cyan",
};

export const STATUS_COLORS = {
  published: "badge-green",
  draft: "badge-amber",
  archived: "badge-gray",
};

export const TYPE_ICONS = {
  paper: "📄",
  dataset: "🗂",
  software: "💻",
  report: "📊",
  presentation: "🖥",
};

export function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
  });
}
