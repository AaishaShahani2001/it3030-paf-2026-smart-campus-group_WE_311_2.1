import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, UserCircle2 } from "lucide-react";
import { getToken, logout } from "../utils/auth";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = getToken();
  const currentUsername = localStorage.getItem("username") || "User";
  const currentRole = (localStorage.getItem("role") || "").trim().toUpperCase();
  const dashboardRoute =
    currentRole === "ADMIN"
      ? "/admin/dashboard"
      : currentRole === "USER"
        ? "/user/dashboard"
        : currentRole === "TECHNICIAN"
          ? "/technician/dashboard"
          : "/home";

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "Home", to: "/home" },
    { name: "Resources", to: "/resources" },
    { name: "Bookings", to: "/bookings" },
    { name: "Report An Issue", to: "/report-an-issue" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link to="/home" className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_4px_25px_rgba(16,185,129,0.6)] transition-all duration-300 group-hover:-translate-y-0.5">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
              Smart Campus{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500">
                Ops Hub
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.to === "#" ? (
                <a
                  key={link.name}
                  href={link.to}
                  className="text-slate-600 hover:text-emerald-600 font-semibold text-sm transition-colors duration-200"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-slate-600 hover:text-emerald-600 font-semibold text-sm transition-colors duration-200"
                >
                  {link.name}
                </Link>
              )
            )}

            <div className="h-6 w-px bg-slate-200"></div>

            {!token ? (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-2.5 text-sm font-semibold text-emerald-600 border border-emerald-500 rounded-full hover:bg-emerald-50 transition-all duration-300"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardRoute}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="Go to dashboard"
                >
                  <UserCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold max-w-28 truncate">{currentUsername}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-full shadow hover:bg-red-600 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-emerald-600 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-3xl border-b border-slate-100 shadow-2xl absolute w-full left-0 origin-top animate-in slide-in-from-top-2">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) =>
              link.to === "#" ? (
                <a
                  key={link.name}
                  href={link.to}
                  className="block px-4 py-3 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.to}
                  className="block px-4 py-3 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              )
            )}

            <div className="pt-4 border-t border-slate-100">
              {!token ? (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-3.5 text-base font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-3.5 text-base font-bold text-emerald-600 border border-emerald-500 rounded-xl hover:bg-emerald-50 transition-all"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to={dashboardRoute}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-center px-4 py-3 text-base font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all"
                  >
                    <UserCircle2 className="h-5 w-5" />
                    <span className="truncate">{currentUsername}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center px-4 py-3.5 text-base font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;