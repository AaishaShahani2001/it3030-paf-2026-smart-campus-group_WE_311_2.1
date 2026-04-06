import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Facilities', href: '/facilities' },
    { name: 'Bookings', href: '#' },
    { name: 'Report An Issue', href: '/report-an-issue' },
    { name: 'Admin', href: '/admin/facilities' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_4px_25px_rgba(16,185,129,0.6)] transition-all duration-300 group-hover:-translate-y-0.5">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
              Smart Campus <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500">Ops Hub</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-slate-600 hover:text-emerald-600 font-semibold text-sm transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
            <div className="h-6 w-px bg-slate-200"></div>
            <a
              href="#login"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Login
            </a>
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
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block px-4 py-3 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-100">
              <a
                href="#login"
                className="block w-full text-center px-4 py-3.5 text-base font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
