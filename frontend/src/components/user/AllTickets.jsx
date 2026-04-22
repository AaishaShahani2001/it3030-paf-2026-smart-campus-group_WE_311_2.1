import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { getToken } from "../../utils/auth";
import {
  AlertCircle,
  Eye,
  MapPin,
  MessageSquare,
  Pencil,
  RefreshCw,
  Ticket,
  Trash2,
  UserCog,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
} from "lucide-react";

const decodeJwtPayload = (token) => {
  // Safely decode JWT payload for deriving current user identity.
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
  // Resolve reporter email from multiple storage conventions used across auth flows.
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
  // Normalize API responses so callers can handle JSON and plain text uniformly.
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return { success: false, message: text || "Request failed" };
};

const STATUS_META = {
  OPEN: { label: "Open", chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  IN_PROGRESS: { label: "In Progress", chip: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  ON_HOLD: { label: "On Hold", chip: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  RESOLVED: { label: "Resolved", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  CLOSED: { label: "Closed", chip: "bg-gray-100 text-gray-700 ring-gray-200", dot: "bg-gray-400" },
  REJECTED: { label: "Rejected", chip: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

const PRIORITY_META = {
  LOW: { label: "Low", chip: "bg-slate-50 text-slate-600 ring-slate-200" },
  MEDIUM: { label: "Medium", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  HIGH: { label: "High", chip: "bg-orange-50 text-orange-700 ring-orange-200" },
  CRITICAL: { label: "Critical", chip: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const CATEGORIES = [
  "ELECTRICAL",
  "PLUMBING",
  "IT_EQUIPMENT",
  "FURNITURE",
  "HVAC",
  "CLEANING",
  "SECURITY",
  "OTHER",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.OPEN;
const getPriorityMeta = (priority) => PRIORITY_META[priority] || PRIORITY_META.MEDIUM;

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const formatCategory = (category) => (category || "OTHER").replace(/_/g, " ");

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);
  const [viewComments, setViewComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = getToken();
  const reporterEmail = getReporterEmailFromAuthState();
  const authUserId = getAuthUserId(token);

  const fetchTickets = useCallback(async (opts = {}) => {
    // Load current user's tickets and apply an extra client-side ownership guard.
    const silent = Boolean(opts.silent);
    if (!token) {
      setLoading(false);
      setTickets([]);
      return;
    }
    if (silent) setRefreshing(true); else setLoading(true);
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
        const msg = payload?.message || (typeof payload === "string" ? payload : null) || "Could not load tickets.";
        toast.error(msg);
        setTickets([]);
      }
    } catch {
      toast.error("Network error while loading tickets.");
      setTickets([]);
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [authUserId, reporterEmail, token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const sortedTickets = useMemo(() => {
    // Keep newest tickets first for consistent table and card ordering.
    return [...tickets].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [tickets]);

  const canMutate = (ticket) => (ticket?.status || "OPEN") === "OPEN";

  const loadComments = useCallback(async (ticketId) => {
    // Fetch full ticket discussion thread for the view modal.
    if (!ticketId || !token) return;
    try {
      setLoadingComments(true);
      const res = await fetch(`/api/v1/tickets/${ticketId}/comments?size=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(res);
      if (res.ok && payload?.success) {
        setViewComments(payload?.data?.content || []);
      } else {
        setViewComments([]);
      }
    } catch {
      setViewComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [token]);

  const openView = async (ticket) => {
    setViewTicket(ticket);
    setViewComments([]);
    if (!token || !ticket?.id) return;
    try {
      const res = await fetch(`/api/v1/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(res);
      if (res.ok && payload?.success) {
        setViewTicket(payload.data);
      }
    } catch {
      // Fall back to the list version.
    }
    await loadComments(ticket.id);
  };

  const openEdit = (ticket) => {
    setEditTicket(ticket);
    setEditForm({
      title: ticket.title || "",
      description: ticket.description || "",
      category: ticket.category || "OTHER",
      priority: ticket.priority || "MEDIUM",
      location: ticket.location || "",
      contactPhone: ticket.contactPhone || "",
      contactEmail: ticket.contactEmail || "",
    });
  };

  const submitEdit = async () => {
    if (!editTicket?.id || !editForm) return;
    const body = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      category: editForm.category,
      priority: editForm.priority,
      location: editForm.location.trim(),
      contactPhone: editForm.contactPhone?.trim() || null,
      contactEmail: editForm.contactEmail?.trim() || null,
    };
    if (!body.title || !body.description || !body.location) {
      toast.warning("Title, description, and location are required.");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch(`/api/v1/tickets/${editTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const payload = await parseResponse(res);
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to update ticket.");
      }
      toast.success("Ticket updated.");
      setEditTicket(null);
      setEditForm(null);
      await fetchTickets({ silent: true });
    } catch (err) {
      toast.error(err.message || "Unable to update ticket.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/v1/tickets/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(res);
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to delete ticket.");
      }
      toast.success("Ticket deleted.");
      setDeleteTarget(null);
      await fetchTickets({ silent: true });
    } catch (err) {
      toast.error(err.message || "Unable to delete ticket.");
    } finally {
      setIsDeleting(false);
    }
  };

  const timelineEvents = useMemo(() => {
    if (!viewTicket) return [];
    const events = [];
    if (viewTicket.createdAt) {
      events.push({
        id: "created",
        title: "Ticket Created",
        body: "Your ticket was submitted and is pending review.",
        at: viewTicket.createdAt,
        tone: "amber",
      });
    }
    if (viewTicket.assigneeName) {
      events.push({
        id: "assigned",
        title: `Assigned to ${viewTicket.assigneeName}`,
        body: "A technician has been assigned to your ticket.",
        at: viewTicket.firstResponseAt || viewTicket.createdAt,
        tone: "blue",
      });
    }
    if (viewTicket.firstResponseAt) {
      events.push({
        id: "in_progress",
        title: "Work Started",
        body: "Technician began working on the issue.",
        at: viewTicket.firstResponseAt,
        tone: "blue",
      });
    }
    if (viewTicket.resolvedAt) {
      events.push({
        id: "resolved",
        title: "Resolved",
        body: viewTicket.resolutionNotes || "The issue has been addressed.",
        at: viewTicket.resolvedAt,
        tone: "emerald",
      });
    }
    if (viewTicket.status === "CLOSED") {
      events.push({
        id: "closed",
        title: "Closed",
        body: "Ticket finalized.",
        at: viewTicket.resolvedAt || viewTicket.createdAt,
        tone: "gray",
      });
    }
    if (viewTicket.status === "REJECTED") {
      events.push({
        id: "rejected",
        title: "Rejected",
        body: viewTicket.rejectionReason || "Ticket was rejected.",
        at: viewTicket.createdAt,
        tone: "rose",
      });
    }
    (viewComments || []).forEach((c, idx) => {
      events.push({
        id: c.id || `comment-${idx}`,
        title: c.authorName || "System",
        body: c.content,
        at: c.createdAt,
        tone: "slate",
        isComment: true,
      });
    });
    return events.sort((a, b) => {
      const aTime = a.at ? new Date(a.at).getTime() : 0;
      const bTime = b.at ? new Date(b.at).getTime() : 0;
      return aTime - bTime;
    });
  }, [viewTicket, viewComments]);

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
          <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-4 w-1/4 rounded bg-gray-200 mb-3" />
            <div className="h-5 w-3/4 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-1/2 rounded bg-gray-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {sortedTickets.length > 0
              ? `${sortedTickets.length} ticket${sortedTickets.length === 1 ? "" : "s"} · newest first`
              : "You haven't reported anything yet."}
          </p>
        </div>
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

      {sortedTickets.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Ticket className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-gray-900">No tickets yet</p>
          <p className="mt-1 text-sm text-gray-500">When you report an issue, it will show up here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/90">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ticket</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Category</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Priority</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTickets.map((t) => {
                  const statusMeta = getStatusMeta(t.status);
                  const priorityMeta = getPriorityMeta(t.priority);
                  const mutable = canMutate(t);
                  return (
                    <tr key={t.id} className="group transition-colors hover:bg-emerald-50/30">
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-75">
                          <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            Ref #{String(t.id ?? "").slice(0, 8) || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {formatCategory(t.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="max-w-42.5 truncate">{t.location || "—"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatDateTime(t.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusMeta.chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${priorityMeta.chip}`}>
                          {(t.priority === "HIGH" || t.priority === "CRITICAL") && <AlertTriangle className="w-3.5 h-3.5" />}
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openView(t)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            disabled={!mutable}
                            title={mutable ? "Edit ticket" : "Editing is locked once work has started"}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            disabled={!mutable}
                            title={mutable ? "Delete ticket" : "Cannot delete once a technician has begun work"}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewTicket && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4 bg-gray-50/60">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{viewTicket.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ref #{String(viewTicket.id ?? "").slice(0, 8)} · {formatDateTime(viewTicket.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewTicket(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const meta = getStatusMeta(viewTicket.status);
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  );
                })()}
                {(() => {
                  const meta = getPriorityMeta(viewTicket.priority);
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                      {(viewTicket.priority === "HIGH" || viewTicket.priority === "CRITICAL") && <AlertTriangle className="w-3.5 h-3.5" />}
                      {meta.label}
                    </span>
                  );
                })()}
                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-600 ring-gray-200">
                  {(viewTicket.category || "OTHER").replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    {viewTicket.location || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Assigned Technician</p>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <UserCog className="h-3.5 w-3.5 text-emerald-600" />
                    {viewTicket.assigneeName || viewTicket.assignee?.name || "Not assigned yet"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewTicket.description || "—"}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 inline-flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    Progress Timeline
                  </p>
                  {loadingComments && <span className="text-[10px] text-gray-400 animate-pulse">Loading...</span>}
                </div>

                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity recorded yet.</p>
                ) : (
                  <ol className="relative border-l border-gray-200 ml-2 space-y-4 pl-4">
                    {timelineEvents.map((event) => {
                      const toneRing = {
                        amber: "bg-amber-500 ring-amber-100",
                        blue: "bg-blue-500 ring-blue-100",
                        emerald: "bg-emerald-500 ring-emerald-100",
                        rose: "bg-rose-500 ring-rose-100",
                        gray: "bg-gray-400 ring-gray-100",
                        slate: "bg-slate-400 ring-slate-100",
                      }[event.tone] || "bg-gray-400 ring-gray-100";
                      return (
                        <li key={event.id} className="relative">
                          <span className={`absolute -left-5.5 top-1.5 w-3 h-3 rounded-full ring-4 ${toneRing}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                              <p className="text-xs text-gray-500">{formatDateTime(event.at)}</p>
                            </div>
                            {event.isComment && (
                              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CircleDot className="w-3 h-3" />
                                Comment
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{event.body}</p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => setViewTicket(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editTicket && editForm && createPortal(
        <div className="fixed inset-0 z-105 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Ticket</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update the details of your open ticket.</p>
              </div>
              <button
                type="button"
                onClick={() => { setEditTicket(null); setEditForm(null); }}
                disabled={isSaving}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.contactPhone || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={editForm.contactEmail || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditTicket(null); setEditForm(null); }}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete this ticket?</h3>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">"{deleteTarget.title}"</span> will be permanently removed, including any attachments. This cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition active:scale-95 inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AllTickets;
