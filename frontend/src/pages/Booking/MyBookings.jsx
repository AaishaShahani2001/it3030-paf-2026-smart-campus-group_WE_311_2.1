import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function MyBookings({ hideLayout }) {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ✅ FETCH USER BOOKINGS
  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    if (!email) {
      console.error("No email found in localStorage");
      return;
    }

    fetch(`http://localhost:8080/api/bookings/user-by-email/${email}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA:", data);
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        setBookings([]);
      });
  }, []);

  const now = new Date();
  const approvedBookings = bookings.filter((b) => b.status === "APPROVED");

  // ✅ UPCOMING
  const upcoming = bookings
    .filter((b) => new Date(b.startTime) >= now)
    .filter((b) =>
      ["APPROVED", "PENDING", "WAITLIST"].includes(b.status)
    );

  // ✅ PAST
  const past = bookings
    .filter((b) => new Date(b.startTime) < now)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // ✅ CALENDAR FILTER
  const getBookingsForDate = (date) => {
    return approvedBookings.filter(
      (b) =>
        new Date(b.startTime).toDateString() ===
        date.toDateString()
    );
  };

  const isPast = (date) => new Date(date) < new Date();

  // ✅ CANCEL BOOKING
  const handleCancel = async (id) => {
    const confirm = window.confirm("Cancel this booking?");
    if (!confirm) return;

    try {
      await fetch(`http://localhost:8080/api/bookings/${id}/cancel`, {
        method: "PUT",
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "CANCELLED" } : b
        )
      );
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  // ✅ STATUS COLOR
  const statusColor = (status) => {
    if (status === "APPROVED") return "bg-green-100 text-green-800 border border-green-200";
    if (status === "WAITLIST") return "bg-amber-100 text-amber-800 border border-amber-200";
    if (status === "REJECTED") return "bg-red-100 text-red-800 border border-red-200";
    if (status === "CANCELLED") return "bg-gray-200 text-gray-700 border border-gray-300";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  // ✅ BOOKING CARD
  const BookingCard = ({ b }) => (
    <div className="bg-white rounded-2xl shadow-md p-5 mb-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-900">
            Resource #{b.resourceId}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(b.startTime).toLocaleString()} →{" "}
            {new Date(b.endTime).toLocaleString()}
          </p>
        </div>

        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor(
            b.status
          )}`}
        >
          {b.status}
        </span>
      </div>

      {/* ✅ NEW: SHOW REASON */}
      {(b.status === "REJECTED" || b.status === "CANCELLED") && (
        <p className="mt-2 text-sm text-red-500 font-medium">
          Reason: {b.rejectReason || "No reason provided"}
        </p>
      )}

      {/* CANCEL BUTTON */}
      {(b.status === "APPROVED" || b.status === "WAITLIST") &&
        !isPast(b.endTime) && (
          <button
            onClick={() => handleCancel(b.id)}
            className="mt-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
        )}
    </div>
  );

  return (
    <>
      {!hideLayout && <Navbar />}

      <div className="bg-transparent min-h-screen py-10 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 p-8">

          {/* HEADER */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-800">Bookings</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              My Bookings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track approved reservations and upcoming requests in one place.
            </p>
          </div>

          {/* 🔥 CALENDAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={({ date }) => {
                  const dayBookings = getBookingsForDate(date);

                  if (dayBookings.length === 0) return null;

                  const hasPast = dayBookings.some((b) =>
                    isPast(b.endTime)
                  );
                  const hasUpcoming = dayBookings.some(
                    (b) => !isPast(b.endTime)
                  );

                  return (
                    <div className="flex justify-center mt-1 gap-1">
                      {hasPast && (
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      )}
                      {hasUpcoming && (
                        <div className="w-2 h-2 rounded-full bg-green-700"></div>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            {/* SELECTED DATE */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-4">
                Approved bookings on {selectedDate.toDateString()}
              </h3>

              {getBookingsForDate(selectedDate).length === 0 && (
                <p className="text-gray-500">No approved bookings</p>
              )}

              {getBookingsForDate(selectedDate).map((b) => (
                <div
                  key={b.id}
                  className={`p-4 mb-3 rounded-lg shadow ${
                    isPast(b.endTime)
                      ? "bg-gray-100 border border-gray-300"
                      : "bg-green-100 border border-green-300"
                  }`}
                >
                  <p className="font-bold text-gray-900">Resource #{b.resourceId}</p>
                  <p className="text-sm text-gray-700">
                    {new Date(b.startTime).toLocaleTimeString()} -{" "}
                    {new Date(b.endTime).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-700">Status: {b.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING */}
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Upcoming Bookings
          </h3>
          {upcoming.length === 0 && (
            <p className="text-gray-500 mb-5">No upcoming bookings</p>
          )}
          {upcoming.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}

          {/* PAST */}
          <h3 className="text-lg font-semibold mt-8 mb-3 text-gray-800">
            Past Bookings
          </h3>
          {past.length === 0 && (
            <p className="text-gray-500">No past bookings</p>
          )}
          {past.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}

        </div>
      </div>

      {!hideLayout && <Footer />}
    </>
  );
}