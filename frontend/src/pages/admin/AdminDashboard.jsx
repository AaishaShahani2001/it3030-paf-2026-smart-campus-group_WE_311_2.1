import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Ticket,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import RaisedTickets from "../../components/admin/RaisedTickets";
import AdminBookings from "../../components/admin/AdminBookings";

const sidebarLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, view: "overview" },
  { label: "Manage Facilities", to: "/admin/facilities", icon: Wrench, view: "facilities" },
  { label: "Raised Tickets", to: "/admin/tickets", icon: Ticket, view: "tickets" },
  { label: "Manage Bookings", to: "/admin/dashboard", icon: Ticket, view: "bookings" },

];

const AdminDashboard = () => {
  const location = useLocation();
  const currentUsername = localStorage.getItem("username") || "Admin";
  // Default to true so desktop users see the sidebar by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    if (location.pathname === "/admin/tickets") {
      setActiveView("tickets");
      return;
    }
    if (location.pathname === "/admin/bookings") {
      setActiveView("bookings");
      return;
    }
    setActiveView("overview");
  }, [location.pathname]);

  return (
    <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative transition-all duration-300">
        
        {/* Sidebar Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
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
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Admin Panel</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isRouteMatch = location.pathname === link.to;
              const isActive = link.view === "overview" ? isRouteMatch && activeView === "overview" : activeView === link.view;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-gray-700 hover:bg-gray-50 border border-transparent"
                  }`}
                  onClick={() => {
                    setActiveView(link.view);
                    // Close sidebar only if we are on a smaller screen (matches lg breakpoint)
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'opacity-40'}`} />
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className={`${isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"} flex flex-col gap-6 transition-all duration-300`}>
          {/* Dashboard Header */}
          <header className="bg-white border border-gray-100 rounded-3xl shadow-sm px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Dashboard Overview</h1>
            </div>
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border-2 border-emerald-200">
                 {currentUsername.charAt(0).toUpperCase()}
               </div>
               <div className="hidden sm:block">
                 <p className="text-sm font-bold text-gray-800">{currentUsername}</p>
                 <p className="text-xs text-gray-500">Administrator</p>
               </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg shadow-gray-200/50 p-6 sm:p-8">
            {activeView === "tickets" ? (
              <RaisedTickets />
            ) : activeView === "bookings" ? (
              <AdminBookings />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Welcome back, {currentUsername}
                  </h1>
                </div>
                <p className="text-gray-500 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                  Manage campus facilities, oversee raised tickets, and maintain infrastructure seamlessly from your command center.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;