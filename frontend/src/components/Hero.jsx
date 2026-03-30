import React from 'react';
import { CalendarCheck, AlertCircle, ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-32 pb-40">
      {/* Background Decorative Gradient Meshes */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-150 h-150 rounded-full bg-emerald-300/20 blur-[100px] opacity-80 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-40 left-0 -ml-32 w-125 h-125 rounded-full bg-teal-300/20 blur-[100px] opacity-80 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-0 right-1/4 w-100 h-100 rounded-full bg-green-300/20 blur-[100px] opacity-60 pointer-events-none mix-blend-multiply"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-emerald-100 shadow-sm backdrop-blur-md text-emerald-700 text-sm font-semibold mb-8 hover:bg-white hover:scale-105 transition-all cursor-default">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 relative">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            </span>
            System Online & Operations Active
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
            Manage Campus Operations <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-500 to-green-500 pb-2">
              Intelligently.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-xl text-slate-600 mx-auto mb-12 leading-relaxed">
            The all-in-one platform to track incidents, manage physical assets, and book facilities seamlessly. Build a safer and smarter university experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 rounded-full shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_35px_rgba(16,185,129,0.5)] hover:-translate-y-1 transition-all duration-300 group">
              <CalendarCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Book a Facility
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-700 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-700 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <AlertCircle className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
              Report an Issue
            </button>
          </div>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="mt-28 relative max-w-5xl mx-auto group">
          {/* Outer glow for 3D effect */}
          <div className="absolute inset-0 bg-linear-to-r from-emerald-400 to-teal-400 transform scale-[0.98] rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
          
          <div className="relative rounded-3xl border border-white/50 bg-white/40 backdrop-blur-2xl shadow-2xl overflow-hidden transform transition-all group-hover:scale-[1.02] duration-700">
            {/* Window Controls */}
            <div className="h-10 border-b border-white/40 bg-white/30 flex items-center px-6 gap-2 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400/90 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm"></div>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="h-36 rounded-2xl bg-white/70 border border-white shadow-sm flex flex-col justify-center items-center backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300">
                <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-600 mb-2">12</span>
                <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">Pending Approvals</span>
              </div>
              <div className="h-36 rounded-2xl bg-white/70 border border-white shadow-sm flex flex-col justify-center items-center backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300">
                <span className="text-4xl font-extrabold text-slate-800 mb-2">34</span>
                <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">Active Bookings</span>
              </div>
              <div className="h-36 rounded-2xl bg-white/70 border border-white shadow-sm flex flex-col justify-center items-center backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300">
                <span className="text-4xl font-extrabold text-slate-800 mb-2">5</span>
                <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">Open Tickets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
