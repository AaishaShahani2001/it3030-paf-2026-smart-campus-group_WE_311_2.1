import React, { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";

const STATUS_META = {
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border border-green-200",
  REJECTED: "bg-rose-100 text-rose-800 border border-rose-200",
  CANCELLED: "bg-gray-100 text-gray-700 border border-gray-200",
  WAITLIST: "bg-violet-100 text-violet-800 border border-violet-200",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const resolveBookerName = (booking) => {
    return (
      booking?.userName ||
      booking?.username ||
      booking?.bookerName ||
      booking?.name ||
      booking?.user?.name ||
      booking?.email ||
      booking?.userEmail ||
      (booking?.userId ? `User #${booking.userId}` : "N/A")
    );
  };

  //  FIXED FETCH (NO TOKEN + SAFE)
  const fetchBookings = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/bookings");

      if (!res.ok) {
        const text = await res.text();
        console.log("API Error:", text);
        return;
      }

      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 🔍 FILTER + SEARCH
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        statusFilter === "ALL" || b.status === statusFilter;

      const query = search.toLowerCase();
      const booker = resolveBookerName(b).toLowerCase();
      const matchesSearch =
        b.purpose?.toLowerCase().includes(query) ||
        String(b.userId ?? "").toLowerCase().includes(query) ||
        booker.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  // 📊 STATS
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    rejected: bookings.filter((b) => b.status === "REJECTED").length,
    waitlist: bookings.filter((b) => b.status === "WAITLIST").length,
  };

  //  APPROVE
  const handleApprove = async (id) => {
    await fetch(`http://localhost:8080/api/bookings/${id}/approve`, {
      method: "PUT",
    });
    fetchBookings();
    setSelectedBooking(null);
  };

  //  REJECT
  const handleReject = async (id, reason) => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) return;

    await fetch(`http://localhost:8080/api/bookings/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: trimmedReason }),
    });

    fetchBookings();
    setRejectingBooking(null);
    setRejectReason("");
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">Booking Operations</p>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">All Bookings</h1>
          <p className="text-gray-500 text-sm">Manage requests, approvals, and status changes.</p>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Total</p>
          <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
          <p className="text-xs text-amber-700 font-semibold">Pending</p>
          <p className="text-2xl font-extrabold text-amber-800">{stats.pending}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-green-200 shadow-sm">
          <p className="text-xs text-green-700 font-semibold">Approved</p>
          <p className="text-2xl font-extrabold text-green-800">{stats.approved}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-sm">
          <p className="text-xs text-rose-700 font-semibold">Rejected</p>
          <p className="text-2xl font-extrabold text-rose-800">{stats.rejected}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-violet-200 shadow-sm">
          <p className="text-xs text-violet-700 font-semibold">Waitlist</p>
          <p className="text-2xl font-extrabold text-violet-800">{stats.waitlist}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by purpose, user ID, or booker name..."
          className="border border-gray-300 px-3 py-2 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {["ALL", "PENDING", "APPROVED", "REJECTED", "WAITLIST", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm ${
              statusFilter === s
                ? "bg-green-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-700">
            <tr>
              <th className="p-3">Resource</th>
              <th className="p-3">Booker</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Status</th>
              <th className="p-3">Purpose</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                <td className="p-3"> {b.resourceName || `Resource #${b.resourceId}`}</td>
                <td className="p-3 font-medium text-gray-800">{resolveBookerName(b)}</td>
                <td className="p-3">{new Date(b.startTime).toLocaleString()}</td>
                <td className="p-3">{new Date(b.endTime).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[b.status] || STATUS_META.CANCELLED}`}>
                    {b.status}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{b.purpose}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 border border-green-200 rounded-lg hover:bg-green-800 hover:text-white hover:border-green-800 transition"
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No bookings found for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-linear-to-r from-green-50 to-gray-50">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">Booking Review</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Resource #{selectedBooking.resourceId}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUS_META[selectedBooking.status] || STATUS_META.CANCELLED
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Booker</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{resolveBookerName(selectedBooking)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">User ID</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.userId ?? "N/A"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Start Time</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {new Date(selectedBooking.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">End Time</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {new Date(selectedBooking.endTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purpose</p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                  {selectedBooking.purpose || "No purpose provided."}
                </p>
              </div>

              {selectedBooking.rejectReason && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Reject Reason</p>
                  <p className="mt-1 text-sm text-rose-800 leading-relaxed">
                    {selectedBooking.rejectReason}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {selectedBooking.status !== "APPROVED" && (
                  <button
                    onClick={() => handleApprove(selectedBooking.id)}
                    className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg transition"
                  >
                    Approve
                  </button>
                )}
                {selectedBooking.status !== "REJECTED" && (
                  <button
                    onClick={() => {
                      setRejectingBooking(selectedBooking);
                      setRejectReason("");
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectingBooking && (
        <div className="fixed inset-0 z-[60] bg-black/45 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-rose-50 to-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Reject Booking</h3>
              <p className="text-sm text-gray-600 mt-1">
                Resource #{rejectingBooking.resourceId} - {resolveBookerName(rejectingBooking)}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this booking is rejected..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition resize-y"
              />
              <div className="mt-5 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => {
                    setRejectingBooking(null);
                    setRejectReason("");
                  }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectingBooking.id, rejectReason)}
                  disabled={!rejectReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;