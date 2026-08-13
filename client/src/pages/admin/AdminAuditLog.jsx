import { useEffect, useState } from "react";
import api from "../../api/api";

const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActionBadgeClass = (action = "") => {
  const a = action.toLowerCase();

  if (
    a.includes("approved") ||
    a.includes("confirmed") ||
    a.includes("activated")
  ) {
    return "status status-confirmed";
  }

  if (
    a.includes("rejected") ||
    a.includes("suspended") ||
    a.includes("banned") ||
    a.includes("deleted") ||
    a.includes("cancelled")
  ) {
    return "status status-rejected";
  }

  return "status";
};

const formatDetails = (details) => {
  if (!details || typeof details !== "object") return "";

  const entries = Object.entries(details).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (entries.length === 0) return "";

  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async (pageNum = 1) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/admin/audit-logs", {
        params: { page: pageNum, limit: 20 },
      });

      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
      setPage(data.pagination?.page || pageNum);
    } catch (err) {
      console.error("Audit log loading error:", err);

      setLogs([]);
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Audit log</h1>
          <p>Track every action admins take across the platform.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading && <p className="muted">Loading audit log...</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="empty-card">No audit log entries yet.</div>
      )}

      <div className="card-list">
        {logs.map((log) => (
          <article className="content-card stacked" key={log._id}>
            <div className="content-card-header">
              <div>
                <h3>{log.admin?.name || "Unknown admin"}</h3>
                <small>{log.admin?.email}</small>
              </div>

              <span className={getActionBadgeClass(log.action)}>
                {log.action}
              </span>
            </div>

            <p>
              <b>Target:</b> {log.targetType} — {log.targetId}
            </p>

            {formatDetails(log.details) && (
              <small>{formatDetails(log.details)}</small>
            )}

            <small className="muted">{formatDateTime(log.createdAt)}</small>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="button-row">
          <button
            type="button"
            className="secondary-button"
            disabled={page <= 1}
            onClick={() => loadLogs(page - 1)}
          >
            Previous
          </button>

          <span className="muted">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            className="secondary-button"
            disabled={page >= totalPages}
            onClick={() => loadLogs(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}