import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TICKET_API_BASE = '/api/tickets';

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

const ReportAnIssue = () => {
  const navigate = useNavigate();

  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    location: "",
    contactPhone: "",
    contactEmail: "",
    reporterEmail: "",
  });

  useEffect(() => {
    const reporterEmail = getReporterEmailFromAuthState();
    if (reporterEmail) {
      setTicketForm((prev) => ({ ...prev, reporterEmail }));
    }
  }, []);

  const handleTicketFieldChange = (event) => {
    const { name, value } = event.target;
    setTicketForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (event) => {
    setAttachments(Array.from(event.target.files || []));
  };

  const handleTicketSubmit = async (event) => {
    event.preventDefault();
    setTicketMessage("");

    setIsSubmittingTicket(true);
    try {
      if (!ticketForm.reporterEmail) {
        throw new Error("Could not detect logged-in user email. Please login again.");
      }

      if (attachments.length > 0) {
        toast.info("Attachments are not uploaded yet. Ticket will be submitted without files.");
      }

      const response = await fetch(TICKET_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: ticketForm.title,
          description: ticketForm.description,
          category: ticketForm.category,
          priority: ticketForm.priority,
          location: ticketForm.location,
          contactPhone: ticketForm.contactPhone || null,
          contactEmail: ticketForm.contactEmail || null,
          reporterEmail: ticketForm.reporterEmail,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit ticket.");
      }

      const successMessage = data?.message || "Request submitted successfully.";
      setTicketMessage(successMessage);
      toast.success(successMessage);
      const reporterEmail = getReporterEmailFromAuthState();
      setTicketForm({
        title: "",
        description: "",
        category: "OTHER",
        priority: "MEDIUM",
        location: "",
        contactPhone: "",
        contactEmail: "",
        reporterEmail,
      });
      setAttachments([]);
    } catch (error) {
      toast.error(error.message || "Unable to submit ticket right now.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="px-6 py-8 sm:p-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Report an Issue</h1>
            <p className="mt-2 text-lg text-gray-500">
              Describe the problem and where it occurred. Attach photos if helpful.
            </p>

            {ticketMessage && (
              <div className="mt-6 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-sm">{ticketMessage}</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required maxLength={255} value={ticketForm.title} onChange={handleTicketFieldChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all" placeholder="Short summary (e.g. projector in Lab 3)" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select name="category" value={ticketForm.category} onChange={handleTicketFieldChange} className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white transition-all">
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="IT_EQUIPMENT">IT Equipment</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="HVAC">HVAC</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="SECURITY">Security</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select name="priority" value={ticketForm.priority} onChange={handleTicketFieldChange} className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white transition-all">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location on campus</label>
                  <input type="text" name="location" required maxLength={255} value={ticketForm.location} onChange={handleTicketFieldChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all" placeholder="Building, floor, room or area" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea rows={4} name="description" required value={ticketForm.description} onChange={handleTicketFieldChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all resize-y" placeholder="What happened, when, and any safety or access notes"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (optional)</label>
                  <input type="text" name="contactPhone" maxLength={50} value={ticketForm.contactPhone} onChange={handleTicketFieldChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all" placeholder="For follow-up if needed" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reporter email</label>
                  <input type="email" name="reporterEmail" required value={ticketForm.reporterEmail} readOnly className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-100 text-gray-700 sm:text-sm transition-all" placeholder="Auto-filled from login" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alternate email (optional)</label>
                  <input type="email" name="contactEmail" value={ticketForm.contactEmail} onChange={handleTicketFieldChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all" placeholder="Optional contact email" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Files & Photos (optional)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-emerald-500 transition-colors bg-gray-50">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-emerald-600 hover:text-emerald-700 focus-within:outline-none">
                          <span>Upload files</span>
                          <input type="file" multiple onChange={handleAttachmentChange} className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {attachments.length > 0 ? `${attachments.length} file(s) selected` : 'PNG, JPG, PDF up to 10MB'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-4 flex items-center justify-end border-t border-gray-100">
                  <button type="button" onClick={() => navigate(-1)} className="bg-white py-3 px-6 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/40 mr-4 transition-all duration-300">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="py-3 px-8 text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)] disabled:cursor-not-allowed"
                  >
                    {isSubmittingTicket ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
  );
};

export default ReportAnIssue;
