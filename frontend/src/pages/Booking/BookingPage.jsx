import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: localStorage.getItem("username") || "",
    email: localStorage.getItem("userEmail") || "",
    phone: "",
    occupation: "UNDERGRAD",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    // ✅ DEBUG (VERY IMPORTANT)
    console.log("FORM DATA:", form);

    try {
      const res = await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: parseInt(id),
          startTime: form.startTime,
          endTime: form.endTime,
          purpose: form.purpose,
          attendees: 1,
          email: form.email,

          userName: form.name,        // ✅ FIX
          occupation: form.occupation // ✅ FIX
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMessage("Booking successful!");
      toast.success("Booking created successfully");

      navigate("/bookings");

    } catch (err) {
      toast.error(err.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full bg-transparent">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-gray-200 bg-linear-to-r from-green-50 to-gray-50">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-800">Reservation Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Book Resource</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in your booking details to request access to this resource.
          </p>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-900">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  value={form.email}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 outline-none transition"
                  placeholder="Optional contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
                <select
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 outline-none transition"
                >
                  <option value="UNDERGRAD">Undergraduate</option>
                  <option value="POSTGRAD">Postgraduate</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose</label>
              <textarea
                rows={4}
                name="purpose"
                required
                value={form.purpose}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-700/25 focus:border-green-700 sm:text-sm transition resize-y outline-none"
                placeholder="Explain why you need this resource..."
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-800 hover:bg-green-900 text-white px-8 py-3 rounded-xl font-semibold transition disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default BookingPage;