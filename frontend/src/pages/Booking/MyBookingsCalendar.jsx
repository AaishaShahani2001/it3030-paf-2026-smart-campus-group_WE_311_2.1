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

        //  NORMALIZE STATUS (VERY IMPORTANT FIX)
        const normalized = data.map((b) => ({
          ...b,
          status: b.status?.toUpperCase().trim(),
        }));

        setBookings(normalized);

        // ✅ONLY APPROVED BOOKINGS FOR CALENDAR
        const approved = normalized.filter(
          (b) => b.status === "APPROVED"
        );

        setApprovedBookings(approved);
      });
  }, []);

  // APPROVED BOOKINGS FOR SELECTED DATE
  const selectedApprovedBookings = approvedBookings.filter(
    (b) =>
      new Date(b.startTime).toDateString() ===
      selectedDate.toDateString()
  );

  const now = new Date();

  //  DATES WITH APPROVED BOOKINGS (past/upcoming separated)
  const approvedPastDates = approvedBookings
    .filter((b) => new Date(b.endTime) < now)
    .map((b) => new Date(b.startTime).toDateString());
  const approvedUpcomingDates = approvedBookings
    .filter((b) => new Date(b.endTime) >= now)
    .map((b) => new Date(b.startTime).toDateString());

  //  UPCOMING APPROVED BOOKINGS ONLY
  const upcomingBookings = approvedBookings.filter(
    (b) => new Date(b.startTime) > now
  );

  const statusBadge = (status) =>
    status === "APPROVED"
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <div className="space-y-10 bg-transparent">

      {/* ================= CALENDAR ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CALENDAR */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {selectedDate.toDateString()}
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(30)].map((_, i) => {
              const day = new Date(2026, 3, i + 1);

              const isSelected =
                day.toDateString() === selectedDate.toDateString();

              const dayString = day.toDateString();
              const hasPastApproved = approvedPastDates.includes(dayString);
              const hasUpcomingApproved = approvedUpcomingDates.includes(dayString);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 text-center rounded-lg cursor-pointer transition font-medium
                    ${
                      isSelected
                        ? "bg-green-800 text-white shadow"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }
                  `}
                >
                  {i + 1}

                  {/* ✅ ONLY APPROVED dots (past + upcoming) */}
                  {(hasPastApproved || hasUpcomingApproved) && (
                    <div className="flex justify-center mt-1 gap-1">
                      {hasPastApproved && (
                        <div className="w-2 h-2 bg-gray-500 mx-auto rounded-full"></div>
                      )}
                      {hasUpcomingApproved && (
                        <div className="w-2 h-2 bg-green-700 mx-auto rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* APPROVED BOOKINGS DETAILS */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
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
                <div key={b.id} className="p-4 mb-4 rounded-xl border border-green-200 bg-green-50">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                    Resource #{b.resourceId}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(b.startTime).toLocaleTimeString()} -{" "}
                    {new Date(b.endTime).toLocaleTimeString()}
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      isPast
                        ? "text-gray-400"
                        : "text-green-700"
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Upcoming Approved Bookings
        </h2>

        {upcomingBookings.length === 0 ? (
          <p className="text-gray-500">
            No upcoming bookings
          </p>
        ) : (
          upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 mb-4 border border-gray-200 rounded-xl bg-white shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-gray-900">
                  Resource #{b.resourceId}
                </h3>

                <p className="text-sm text-gray-600">
                  {new Date(b.startTime).toLocaleString()} →{" "}
                  {new Date(b.endTime).toLocaleString()}
                </p>
              </div>

              {/* STATUS BADGE */}
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(b.status)}`}
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