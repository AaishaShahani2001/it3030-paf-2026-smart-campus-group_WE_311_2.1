import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  X,
  Search,
  RefreshCw,
  Inbox,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getToken } from "../../utils/auth";

const STATUS_META = {
  OPEN: { label: "Open", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 ring-amber-200" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 ring-blue-200" },
  ON_HOLD: { label: "On Hold", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 ring-violet-200" },
  RESOLVED: { label: "Resolved", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CLOSED: { label: "Closed", dot: "bg-gray-400", chip: "bg-gray-100 text-gray-700 ring-gray-200" },
  REJECTED: { label: "Rejected", dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const PRIORITY_META = {
  LOW: { label: "Low", chip: "bg-slate-50 text-slate-600 ring-slate-200" },
  MEDIUM: { label: "Medium", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  HIGH: { label: "High", chip: "bg-orange-50 text-orange-700 ring-orange-200" },
  CRITICAL: { label: "Critical", chip: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.OPEN;
const getPriorityMeta = (priority) => PRIORITY_META[priority] || PRIORITY_META.MEDIUM;

// Formats total turnaround time from ticket creation to resolution.
const formatResolutionDuration = (createdAt, resolvedAt) => {
  if (!createdAt || !resolvedAt) return null;
  const start = new Date(createdAt).getTime();
  const end = new Date(resolvedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const totalMinutes = Math.floor((end - start) / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return { success: false, message: text || "Request failed" };
};

const openAttachmentWithAuth = async (downloadUrl, token, fileName) => {
  if (!downloadUrl || !token) {
    throw new Error("Missing attachment URL or auth token.");
  }

  const response = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new Error(payload?.message || "Unable to open attachment.");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const newTab = window.open(blobUrl, "_blank", "noopener,noreferrer");
  if (!newTab) {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "attachment";
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

const AttachmentTile = ({ file, token }) => {
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const url = file?.downloadUrl;
  const isImage =
    file?.fileType?.includes("image") || file?.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  useEffect(() => {
    let objectUrl = "";
    let active = true;

    const loadPreview = async () => {
      if (!isImage || !url || !token) return;
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Preview unavailable");
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewSrc(objectUrl);
      } catch {
        if (active) setPreviewError(true);
      }
    };

    loadPreview();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isImage, url, token]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await openAttachmentWithAuth(file?.downloadUrl, token, file?.fileName);
        } catch (err) {
          toast.error(err.message || "Failed to open attachment.");
        }
      }}
      className="block w-full text-left relative group overflow-hidden rounded-2xl border-2 border-gray-100 aspect-square shadow-sm bg-white hover:border-indigo-200 transition-all"
    >
      {isImage && previewSrc && !previewError ? (
        <img src={previewSrc} alt={file?.fileName || "Attachment"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
          <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 text-center w-full truncate">{file?.fileName || "View File"}</span>
        </div>
      )}
    </button>
  );
};

const getCommentTypeClasses = (type) => {
  switch (type) {
    case "RESOLUTION":
      return "bg-emerald-50 border-emerald-100 text-emerald-700";
    case "REJECTION":
      return "bg-red-50 border-red-100 text-red-700";
    case "STATUS_CHANGE":
      return "bg-blue-50 border-blue-100 text-blue-700";
    default:
      return "bg-gray-50 border-gray-100 text-gray-700";
  }
};

const RaisedTickets = () => {
  const token = getToken();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [ticketComments, setTicketComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [replyComment, setReplyComment] = useState("");
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const visibleTickets = useMemo(() => {
    // Apply newest-first ordering, then local status/search filtering.
    const query = search.trim().toLowerCase();
    const sorted = [...tickets].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.filter((ticket) => {
      if (statusFilter !== "ALL" && (ticket.status || "OPEN") !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        ticket.title,
        ticket.reporterName,
        ticket.assigneeName,
        ticket.category,
        ticket.status,
        ticket.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tickets, search, statusFilter]);

  const stats = useMemo(() => {
    // Build dashboard summary cards from loaded ticket statuses.
    const counts = { total: tickets.length, open: 0, inProgress: 0, resolved: 0 };
    tickets.forEach((t) => {
      const s = t.status || "OPEN";
      if (s === "OPEN") counts.open += 1;
      else if (s === "IN_PROGRESS") counts.inProgress += 1;
      else if (s === "RESOLVED") counts.resolved += 1;
    });
    return counts;
  }, [tickets]);

  const getAllTickets = async () => {
    // Main ticket fetch used on initial load and manual refresh.
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/v1/tickets?size=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(response);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to fetch tickets.");
      }

      const list = payload?.data?.content || payload?.content || payload?.data || [];
      setTickets(Array.isArray(list) ? list : []);
      if (!loading) toast.success("Tickets refreshed.");
    } catch (err) {
      setError(err.message || "Unable to load tickets.");
      setTickets([]);
      toast.error(err.message || "Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const getTechnicians = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/v1/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(response);
      if (!response.ok) return;
      const users = Array.isArray(payload?.data) ? payload.data : [];
      const techUsers = users.filter((u) => (u?.role || "").toUpperCase() === "TECHNICIAN");
      setTechnicians(techUsers);
    } catch {
      // Keep silent; assignment UI will still render.
    }
  };

  const fetchTicketComments = async (ticketId) => {
    // Retrieve timeline comments for the selected ticket.
    if (!token || !ticketId) return;
    try {
      setLoadingComments(true);
      const commentsRes = await fetch(`/api/v1/tickets/${ticketId}/comments?size=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const commentsPayload = await parseResponse(commentsRes);
      if (commentsRes.ok && commentsPayload?.success) {
        setTicketComments(commentsPayload?.data?.content || []);
      } else {
        setTicketComments([]);
      }
    } catch {
      setTicketComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const openDetails = async (ticket) => {
    // Open modal quickly with row data, then hydrate with full details.
    setSelectedTicket(ticket);
    setTicketDetails(ticket);
    setSelectedTechnicianId("");
    setReplyComment("");
    if (!token || !ticket?.id) return;

    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/v1/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load ticket details.");
      }
      const detailPayload = payload?.data || payload;
      setTicketDetails(detailPayload);
      setSelectedTechnicianId(detailPayload?.assignee?.id || "");

      await fetchTicketComments(ticket.id);
      toast.success("Loaded ticket details.");
    } catch (err) {
      toast.error(err.message || "Using basic ticket details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const assignTechnician = async () => {
    // Assign or reassign a technician and keep modal data in sync.
    if (!selectedTicket?.id || !selectedTechnicianId) {
      toast.warning("Select a technician first.");
      return;
    }
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }
    try {
      setIsAssigning(true);
      const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigneeId: selectedTechnicianId }),
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to assign technician.");
      }
      toast.success("Technician assigned successfully.");
      await getAllTickets();
      await openDetails(selectedTicket);
    } catch (err) {
      toast.error(err.message || "Technician assignment failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  const openCloseModal = () => {
    setAdminComment("");
    setShowCloseModal(true);
  };

  const postAdminComment = async (ticketId, content) => {
    // Lightweight helper: best-effort comment posting after admin actions.
    if (!content || !token) return;
    try {
      await fetch(`/api/v1/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
    } catch {
      // Non-fatal: the primary status update already succeeded.
    }
  };

  const submitReplyComment = async () => {
    // Admin replies are used for ON_HOLD -> IN_PROGRESS communication.
    const trimmed = replyComment.trim();
    if (!trimmed) {
      toast.warning("Type a reply before sending.");
      return;
    }
    if (!selectedTicket?.id) return;
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }
    try {
      setIsPostingReply(true);
      const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: `Admin reply: ${trimmed}` }),
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to post reply.");
      }
      const ticketResponse = await fetch(`/api/v1/tickets/${selectedTicket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ticketPayload = await parseResponse(ticketResponse);
      if (ticketResponse.ok && ticketPayload?.success && ticketPayload?.data) {
        setTicketDetails(ticketPayload.data);
        setSelectedTicket((prev) => (prev ? { ...prev, ...ticketPayload.data } : prev));
      }
      setReplyComment("");
      await getAllTickets(true);
      await fetchTicketComments(selectedTicket.id);
      toast.success("Reply sent. Ticket moved to In Progress.");
    } catch (err) {
      toast.error(err.message || "Unable to post reply.");
    } finally {
      setIsPostingReply(false);
    }
  };

  const closeTicket = async () => {
    // Finalizes the ticket lifecycle after admin verifies resolution.
    if (!selectedTicket?.id) return;
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }

    try {
      setIsClosing(true);
      const body = { status: "CLOSED" };
      const trimmed = adminComment.trim();
      if (trimmed) body.resolutionNotes = trimmed;

      const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to close ticket.");
      }
      toast.success("Ticket closed successfully.");
      await getAllTickets();
      setShowCloseModal(false);
      await openDetails(selectedTicket);
    } catch (err) {
      toast.error(err.message || "Unable to close ticket.");
    } finally {
      setIsClosing(false);
    }
  };

  const sendBackToTechnician = async () => {
    // Reopen path when more work is needed from technician.
    if (!selectedTicket?.id) return;
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }
    const trimmed = adminComment.trim();
    if (!trimmed) {
      toast.warning("Please add a comment for the technician before sending back.");
      return;
    }

    try {
      setIsReopening(true);
      const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "IN_PROGRESS", reason: trimmed }),
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to reopen ticket.");
      }
      await postAdminComment(selectedTicket.id, `Admin feedback: ${trimmed}`);
      toast.success("Ticket sent back to the technician.");
      await getAllTickets();
      setShowCloseModal(false);
      await openDetails(selectedTicket);
    } catch (err) {
      toast.error(err.message || "Unable to reopen ticket.");
    } finally {
      setIsReopening(false);
    }
  };

  useEffect(() => {
    getAllTickets();
    getTechnicians();
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">All Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor, assign, and track tickets raised across campus operations.</p>
        </div>
        <button
          onClick={getAllTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 text-sm font-medium shadow-sm transition disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, Icon: Inbox, tone: "text-gray-600 bg-gray-100" },
          { label: "Open", value: stats.open, Icon: Clock, tone: "text-amber-600 bg-amber-50" },
          { label: "In Progress", value: stats.inProgress, Icon: Wrench, tone: "text-blue-600 bg-blue-50" },
          { label: "Resolved", value: stats.resolved, Icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="text-xl font-semibold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, reporter, assignee..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {["ALL", "OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "REJECTED"].map((key) => {
              const active = statusFilter === key;
              const label = key === "ALL" ? "All" : getStatusMeta(key).label;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition whitespace-nowrap ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/60 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Ticket</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Reporter</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Priority</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Assignee</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Created</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p className="text-sm font-medium text-gray-500">Loading tickets...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-rose-600">{error}</p>
                  </td>
                </tr>
              ) : visibleTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-gray-500">
                      {tickets.length === 0 ? "No tickets have been raised yet." : "No tickets match the current filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleTickets.map((ticket) => {
                  const statusMeta = getStatusMeta(ticket.status);
                  const priorityMeta = getPriorityMeta(ticket.priority);
                  const createdLabel = ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 align-middle">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[18rem]">
                          {ticket.title || "Untitled"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(ticket.category || "OTHER").replace(/_/g, " ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="text-sm font-medium text-gray-800">{ticket.reporterName || "Unknown"}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${priorityMeta.chip}`}>
                          {(ticket.priority === "HIGH" || ticket.priority === "CRITICAL") && (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusMeta.chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                        {["RESOLVED", "CLOSED"].includes(ticket.status) && (
                          (() => {
                            const durationLabel = formatResolutionDuration(ticket.createdAt, ticket.resolvedAt);
                            if (!durationLabel) return null;
                            return (
                              <div className="mt-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-fuchsia-700">
                                  <Clock className="w-3 h-3" />
                                  {durationLabel}
                                </span>
                              </div>
                            );
                          })()
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className={`text-sm ${ticket.assigneeName ? "text-gray-800 font-medium" : "text-gray-400 italic"}`}>
                          {ticket.assigneeName || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="text-xs text-gray-500">{createdLabel}</span>
                      </td>
                      <td className="px-5 py-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => openDetails(ticket)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 hover:border-emerald-600 px-3 py-1.5 rounded-md transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && visibleTickets.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <span className="font-semibold text-gray-700">{visibleTickets.length}</span> of{" "}
              <span className="font-semibold text-gray-700">{tickets.length}</span> tickets
            </span>
            <span className="hidden sm:inline">Sorted by newest first</span>
          </div>
        )}
      </div>

      {selectedTicket &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-4xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                    {selectedTicket.title}
                  </h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Reference: #{String(selectedTicket.id ?? "").slice(0, 8)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all shadow-sm active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                {loadingDetails ? (
                  <div className="py-12 text-center text-sm font-semibold text-gray-500">Loading details...</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{ticketDetails?.description || selectedTicket?.description || "No description available."}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Status</p>
                          {(() => {
                            const meta = getStatusMeta(ticketDetails?.status || selectedTicket?.status);
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Priority</p>
                          {(() => {
                            const meta = getPriorityMeta(ticketDetails?.priority || selectedTicket?.priority);
                            const priority = ticketDetails?.priority || selectedTicket?.priority;
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                                {(priority === "HIGH" || priority === "CRITICAL") && (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                )}
                                {meta.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{ticketDetails?.location || selectedTicket?.location || "—"}</p>
                        </div>
                      </div>

                      {["RESOLVED", "CLOSED"].includes(ticketDetails?.status || selectedTicket?.status) && (
                        <section className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
                          <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Review Resolution</h4>
                          {(() => {
                            const durationLabel = formatResolutionDuration(
                              ticketDetails?.createdAt || selectedTicket?.createdAt,
                              ticketDetails?.resolvedAt
                            );
                            if (!durationLabel) return null;
                            return (
                              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-200/50 bg-fuchsia-500/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-fuchsia-100 shadow-lg shadow-fuchsia-900/20">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400/30 text-fuchsia-100">
                                  <Clock className="w-3 h-3" />
                                </span>
                                Resolution Time: {durationLabel}
                              </div>
                            );
                          })()}
                          <p className="text-xs text-gray-300 leading-relaxed mb-4">
                            The technician marked this ticket as resolved. Close the case to finalize, or send it back with feedback if more work is required.
                          </p>
                          <button
                            onClick={openCloseModal}
                            className="w-full bg-white text-gray-900 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
                          >
                            Review & Finalize
                          </button>
                        </section>
                      )}

                      <section className="bg-emerald-900 rounded-2xl p-6 text-white shadow-xl shadow-emerald-100">
                        <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-4">Assign Technician</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Personnel</label>
                            <select
                              value={selectedTechnicianId}
                              onChange={(e) => setSelectedTechnicianId(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 appearance-none"
                            >
                              <option value="" className="text-gray-900">-- Select Technician --</option>
                              {technicians.map((tech) => (
                                <option key={tech.id} value={tech.id} className="text-gray-900">
                                  {tech.name || tech.username} ({tech.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          {(() => {
                            const currentAssigneeId = ticketDetails?.assignee?.id || "";
                            const alreadyAssigned = Boolean(currentAssigneeId) && currentAssigneeId === selectedTechnicianId;
                            return (
                              <button
                                onClick={assignTechnician}
                                disabled={isAssigning || !selectedTechnicianId || alreadyAssigned}
                                className="w-full bg-white text-emerald-900 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {isAssigning
                                  ? "Assigning..."
                                  : alreadyAssigned
                                    ? "Technician Assigned"
                                    : currentAssigneeId
                                      ? "Reassign Technician"
                                      : "Confirm Assignment"}
                              </button>
                            );
                          })()}
                        </div>
                      </section>

                      {Array.isArray(ticketDetails?.attachments) && ticketDetails.attachments.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Uploaded Attachments</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {ticketDetails.attachments.map((file, idx) => (
                              <AttachmentTile key={`${file?.fileName || "file"}-${idx}`} file={file} token={token} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Activity Timeline</h4>
                        <div className="space-y-3">
                          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Status: Created</p>
                            <p className="text-xs text-blue-700 mt-1">
                              {ticketDetails?.createdAt ? new Date(ticketDetails.createdAt).toLocaleString() : "-"}
                            </p>
                          </div>

                          {ticketDetails?.firstResponseAt && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Status: In Progress</p>
                              <p className="text-xs text-blue-700 mt-1">{new Date(ticketDetails.firstResponseAt).toLocaleString()}</p>
                            </div>
                          )}

                          {ticketDetails?.resolvedAt && (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Status: Resolved</p>
                              <p className="text-xs text-emerald-700 mt-1">{new Date(ticketDetails.resolvedAt).toLocaleString()}</p>
                            </div>
                          )}

                          {(ticketDetails?.status || selectedTicket?.status) === "CLOSED" && (
                            <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Status: Closed</p>
                              <p className="text-xs text-gray-700 mt-1">Ticket finalized by admin.</p>
                            </div>
                          )}

                          {loadingComments ? (
                            <p className="text-xs font-semibold text-gray-500">Loading comments...</p>
                          ) : ticketComments.length === 0 ? (
                            <p className="text-xs font-semibold text-gray-500">No technician comments yet.</p>
                          ) : (
                            ticketComments.map((comment) => (
                              <div key={comment.id} className={`rounded-xl border p-3 ${getCommentTypeClasses(comment.commentType)}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest">{comment.commentType || "NOTE"}</p>
                                  <p className="text-[10px] font-bold opacity-70">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                                  </p>
                                </div>
                                <p className="text-xs font-bold mt-1">{comment.authorName || "Technician"}</p>
                                <p className="text-sm mt-1">{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {(ticketDetails?.status || selectedTicket?.status) === "ON_HOLD" && (
                          <div className="mt-5 pt-5 border-t border-gray-100">
                            <label htmlFor="admin-reply" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                              Reply to Technician
                            </label>
                            <textarea
                              id="admin-reply"
                              rows={3}
                              value={replyComment}
                              onChange={(e) => setReplyComment(e.target.value)}
                              placeholder="Share guidance, ask for an update, or clarify the scope..."
                              disabled={isPostingReply}
                              className="w-full rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none resize-none transition disabled:opacity-60"
                            />
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={submitReplyComment}
                                disabled={isPostingReply || !replyComment.trim()}
                                className="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                              >
                                {isPostingReply ? "Sending..." : "Send Reply"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {showCloseModal && selectedTicket &&
        createPortal(
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/20 animate-fade-in-up">
              <div className="px-7 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Review Resolution</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                    Reference: #{String(selectedTicket.id ?? "").slice(0, 8)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  disabled={isClosing || isReopening}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-7 py-6 space-y-5">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Ticket</p>
                  <p className="text-sm font-bold text-gray-900">{selectedTicket.title}</p>
                </div>

                <div>
                  <label htmlFor="admin-comment" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                    Comment to Technician
                    <span className="text-gray-400 normal-case font-semibold tracking-normal ml-1">
                      (required to send back)
                    </span>
                  </label>
                  <textarea
                    id="admin-comment"
                    rows={4}
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="e.g. Issue is not fully resolved — please revisit and fix the leak near the second floor."
                    disabled={isClosing || isReopening}
                    className="w-full rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none resize-none transition disabled:opacity-60"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Leave empty and choose <span className="font-bold">Close Ticket</span> if you're satisfied with the resolution.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={sendBackToTechnician}
                    disabled={isClosing || isReopening || !adminComment.trim()}
                    className="flex-1 bg-amber-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {isReopening ? "Sending..." : "Send Back to Technician"}
                  </button>
                  <button
                    type="button"
                    onClick={closeTicket}
                    disabled={isClosing || isReopening}
                    className="flex-1 bg-gray-900 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {isClosing ? "Closing..." : "Close Ticket"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RaisedTickets;
