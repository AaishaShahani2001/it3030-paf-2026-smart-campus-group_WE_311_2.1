import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-16 bg-slate-50 relative overflow-hidden">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl shadow-emerald-900/40 isolate">
          {/* Abstract Deep Emerald Background Meshes */}
          <div className="absolute top-0 right-0 w-100 h-100 bg-emerald-500/20 rounded-full blur-[80px] -mr-32 -mt-32 mix-blend-screen -z-10"></div>
          <div className="absolute bottom-0 left-0 w-100 h-100 bg-teal-500/20 rounded-full blur-[80px] -ml-32 -mb-32 mix-blend-screen -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-slate-800/50 rounded-full blur-[100px] mix-blend-color-dodge -z-10 animate-pulse"></div>

          <div className="relative border border-slate-700/50 rounded-[2.5rem] px-6 py-12 md:px-12 md:py-16 text-center flex flex-col items-center bg-linear-to-b from-transparent to-slate-900/80 backdrop-blur-xl">
            <div className="bg-emerald-500/10 p-3 rounded-2xl backdrop-blur-md mb-6 inline-block text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Transform your campus <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">operations today.</span>
            </h2>

            <p className="text-slate-300 text-base md:text-lg font-medium mb-10 max-w-xl text-center leading-relaxed">
              Join leading institutions who are already leveraging intelligent data routing and dynamic bookings to create a safer environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm">
              <button className="flex-1 py-3 px-6 rounded-full bg-white text-emerald-900 font-extrabold text-base hover:bg-slate-50 shadow-[0_4px_25px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_35px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:-translate-y-1">
                Get Started
              </button>
              <button className="flex-1 py-3 px-6 rounded-full bg-slate-800/50 border border-slate-600/50 text-white font-extrabold text-base hover:bg-slate-700/50 hover:border-slate-500 hover:text-emerald-300 transition-all duration-300 flex items-center justify-center gap-2 group">
                Explore Features
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
