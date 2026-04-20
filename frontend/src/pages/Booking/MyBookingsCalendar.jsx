import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const MyBookingsCalendar = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ✅ FETCH BOOKINGS
  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    fetch(`http://localhost:8080/api/bookings/user-by-email/${email}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("ALL BOOKINGS:", data); // debug
        setBookings(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // ✅ NORMALIZE STATUS (🔥 KEY FIX)
  const isValidStatus = (status) => {
    const s = status?.trim().toUpperCase();
    return s === "APPROVED" || s === "PENDING" || s === "WAITLIST";
  };

  // ✅ FILTER FOR SELECTED DATE
  const getBookingsForDate = (date) => {
    return bookings.filter((b) => {

      console.log("CHECK STATUS:", b.status, "->", b.status?.trim().toUpperCase());

      const sameDate =
        new Date(b.startTime).toDateString() === date.toDateString();

      return sameDate && isValidStatus(b.status); // ✅ CLEAN
    });
  };

  const isPast = (date) => new Date(date) < new Date();

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-12 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Bookings Calendar</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ✅ CALENDAR */}
          <div className="bg-white p-4 rounded-xl shadow">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={({ date }) => {

                const dayBookings = bookings.filter((b) => {
                  const sameDate =
                    new Date(b.startTime).toDateString() === date.toDateString();

                  return sameDate && isValidStatus(b.status);
                });

                if (dayBookings.length === 0) return null;

                return (
                  <div className="flex justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                );
              }}
            />
          </div>

          {/* ✅ BOOKINGS LIST */}
          <div className="bg-white p-4 rounded-xl shadow">

            <h2 className="font-semibold mb-4">
              Bookings on {selectedDate.toDateString()}
            </h2>

            {getBookingsForDate(selectedDate).length === 0 && (
              <p className="text-gray-500">No bookings</p>
            )}

            {getBookingsForDate(selectedDate).map((b) => (
              <div
                key={b.id}
                className={`p-4 mb-3 rounded-lg shadow ${
                  isPast(b.endTime)
                    ? "bg-red-100 border border-red-300"
                    : "bg-blue-100 border border-blue-300"
                }`}
              >
                <p className="font-bold">Resource #{b.resourceId}</p>
                <p>
                  {new Date(b.startTime).toLocaleTimeString()} -{" "}
                  {new Date(b.endTime).toLocaleTimeString()}
                </p>
                <p>Status: {b.status}</p>
              </div>
            ))}

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default MyBookingsCalendar;