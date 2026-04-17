import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";
import { toast } from "react-toastify";
import { getToken } from "../../utils/auth";

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

  const getAllTickets = async () => {
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
      setSelectedTicket(null);
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
      setReplyComment("");
      await fetchTicketComments(selectedTicket.id);
      toast.success("Reply sent to technician.");
    } catch (err) {
      toast.error(err.message || "Unable to post reply.");
    } finally {
      setIsPostingReply(false);
    }
  };

  const closeTicket = async () => {
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
      setSelectedTicket(null);
    } catch (err) {
      toast.error(err.message || "Unable to close ticket.");
    } finally {
      setIsClosing(false);
    }
  };

  const sendBackToTechnician = async () => {
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
      setSelectedTicket(null);
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
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">All Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor raised tickets across campus operations.</p>
        </div>
        <button
          onClick={getAllTickets}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Refresh tickets"
        >
          <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="bg-white rounded-4xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Title</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Origin</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assignee</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                      <p className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest">Hydrating table...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <p className="text-sm font-bold text-red-500">{error}</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No active cases found.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-emerald-50/30 transition-all group">
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight truncate max-w-70">
                          {ticket.title || "Untitled"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                          {(ticket.category || "OTHER").replace("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-700 uppercase tracking-tight">{ticket.reporterName || "Unknown"}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                          ticket.status === "RESOLVED"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : ticket.status === "CLOSED"
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : ticket.status === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : ticket.status === "IN_PROGRESS"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {ticket.status || "PENDING"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                        {ticket.assigneeName || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(ticket)}
                        className="inline-flex items-center gap-2 text-emerald-700 hover:text-white font-black text-[10px] uppercase tracking-widest bg-emerald-50 hover:bg-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Status</p>
                          <p className="text-sm font-black text-gray-900">{ticketDetails?.status || selectedTicket?.status || "-"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Location</p>
                          <p className="text-sm font-black text-gray-900">{ticketDetails?.location || selectedTicket?.location || "-"}</p>
                        </div>
                      </div>

                      {(ticketDetails?.status || selectedTicket?.status) === "RESOLVED" && (
                        <section className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
                          <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Review Resolution</h4>
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

                        {(ticketDetails?.status || selectedTicket?.status) === "IN_PROGRESS" && (
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
