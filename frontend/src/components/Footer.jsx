import React from 'react';
import { LayoutDashboard, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 pt-20 pb-10 relative overflow-hidden">
      {/* Decorative top pulse line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="inline-flex items-center gap-3 mb-6 group cursor-pointer">
              <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Smart Campus <span className="text-emerald-400">Ops</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-8">
              Empowering institutions with intelligent tools to seamlessly manage facilities, automate bookings, and accelerate incident resolution.
            </p>

            {/* Social Icons with inline SVGs to fix Lucide brand removal */}
            <div className="flex space-x-5">
              <a href="#" className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
              <a href="#" className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </a>
              <a href="#" className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Facility Bookings</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Incident Management</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Admin Dashboard</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Contact Support</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all"></span>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm font-medium text-center md:text-left">
            &copy; {currentYear} Smart Campus Ops Hub. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-emerald-400/90 text-sm font-bold flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
               <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span> 
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
