import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
    <>
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="px-6 py-8 sm:p-10">

            <h1 className="text-3xl font-extrabold text-gray-900">
              Book Resource
            </h1>

            {message && (
              <div className="mt-6 p-4 rounded-xl bg-green-50 text-green-800">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                {/* NAME */}
                <div>
                  <label>Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label>Email</label>
                  <input
                    name="email"
                    value={form.email}
                    readOnly
                    className="w-full p-3 border rounded-xl bg-gray-100"
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                {/* OCCUPATION */}
                <div>
                  <label>Occupation</label>
                  <select
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  >
                    <option value="UNDERGRAD">Undergraduate</option>
                    <option value="POSTGRAD">Postgraduate</option>
                    <option value="LECTURER">Lecturer</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                {/* START */}
                <div>
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                {/* END */}
                <div>
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

              </div>

              {/* PURPOSE */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Purpose
                </label>

                <textarea
                  rows={4}
                  name="purpose"
                  required
                  value={form.purpose}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all resize-y"
                  placeholder="Explain why you need this resource..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-3 rounded-xl"
              >
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
              </button>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BookingPage;