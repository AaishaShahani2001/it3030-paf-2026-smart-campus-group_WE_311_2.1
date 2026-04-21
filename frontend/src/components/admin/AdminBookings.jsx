import React, { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";

const STATUS_META = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  WAITLIST: "bg-purple-50 text-purple-700",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // 🔥 FIXED FETCH (NO TOKEN + SAFE)
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
      const matchesSearch =
        b.purpose?.toLowerCase().includes(query) ||
        String(b.userId).toLowerCase().includes(query);

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

  // ✅ APPROVE
  const handleApprove = async (id) => {
    await fetch(`http://localhost:8080/api/bookings/${id}/approve`, {
      method: "PUT",
    });
    fetchBookings();
    setSelectedBooking(null);
  };

  // ❌ REJECT
  const handleReject = async (id) => {
    const reason = prompt("Enter reject reason:");
    if (!reason) return;

    await fetch(`http://localhost:8080/api/bookings/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    fetchBookings();
    setSelectedBooking(null);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Bookings</h1>
          <p className="text-gray-500 text-sm">
            Manage all resource bookings
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow">Total: {stats.total}</div>
        <div className="p-4 bg-white rounded-xl shadow">Pending: {stats.pending}</div>
        <div className="p-4 bg-white rounded-xl shadow">Approved: {stats.approved}</div>
        <div className="p-4 bg-white rounded-xl shadow">Rejected: {stats.rejected}</div>
        <div className="p-4 bg-white rounded-xl shadow">Waitlist: {stats.waitlist}</div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-2 rounded-lg w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {["ALL", "PENDING", "APPROVED", "REJECTED", "WAITLIST", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm ${
              statusFilter === s
                ? "bg-black text-white"
                : "bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm">
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
              <tr key={b.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{b.resourceId}</td>
                <td className="p-3">{b.userName || "N/A"}</td>
                <td className="p-3">{new Date(b.startTime).toLocaleString()}</td>
                <td className="p-3">{new Date(b.endTime).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_META[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="p-3">{b.purpose}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-600 hover:text-white"
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-2xl w-[420px]">
            <h2 className="text-xl font-bold mb-3">Booking Details</h2>

            <p><b>Resource:</b> {selectedBooking.resourceId}</p>
            <p><b>User:</b> {selectedBooking.userId}</p>
            <p><b>Start:</b> {new Date(selectedBooking.startTime).toLocaleString()}</p>
            <p><b>End:</b> {new Date(selectedBooking.endTime).toLocaleString()}</p>
            <p><b>Status:</b> {selectedBooking.status}</p>
            <p><b>Purpose:</b> {selectedBooking.purpose}</p>

            {selectedBooking.rejectReason && (
              <p className="text-red-600">
                <b>Reject Reason:</b> {selectedBooking.rejectReason}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleApprove(selectedBooking.id)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Approve
              </button>

              <button
                onClick={() => handleReject(selectedBooking.id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Reject
              </button>

              <button
                onClick={() => setSelectedBooking(null)}
                className="border px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;