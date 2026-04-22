import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  AlertTriangle,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import AllTickets from "../../components/user/AllTickets";
import MyBookings from "../../pages/Booking/MyBookings";
import { CalendarDays } from "lucide-react";

const sidebarLinks = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tickets", label: "My tickets", icon: TicketIcon },
  // { label: "Report an issue", to: "/report-an-issue", icon: AlertTriangle },
  { id: "bookings", label: "My bookings", icon: CalendarDays },
];

const UserDashboard = () => {
  const location = useLocation();
  const currentUsername = localStorage.getItem("username") || "Student";
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("section");
    const hashSection = window.location.hash.replace("#", "");
    if (sectionParam === "tickets" || hashSection === "tickets") return "tickets";
    if (sectionParam === "bookings" || hashSection === "bookings") return "bookings";
    return "overview";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get("section");
    const hashSection = location.hash.replace("#", "");
    if (sectionParam === "tickets" || hashSection === "tickets") {
      setActiveSection("tickets");
      return;
    }
    if (sectionParam === "bookings" || hashSection === "bookings") {
      setActiveSection("bookings");
      return;
    }
    if (sectionParam === "overview" || hashSection === "overview") {
      setActiveSection("overview");
    }
  }, [location.hash, location.search]);

  return (
    <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative transition-all duration-300">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-auto transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0 lg:block lg:col-span-3" : "-translate-x-full lg:hidden"}
            bg-white border-r lg:border border-gray-100 lg:rounded-3xl shadow-2xl lg:shadow-lg shadow-gray-200/50 p-5 lg:h-fit h-screen overflow-y-auto
          `}
        >
          <div className="flex items-center justify-between mb-6 lg:mb-4 lg:mt-0 mt-20">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Student panel
            </h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              if (link.to) {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "text-gray-700 hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 ${isActive ? "text-emerald-500" : "opacity-40"}`}
                    />
                  </Link>
                );
              }
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-gray-700 hover:bg-gray-50 border border-transparent"
                  }`}
                  onClick={() => {
                    setActiveSection(link.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 ${isActive ? "text-emerald-500" : "opacity-40"}`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        <section
          className={`${
            isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"
          } flex flex-col gap-6 transition-all duration-300`}
        >
          <header className="bg-white border border-gray-100 rounded-3xl shadow-sm px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                {activeSection === "tickets" ? "My tickets" : "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border-2 border-emerald-200">
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{currentUsername}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            </div>
          </header>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg shadow-gray-200/50 p-6 sm:p-8">
            {activeSection === "overview" && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Welcome, {currentUsername}
                  </h2>
                </div>
                <p className="text-gray-500 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                  Track facility issues you have reported and open the{" "}
                  <strong className="text-gray-700">My tickets</strong> section to see full
                  history and status updates.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection("tickets")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200/50 hover:bg-emerald-700 transition-colors"
                  >
                    <TicketIcon className="h-4 w-4" />
                    View my tickets
                  </button>
                  <Link
                    to="/report-an-issue"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Report an issue
                  </Link>
                </div>
              </div>
            )}

            {activeSection === "tickets" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Raised tickets
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Issues you submitted with your account email appear here.
                  </p>
                </div>
                <AllTickets />
              </div>
            )}
          </div>
          {activeSection === "bookings" && (
              <MyBookings hideLayout={true} />
            )}
        </section>
      </div>
    </main>
  );
};

export default UserDashboard;
