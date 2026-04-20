import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";


// ✅ IMPORT YOUR EXISTING COMPONENTS
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
    occupation: "Undergraduate",
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

    try {
      const res = await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1,
          resourceId: parseInt(id),
          startTime: form.startTime,
          endTime: form.endTime,
          purpose: form.purpose,
          attendees: 1,
          email: form.email 
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
      {/* ✅ NAVBAR */}
      <Navbar />

      {/* ✅ MAIN CONTENT (SAME STYLE AS REPORT PAGE) */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in-up">
        
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="px-6 py-8 sm:p-10">

            {/* TITLE */}
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Book Resource
            </h1>

            <p className="mt-2 text-lg text-gray-500">
              Fill the form to book your resource.
            </p>

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="mt-6 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    required
                    value={form.email}
                    readOnly
                    className="p-3 border rounded-xl bg-gray-100 cursor-not-allowed"
                    />
                </div>

                {/* PHONE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* OCCUPATION */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Occupation
                  </label>
                  <select
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                  >
                    <option value="UNDERGRAD">Undergraduate</option>
                    <option value="POSTGRAD">Postgraduate</option>
                    <option value="LECTURER">Lecturer</option>
                    <option value="STAFF">Academic Staff</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* START TIME */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    value={form.startTime}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm"
                  />
                </div>

                {/* END TIME */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    value={form.endTime}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm"
                  />
                </div>

              </div>

              {/* PURPOSE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  rows={4}
                  name="purpose"
                  required
                  value={form.purpose}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm"
                />
              </div>

              {/* BUTTONS */}
              <div className="pt-4 flex items-center justify-end border-t border-gray-100">

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-3 px-6 border border-gray-300 rounded-xl text-sm font-bold mr-4"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 px-8 text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)] disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Confirm Booking"}
                </button>

              </div>

            </form>
          </div>
        </div>
      </main>

      {/* ✅ FOOTER */}
      <Footer />
    </>
  );
};

export default BookingPage;