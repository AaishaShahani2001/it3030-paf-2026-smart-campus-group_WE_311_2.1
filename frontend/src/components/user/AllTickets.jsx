import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getToken } from "../../utils/auth";
import {
  AlertCircle,
  Eye,
  MapPin,
  MessageSquare,
  RefreshCw,
  Ticket,
  UserCog,
} from "lucide-react";

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const looksLikeEmail = (value) => typeof value === "string" && value.includes("@");
const normalize = (value) => String(value || "").trim().toLowerCase();

const getAuthUserId = (token) => {
  if (!token) return "";
  const payload = decodeJwtPayload(token);
  return payload?.userId || payload?.id || payload?.uid || payload?.sub || "";
};

const getReporterEmailFromAuthState = () => {
  const directKeys = ["reporterEmail", "userEmail", "email"];
  for (const key of directKeys) {
    const value = localStorage.getItem(key);
    if (looksLikeEmail(value)) return value;
  }

  const userKeys = ["user", "authUser", "currentUser"];
  for (const key of userKeys) {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) continue;
    try {
      const parsed = JSON.parse(rawValue);
      if (looksLikeEmail(parsed?.email)) return parsed.email;
    } catch {
      // Ignore malformed JSON from unrelated localStorage values.
    }
  }

  const tokenKeys = ["token", "accessToken", "jwt", "authToken"];
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (!token) continue;
    const payload = decodeJwtPayload(token);
    if (looksLikeEmail(payload?.email)) return payload.email;
    if (looksLikeEmail(payload?.sub)) return payload.sub;
  }

  return "";
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return { success: false, message: text || "Request failed" };
};

const statusStyles = {
  OPEN: "bg-slate-50 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const priorityStyles = {
  LOW: "bg-gray-50 text-gray-600 border-gray-100",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-700 border-red-100",
};

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const token = getToken();
  const reporterEmail = getReporterEmailFromAuthState();
  const authUserId = getAuthUserId(token);

  const fetchTickets = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!token) {
      setLoading(false);
      setTickets([]);
      return;
    }
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({ size: "200" });
      if (reporterEmail) params.set("reporterEmail", reporterEmail);
      if (authUserId) params.set("reporterId", String(authUserId));

      const response = await fetch(`/api/v1/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(response);
      if (response.ok && payload?.success) {
        const list = payload?.data?.content || payload?.content || payload?.data || [];
        const safeList = Array.isArray(list) ? list : [];

        const filtered = safeList.filter((ticket) => {
          const ticketReporterEmail = normalize(
            ticket?.reporterEmail ||
              ticket?.reporter?.email ||
              ticket?.reporter?.user?.email ||
              ticket?.createdBy?.email
          );
          const ticketReporterId = normalize(
            ticket?.reporterId ||
              ticket?.reporter?.id ||
              ticket?.createdBy?.id ||
              ticket?.userId
          );

          if (reporterEmail && ticketReporterEmail) {
            return ticketReporterEmail === normalize(reporterEmail);
          }
          if (authUserId && ticketReporterId) {
            return ticketReporterId === normalize(authUserId);
          }
          return true;
        });

        setTickets(filtered);
      } else {
        const msg =
          payload?.message ||
          (typeof payload === "string" ? payload : null) ||
          "Could not load tickets.";
        toast.error(msg);
        setTickets([]);
      }
    } catch {
      toast.error("Network error while loading tickets.");
      setTickets([]);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [authUserId, reporterEmail, token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleToggleDetails = useCallback((ticketId) => {
    setExpandedTicketId((prev) => (prev === ticketId ? null : ticketId));
  }, []);

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Sign in to load your ticket history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-1/4 rounded bg-gray-200 mb-3" />
            <div className="h-5 w-3/4 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-1/2 rounded bg-gray-50" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Ticket className="h-7 w-7" />
        </div>
        <p className="text-base font-semibold text-gray-900">No tickets yet</p>
        <p className="mt-1 text-sm text-gray-500">
          When you report an issue, it will show up here.
        </p>
        <button
          type="button"
          onClick={() => fetchTickets({ silent: true })}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => fetchTickets({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:border-emerald-200 hover:text-emerald-700 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <ul className="space-y-3">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-200/40 transition-shadow hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 truncate">{t.title}</h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {t.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    {t.location}
                  </span>
                  {t.createdAt && (
                    <span>
                      ·{" "}
                      {new Date(t.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <span
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    statusStyles[t.status] || statusStyles.OPEN
                  }`}
                >
                  {t.status?.replace(/_/g, " ") || "—"}
                </span>
                <span
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    priorityStyles[t.priority] || priorityStyles.MEDIUM
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <span>{t.category?.replace(/_/g, " ")}</span>
              <button
                type="button"
                onClick={() => handleToggleDetails(t.id)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                View details
              </button>
            </div>

            {expandedTicketId === t.id && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-100 bg-white p-3">
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      <UserCog className="h-4 w-4" />
                      Assigned Technician
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {t.assigneeName ||
                        t.assignee?.fullName ||
                        t.assignedTechnicianName ||
                        "Not assigned yet"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.assigneeEmail ||
                        t.assignee?.email ||
                        "No email available"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Assignment Status
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {t.status?.replace(/_/g, " ") || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-emerald-100 bg-white p-3">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </p>
                  {(t.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No comments available for this ticket.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(t.comments || []).map((comment, idx) => (
                        <li
                          key={comment.id || `${t.id}-comment-${idx}`}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-gray-700">
                            {comment.authorName || "System"}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {comment.content || "No content"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllTickets;
