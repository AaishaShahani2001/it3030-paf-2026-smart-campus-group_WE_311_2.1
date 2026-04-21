import React, { useEffect, useState } from "react";

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // FETCH BOOKINGS
  useEffect(() => {
    fetch("http://localhost:8080/api/bookings")
      .then((res) => res.json())
      .then((data) => {

        // ✅ NORMALIZE STATUS (VERY IMPORTANT FIX)
        const normalized = data.map((b) => ({
          ...b,
          status: b.status?.toUpperCase().trim(),
        }));

        setBookings(normalized);

        // ✅ ONLY APPROVED BOOKINGS FOR CALENDAR
        const approved = normalized.filter(
          (b) => b.status === "APPROVED"
        );

        setApprovedBookings(approved);
      });
  }, []);

  // ✅ APPROVED BOOKINGS FOR SELECTED DATE
  const selectedApprovedBookings = approvedBookings.filter(
    (b) =>
      new Date(b.startTime).toDateString() ===
      selectedDate.toDateString()
  );

  // ✅ DATES WITH APPROVED BOOKINGS
  const approvedDates = approvedBookings.map((b) =>
    new Date(b.startTime).toDateString()
  );

  // ✅ UPCOMING BOOKINGS (ALL STATUS)
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) > new Date()
  );

  return (
    <div className="space-y-10">

      {/* ================= CALENDAR ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CALENDAR */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">
            {selectedDate.toDateString()}
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(30)].map((_, i) => {
              const day = new Date(2026, 3, i + 1);

              const isSelected =
                day.toDateString() === selectedDate.toDateString();

              const hasBooking = approvedDates.includes(
                day.toDateString()
              );

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 text-center rounded cursor-pointer transition
                    ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }
                  `}
                >
                  {i + 1}

                  {/* ✅ ONLY APPROVED DOT */}
                  {hasBooking && (
                    <div className="w-2 h-2 bg-blue-500 mx-auto mt-1 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* APPROVED BOOKINGS DETAILS */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">
            Bookings on {selectedDate.toDateString()}
          </h2>

          {selectedApprovedBookings.length === 0 ? (
            <p className="text-gray-500">
              No approved bookings
            </p>
          ) : (
            selectedApprovedBookings.map((b) => {
              const isPast =
                new Date(b.endTime) < new Date();

              return (
                <div
                  key={b.id}
                  className="p-4 mb-4 rounded-xl border bg-blue-50"
                >
                  <h3 className="font-semibold">
                    Resource #{b.resourceId}
                  </h3>

                  <p>
                    {new Date(b.startTime).toLocaleTimeString()} -{" "}
                    {new Date(b.endTime).toLocaleTimeString()}
                  </p>

                  <p className="text-green-600 font-semibold text-sm">
                    APPROVED
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      isPast
                        ? "text-gray-400"
                        : "text-green-500"
                    }`}
                  >
                    {isPast
                      ? "Past Booking"
                      : "Upcoming Booking"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= UPCOMING BOOKINGS ================= */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Upcoming Bookings
        </h2>

        {upcomingBookings.length === 0 ? (
          <p className="text-gray-500">
            No upcoming bookings
          </p>
        ) : (
          upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 mb-4 border rounded-xl bg-white shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">
                  Resource #{b.resourceId}
                </h3>

                <p className="text-sm text-gray-600">
                  {new Date(b.startTime).toLocaleString()} →{" "}
                  {new Date(b.endTime).toLocaleString()}
                </p>
              </div>

              {/* STATUS BADGE */}
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full
                  ${
                    b.status === "APPROVED"
                      ? "bg-green-100 text-green-600"
                      : b.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-600"
                      : b.status === "REJECTED"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }
                `}
              >
                {b.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}