import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { toast } from "react-toastify";


const parseResponse = async (response) => {
    // Normalize API responses for shared error/success handling.
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    const text = await response.text();
    return { success: false, message: text || "Request failed" };
};

const TERMINAL_STATUSES = new Set(['RESOLVED', 'CLOSED', 'REJECTED']);

const getSlaLabel = (ticket) => {
    if (!ticket?.slaResolutionDeadline) return null;
    if (TERMINAL_STATUSES.has(ticket.status)) return null;

    const rawMinutes = typeof ticket.resolutionMinutesRemaining === 'number'
        ? ticket.resolutionMinutesRemaining
        : Math.floor((new Date(ticket.slaResolutionDeadline).getTime() - Date.now()) / 60000);
    const overdue = rawMinutes < 0;
    const minutes = Math.abs(rawMinutes);
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return { overdue, text: `${overdue ? 'Overdue' : 'Due in'} ${parts.join(' ')}` };
};

const PRIORITY_DURATION = {
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    CRITICAL: 8,
};

const getPriorityDuration = (priority) => PRIORITY_DURATION[priority] || PRIORITY_DURATION.MEDIUM;
const formatPriorityDuration = (priority) => {
    const hours = getPriorityDuration(priority);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
};

const openAttachmentWithAuth = async (downloadUrl, token, fileName) => {
    // Open protected attachments in a new tab with bearer auth.
    if (!downloadUrl || !token) {
        throw new Error("Missing attachment URL or authentication token.");
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

const AttachmentTile = ({ file, token, onOpen }) => {
    const [previewSrc, setPreviewSrc] = useState("");
    const [previewError, setPreviewError] = useState(false);
    const url = file?.downloadUrl;
    const isImage = file?.fileType?.includes('image') || file?.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

    useEffect(() => {
        let objectUrl = "";
        let isActive = true;

        const loadPreview = async () => {
            if (!isImage || !url || !token) return;
            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Preview unavailable");
                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);
                if (isActive) setPreviewSrc(objectUrl);
            } catch {
                if (isActive) setPreviewError(true);
            }
        };

        loadPreview();
        return () => {
            isActive = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [isImage, url, token]);

    return (
        <button type="button" onClick={onOpen} className="block w-full text-left relative group overflow-hidden rounded-2xl border-2 border-gray-100 aspect-square shadow-sm bg-white hover:border-teal-200 transition-all">
            {isImage && previewSrc && !previewError ? (
                <img src={previewSrc} alt={file?.fileName || "Attachment"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
                    <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 text-center w-full truncate">{file?.fileName || "View File"}</span>
                </div>
            )}
        </button>
    );
};

const TicketTimeline = ({ ticket, comments }) => {
    if (!ticket) return null;

    const events = [
        {
            type: 'CREATED',
            date: new Date(ticket.createdAt),
            title: 'Ticket Reported',
            content: 'Issue was submitted and is pending review.',
            color: 'blue',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            )
        }
    ];

    if (ticket.firstResponseAt) {
        events.push({
            type: 'ACKNOWLEDGED',
            date: new Date(ticket.firstResponseAt),
            title: 'Staff Acknowledged',
            content: 'A technician has started reviewing the issue.',
            color: 'amber',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        });
    }

    if (ticket.resolvedAt) {
        events.push({
            type: 'RESOLVED',
            date: new Date(ticket.resolvedAt),
            title: 'Issue Resolved',
            content: ticket.resolutionNotes || 'The issue has been successfully addressed.',
            color: 'emerald',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        });
    }

    if (comments && Array.isArray(comments)) {
        comments.forEach(comment => {
            events.push({
                type: 'COMMENT',
                date: new Date(comment.createdAt),
                title: comment.authorName,
                content: comment.content,
                color: 'gray',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )
            });
        });
    }

    // Sort events chronologically so timeline always renders in natural order.
    events.sort((a, b) => a.date - b.date);

    const getColorClasses = (color) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="flow-root mt-4">
            <ul className="-mb-8">
                {events.map((event, idx) => (
                    <li key={idx}>
                        <div className="relative pb-8">
                            {idx !== events.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-4">
                                <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm border ${getColorClasses(event.color)}`}>
                                        {event.icon}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{event.title}</p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                        <p className="leading-relaxed">{event.content}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TechOverviewTab = ({ user, stats }) => {
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Technician Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Welcome, {user?.name}. Here's your current workload status.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="group bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-200 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-green-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                        <svg className="w-16 h-16 text-emerald-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-green-100 to-green-200 text-green-800 rounded-xl flex items-center justify-center shadow-inner group-hover:from-green-800 group-hover:to-green-700 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Assigned Tasks</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.total}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-200 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                        <svg className="w-16 h-16 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner group-hover:from-blue-500 group-hover:to-blue-400 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">In Progress</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.inProgress}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-200 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-green-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                        <svg className="w-16 h-16 text-emerald-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="w-12 h-12 bg-linear-to-br from-green-100 to-green-200 text-green-800 rounded-xl flex items-center justify-center shadow-inner group-hover:from-green-800 group-hover:to-green-700 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Completed</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.resolved}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200 p-8">
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-green-800 flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    Daily Motivation
                </h2>
                <p className="text-gray-600 italic font-medium leading-relaxed">"Quality means doing it right when no one is looking." — Henry Ford</p>
                <div className="mt-8 flex gap-4">
                    <div className="flex-1 p-5 rounded-2xl bg-green-50 border border-green-200 shadow-inner">
                        <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-1">Efficiency Tip</p>
                        <p className="text-sm text-green-900 font-bold">Remember to capture clear "after" photos for resolved tickets.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TechJobsTab = ({ token, user }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [fullTicketDetails, setFullTicketDetails] = useState(null);
    const [ticketComments, setTicketComments] = useState([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [showResolutionBox, setShowResolutionBox] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [attachmentError, setAttachmentError] = useState("");
    const [newComment, setNewComment] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);

    const activeTicket = fullTicketDetails || selectedTicket;
    const activeStatus = activeTicket?.status;

    const fetchAssignedTickets = async () => {
        // Fetch tickets assigned to the logged-in technician.
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/tickets?assigneeId=${user.id}&size=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = await parseResponse(response);
            if (response.ok && payload?.success) {
                setTickets(payload?.data?.content || []);
            }
        } catch (err) {
            console.error("Failed to fetch jobs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && user) fetchAssignedTickets();
    }, [token, user]);

    useEffect(() => {
        if (!selectedTicket || !token) {
            setFullTicketDetails(null);
            setTicketComments([]);
            setResolutionNotes('');
            setShowResolutionBox(false);
            setRejectionReason('');
            setShowRejectBox(false);
            setNewComment("");
            return;
        }

        const fetchTicketDetails = async () => {
            setIsLoadingDetails(true);
            try {
                const res = await fetch(`/api/v1/tickets/${selectedTicket.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const payload = await parseResponse(res);
                if (res.ok && payload?.success) {
                    setFullTicketDetails(payload.data);
                    setResolutionNotes(payload.data.resolutionNotes || '');
                    setRejectionReason(payload.data.rejectionReason || '');
                }

                const commentsRes = await fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const commentsPayload = await parseResponse(commentsRes);
                if (commentsRes.ok && commentsPayload?.success) {
                    setTicketComments(commentsPayload.data.content || []);
                }
            } catch (err) {
                console.error("Failed to load details", err);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchTicketDetails();
    }, [selectedTicket, token]);

    const refreshComments = async (ticketId) => {
        // Refresh only comments when posting replies/updates.
        if (!ticketId || !token) return;
        try {
            const commentsRes = await fetch(`/api/v1/tickets/${ticketId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const commentsPayload = await parseResponse(commentsRes);
            if (commentsRes.ok && commentsPayload?.success) {
                setTicketComments(commentsPayload.data.content || []);
            }
        } catch (err) {
            console.error("Comment refresh failed", err);
        }
    };

    const refreshSelectedTicket = async (ticketId) => {
        // Rehydrate selected ticket details after status/comment actions.
        if (!ticketId || !token) return;
        try {
            const res = await fetch(`/api/v1/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = await parseResponse(res);
            if (res.ok && payload?.success) {
                setFullTicketDetails(payload.data);
                setSelectedTicket((prev) => prev ? { ...prev, ...payload.data } : prev);
                setResolutionNotes(payload.data.resolutionNotes || '');
                setRejectionReason(payload.data.rejectionReason || '');
            }
            await refreshComments(ticketId);
        } catch (err) {
            console.error("Ticket refresh failed", err);
        }
    };

    const handlePostComment = async () => {
        // Post a regular technician progress/update comment.
        const trimmed = newComment.trim();
        if (!trimmed) return;
        if (!selectedTicket?.id || !token) return;

        setIsPostingComment(true);
        try {
            const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: `Technician update: ${trimmed}` })
            });
            if (!response.ok) {
                const payload = await parseResponse(response);
                throw new Error(payload?.message || "Failed to post comment.");
            }
            setNewComment("");
            await refreshSelectedTicket(selectedTicket.id);
            toast.success("Comment posted.");
        } catch (err) {
            console.error("Post comment failed", err);
            toast.error(err.message || "Failed to post comment.");
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        // Generic status transition handler with required-note validations.
        if (newStatus === 'RESOLVED' && !resolutionNotes.trim()) {
            alert("Please provide resolution notes before completing the job.");
            return;
        }
        if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
            alert("Please provide a rejection reason before rejecting this assignment.");
            return;
        }

        setIsUpdatingStatus(true);
        try {
            const response = await fetch(`/api/v1/tickets/${selectedTicket.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    resolutionNotes: newStatus === 'RESOLVED' ? resolutionNotes : undefined,
                    reason: newStatus === 'REJECTED' ? rejectionReason : undefined
                })
            });
            const payload = await parseResponse(response);
            if (!response.ok) {
                throw new Error(payload?.message || "Failed to update status.");
            }
            await fetchAssignedTickets();
            await refreshSelectedTicket(selectedTicket.id);
            toast.success(`Status changed to ${newStatus.replace('_', ' ')}.`);
        } catch (err) {
            console.error("Status update failed", err);
            toast.error(err.message || "Status update failed.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRequestVerification = async () => {
        // Explicit verification request flow: move to ON_HOLD + add tagged comment.
        if (!selectedTicket?.id || !token) return;
        const trimmed = newComment.trim();

        setIsPostingComment(true);
        try {
            const statusResponse = await fetch(`/api/v1/tickets/${selectedTicket.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: 'ON_HOLD',
                    reason: trimmed || 'Technician requested verification from admin.'
                })
            });
            const statusPayload = await parseResponse(statusResponse);
            if (!statusResponse.ok) {
                throw new Error(statusPayload?.message || "Failed to request verification.");
            }

            const commentResponse = await fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: `Technician verification request: ${trimmed || "Please verify the latest work update."}`
                })
            });
            if (!commentResponse.ok) {
                const commentPayload = await parseResponse(commentResponse);
                throw new Error(commentPayload?.message || "Verification requested, but comment posting failed.");
            }

            setNewComment("");
            await fetchAssignedTickets();
            await refreshSelectedTicket(selectedTicket.id);
            toast.success("Verification requested. Ticket moved to ON_HOLD.");
        } catch (err) {
            console.error("Verification request failed", err);
            toast.error(err.message || "Unable to request verification.");
        } finally {
            setIsPostingComment(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Jobs</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and update the status of your assigned tasks.</p>
                </div>
                <button onClick={fetchAssignedTickets} className="p-2 text-gray-500 hover:text-teal-600 transition-colors">
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm animate-pulse">
                            <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-6"></div>
                            <div className="h-8 bg-gray-100 rounded-xl w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-50 rounded-lg w-1/2 mb-10"></div>
                            <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
                        </div>
                    ))
                ) : tickets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-inner">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-lg font-black text-gray-900 uppercase tracking-tight">Zero assignments detected</p>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Enjoy the break, technician!</p>
                    </div>
                ) : tickets.map((ticket) => (
                    <div key={ticket.id} className="group bg-white rounded-3xl p-7 border border-gray-200 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-0.5 hover:shadow-green-200/40 hover:border-green-200 transition-all duration-300 relative overflow-hidden flex flex-col">
                        {(() => {
                            const sla = getSlaLabel(ticket);
                            if (!sla) return null;
                            return (
                                <div className={`mb-3 inline-flex items-center self-start rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${sla.overdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                    {sla.text}
                                </div>
                            );
                        })()}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex flex-col items-start gap-1.5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                                        ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[10px] font-semibold tracking-wide text-gray-600">
                                    Resolution Time: {formatPriorityDuration(ticket.priority)}
                                </span>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                    ticket.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                        ticket.status === 'ON_HOLD' ? 'bg-violet-50 text-violet-700 border-violet-100' :
                                            ticket.status === 'IN_PROGRESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            'bg-gray-50 text-gray-700 border-gray-100'
                                }`}>
                                {ticket.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-green-800 transition-colors mb-2 line-clamp-2 tracking-tight relative z-10 leading-tight">{ticket.title}</h3>

                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-8 relative z-10">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="truncate uppercase tracking-wider">{ticket.location}</span>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Origin</p>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{ticket.reporterName}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="bg-green-800 hover:bg-green-900 text-white p-3.5 rounded-2xl shadow-lg shadow-green-200 transition-all transform hover:scale-105 active:scale-95 group/btn"
                            >
                                <svg className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Technician Job Detail Modal */}
            {selectedTicket && createPortal(
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-white/20">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight">{selectedTicket.title}</h3>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assignment ID: {selectedTicket.id.toString().padStart(5, '0')}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedTicket.status}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all shadow-sm active:scale-95"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {isLoadingDetails ? (
                                <div className="flex flex-col justify-center items-center py-20 gap-4">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Hydrating details...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <section>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Incident Metadata</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Impact Level</p>
                                                    <p className="text-sm font-black text-red-600 uppercase tracking-tight">{selectedTicket.priority}</p>
                                                    <p className="text-[10px] font-semibold tracking-wide text-gray-600 mt-1">
                                                        Resolution Time: {formatPriorityDuration(selectedTicket.priority)}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Target Location</p>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTicket.location}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Resolution Deadline</p>
                                                    {(() => {
                                                        const sla = getSlaLabel(activeTicket);
                                                        if (!sla) return <p className="text-sm font-black text-gray-400 uppercase tracking-tight">—</p>;
                                                        return (
                                                            <p className={`text-sm font-black uppercase tracking-tight ${sla.overdue ? 'text-red-600' : 'text-sky-700'}`}>
                                                                {sla.text}
                                                            </p>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-emerald-900 rounded-4xl p-8 text-white shadow-2xl shadow-emerald-100 flex flex-col gap-6">
                                            <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Operational Controls</h4>

                                            <div className="space-y-4">
                                                {activeStatus === 'OPEN' && (
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                                            disabled={isUpdatingStatus}
                                                            className="w-full bg-white text-emerald-900 font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-emerald-50 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            {isUpdatingStatus ? (
                                                                <div className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin"></div>
                                                            ) : "Initiate Progress"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowRejectBox(true); setShowResolutionBox(false); }}
                                                            className="w-full bg-red-500/90 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-red-500 transition-all transform active:scale-95"
                                                        >
                                                            Reject Assignment
                                                        </button>
                                                    </div>
                                                )}

                                                {activeStatus === 'IN_PROGRESS' && (
                                                    <div className="space-y-4">
                                                        {!showResolutionBox ? (
                                                            <div className="space-y-3">
                                                                <button
                                                                    onClick={() => { setShowResolutionBox(true); setShowRejectBox(false); }}
                                                                    className="w-full bg-white text-emerald-900 font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-emerald-50 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                                                >
                                                                    Complete Assignment
                                                                </button>
                                                                <button
                                                                    onClick={() => { setShowRejectBox(true); setShowResolutionBox(false); }}
                                                                    className="w-full bg-red-500/90 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-red-500 transition-all transform active:scale-95"
                                                                >
                                                                    Reject Assignment
                                                                </button>
                                                                <button
                                                                    onClick={handleRequestVerification}
                                                                    disabled={isPostingComment || isUpdatingStatus}
                                                                    className="w-full bg-violet-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-violet-600 disabled:opacity-50 transition-all transform active:scale-95"
                                                                >
                                                                    {isPostingComment ? "Requesting..." : "Request Verification"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Resolution Summary</label>
                                                                    <textarea
                                                                        value={resolutionNotes}
                                                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                                                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-xl focus:ring-white focus:border-white block p-4 shadow-inner placeholder:text-emerald-100/30"
                                                                        placeholder="What was the fix?"
                                                                        rows={4}
                                                                    ></textarea>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleUpdateStatus('RESOLVED')}
                                                                        disabled={isUpdatingStatus || !resolutionNotes.trim()}
                                                                        className="flex-1 bg-white text-emerald-900 font-black text-[10px] uppercase tracking-widest py-3 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-all active:scale-95"
                                                                    >
                                                                        Finalize
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowResolutionBox(false)}
                                                                        className="px-4 py-3 bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 rounded-lg hover:bg-emerald-700 transition-all"
                                                                    >
                                                                        Abort
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {showRejectBox && activeStatus !== 'REJECTED' && (
                                                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-red-200 uppercase tracking-widest mb-1.5 ml-1">Rejection Reason</label>
                                                            <textarea
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-xl focus:ring-white focus:border-white block p-4 shadow-inner placeholder:text-red-100/40"
                                                                placeholder="Why should this ticket be reassigned?"
                                                                rows={4}
                                                            ></textarea>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus('REJECTED')}
                                                                disabled={isUpdatingStatus || !rejectionReason.trim()}
                                                                className="flex-1 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all active:scale-95"
                                                            >
                                                                Submit Rejection
                                                            </button>
                                                            <button
                                                                onClick={() => setShowRejectBox(false)}
                                                                className="px-4 py-3 bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 rounded-lg hover:bg-emerald-700 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeStatus === 'RESOLVED' && (
                                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-inner">
                                                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Completion Note</p>
                                                        <p className="text-sm font-bold leading-relaxed">{fullTicketDetails?.resolutionNotes || 'Operational success.'}</p>
                                                    </div>
                                                )}

                                                {activeStatus === 'REJECTED' && (
                                                    <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-2xl p-5 shadow-inner">
                                                        <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-2">Rejection Reason Submitted</p>
                                                        <p className="text-sm font-bold leading-relaxed text-white">{fullTicketDetails?.rejectionReason || rejectionReason || 'No rejection reason provided.'}</p>
                                                    </div>
                                                )}

                                                {activeStatus === 'ON_HOLD' && (
                                                    <div className="bg-violet-500/20 backdrop-blur-md border border-violet-300/30 rounded-2xl p-5 shadow-inner">
                                                        <p className="text-[10px] font-black text-violet-200 uppercase tracking-widest mb-2">Awaiting Admin Verification</p>
                                                        <p className="text-sm font-bold leading-relaxed text-white">Your latest verification request has moved this ticket to ON_HOLD. It will return to IN_PROGRESS after admin replies.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-6 border-t border-white/10">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                                                    <span>Reported</span>
                                                    <span className="text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Stream</h4>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 tracking-widest">Live Updates</span>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-4xl p-8 shadow-sm">
                                            <TicketTimeline ticket={fullTicketDetails || selectedTicket} comments={ticketComments} />

                                            {(activeStatus === 'IN_PROGRESS' || activeStatus === 'ON_HOLD') && (
                                                <div className="mt-6 pt-6 border-t border-gray-100">
                                                    <label htmlFor="tech-comment" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                                                        Add Update / Reply to Admin
                                                    </label>
                                                    <textarea
                                                        id="tech-comment"
                                                        rows={3}
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Share progress, ask a question, or respond to the admin..."
                                                        disabled={isPostingComment}
                                                        className="w-full rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none resize-none transition disabled:opacity-60"
                                                    />
                                                    <div className="mt-2 flex justify-end">
                                                        <div className="flex gap-2">
                                                            {activeStatus === 'IN_PROGRESS' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleRequestVerification}
                                                                    disabled={isPostingComment || isUpdatingStatus}
                                                                    className="bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                                                >
                                                                    {isPostingComment ? "Requesting..." : "Request Verification"}
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={handlePostComment}
                                                                disabled={isPostingComment || !newComment.trim()}
                                                                className="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                                            >
                                                                {isPostingComment ? "Posting..." : "Post Comment"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {Array.isArray(fullTicketDetails?.attachments) && fullTicketDetails.attachments.length > 0 && (
                                            <div className="mt-10">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Visual Evidence</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {fullTicketDetails.attachments.map((file, idx) => (
                                                        <AttachmentTile
                                                            key={idx}
                                                            file={file}
                                                            token={token}
                                                            onOpen={async () => {
                                                                try { setAttachmentError(""); await openAttachmentWithAuth(file.downloadUrl, token, file.fileName); }
                                                                catch (error) { setAttachmentError(error.message || "Failed."); }
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                {attachmentError && <p className="mt-2 text-[10px] text-red-500 font-bold uppercase">{attachmentError}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-8 py-3 bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                            >
                                Exit Deployment
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
const sidebarLinks = [
  { id: 'overview', label: "Overview", icon: LayoutDashboard },
  { id: 'jobs', label: "My Assignments", icon: Briefcase },
];

const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [user, setUser] = useState({ id: 1, name: "Technician", role: "TECHNICIAN" });
    const token = localStorage.getItem("token");
    const currentUsername = localStorage.getItem("username") || "Technician";
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    useEffect(() => {
        // Build lightweight user profile from JWT/local storage context.
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const tokenUserId = payload?.userId || payload?.id || null;
                setUser({
                    id: tokenUserId,
                    name: currentUsername,
                    role: payload?.role || 'TECHNICIAN',
                    email: payload?.email || payload?.sub || ''
                });
            } catch (e) {
                console.error("Token decoding failed", e);
                setUser({ id: null, name: currentUsername, role: 'TECHNICIAN' });
            }
        } else {
            setUser({ id: null, name: currentUsername, role: 'TECHNICIAN' });
        }
    }, [token, currentUsername]);

    useEffect(() => {
        // Compute personal KPI cards from current technician assignments.
        if (token && user?.id && uuidPattern.test(String(user.id))) {
            const fetchPersonalStats = async () => {
                try {
                    const res = await fetch(`/api/v1/tickets?assigneeId=${user.id}&size=1000`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const payload = await parseResponse(res);
                    if (res.ok && payload?.success) {
                        const myTickets = payload.data.content || [];
                        setStats({
                            total: myTickets.length,
                            pending: myTickets.filter(t => t.status === 'OPEN').length,
                            inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
                            resolved: myTickets.filter(t => t.status === 'RESOLVED').length
                        });
                    }
                } catch (err) {
                    console.error("Personal stats fetch failed", err);
                }
            };
            fetchPersonalStats();
        }
    }, [token, user?.id, uuidPattern]);

    return (
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-transparent min-h-screen">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative transition-all duration-300">
            
            {/* Sidebar Overlay for mobile */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
    
            <aside 
              className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-auto transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? "translate-x-0 lg:block lg:col-span-3" : "-translate-x-full lg:hidden"}
                bg-white border-r lg:border border-gray-100 lg:rounded-3xl shadow-2xl lg:shadow-lg shadow-gray-200/50 p-5 lg:h-fit h-screen overflow-y-auto
              `}
            >
              <div className="flex items-center justify-between mb-6 lg:mb-4 mt-20 lg:mt-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Tech Panel</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-2">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-gray-700 hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => {
                        setActiveTab(link.id);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </span>
                      {isSidebarOpen && <ChevronRight className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'opacity-40'}`} />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8">
                  <div className="bg-linear-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white shadow-lg">
                      <p className="text-xs font-bold opacity-80 mb-2 truncate">{user?.email}</p>
                      <button onClick={() => navigate('/home')} className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-xs font-bold transition-colors">
                          User View
                      </button>
                  </div>
              </div>
            </aside>
    
            <section className={`${isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"} flex flex-col gap-6 transition-all duration-300`}>
              {/* Dashboard Header */}
              <header className="bg-white border border-gray-100 rounded-3xl shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 transition-colors"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Technician Workspace</h1>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border-2 border-emerald-200">
                     {currentUsername.charAt(0).toUpperCase()}
                   </div>
                   <div className="hidden sm:block">
                     <p className="text-sm font-bold text-gray-800">{currentUsername}</p>
                     <p className="text-xs text-gray-500">Technician</p>
                   </div>
                </div>
              </header>
    
              {/* Main Content Area */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-lg shadow-gray-200/50 p-6 sm:p-8">
                {activeTab === 'overview' && <TechOverviewTab user={user} stats={stats} />}
                {activeTab === 'jobs' && <TechJobsTab token={token} user={user} />}
              </div>
            </section>
          </div>
        </main>
    );
};

export default TechnicianDashboard;

