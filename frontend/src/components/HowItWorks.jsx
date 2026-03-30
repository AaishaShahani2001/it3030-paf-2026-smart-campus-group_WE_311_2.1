import React from 'react';
import {
  FileText, CheckCircle, DoorOpen,
  MessageSquareWarning, Wrench, ThumbsUp,
  ArrowRight
} from 'lucide-react';

const WorkflowStep = ({ icon: Icon, title, desc, stepNum, isLast }) => (
  <div className="relative flex flex-col items-center text-center group">
    <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100 text-slate-400 flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(16,185,129,0.1)] group-hover:bg-linear-to-br group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-500 z-10 relative cursor-default">
      <Icon className="w-7 h-7" />
      <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center border-2 border-white group-hover:bg-slate-900 group-hover:text-emerald-400 group-hover:border-slate-800 transition-colors duration-500">
        {stepNum}
      </div>
    </div>
    <h4 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">{title}</h4>
    <p className="text-sm font-medium text-slate-500 max-w-50 leading-relaxed group-hover:text-slate-600">{desc}</p>

    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[60%] w-full border-t-[3px] border-dashed border-emerald-100/60 z-0 group-hover:border-emerald-300 transition-colors duration-500 delay-100"></div>
    )}
    {!isLast && (
      <ArrowRight className="md:hidden text-emerald-200 my-6 group-hover:text-emerald-500 transition-colors" />
    )}
  </div>
);

const HowItWorks = () => {
  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 p-32 md:-mr-64 opacity-[0.03] pointer-events-none">
         <svg width="404" height="404" fill="none" viewBox="0 0 404 404"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="404" fill="url(#dots)"></rect></svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-3">Process Pipeline</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">How It Works</h3>
          <p className="text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Our streamlined intelligent workflows make managing campus resources effortless.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8">
          {/* Workflow 1: Booking */}
          <div className="relative bg-slate-50 rounded-4xl p-8 sm:p-12 border border-slate-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-shadow duration-500 group isolation-auto">
            <div className="absolute inset-0 bg-linear-to-br from-white to-emerald-50/20 rounded-4xl -z-10"></div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-10 pb-6 border-b border-slate-200/60">
               <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                 <DoorOpen className="w-5 h-5"/>
               </span>
               Facility Booking
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-4">
              <WorkflowStep
                icon={FileText} title="Request"
                desc="Submit usage details for room or equipment."
                stepNum="1"
              />
              <WorkflowStep
                icon={CheckCircle} title="Approval"
                desc="Admin reviews and approves your request."
                stepNum="2"
              />
              <WorkflowStep
                icon={DoorOpen} title="Access"
                desc="Utilize your booked campus facility securely."
                stepNum="3" isLast
              />
            </div>
          </div>

          {/* Workflow 2: Ticketing */}
          <div className="relative bg-emerald-50/40 rounded-4xl p-8 sm:p-12 border border-emerald-100/50 hover:shadow-2xl hover:shadow-teal-500/10 transition-shadow duration-500 group isolation-auto">
            <div className="absolute inset-0 bg-linear-to-br from-white to-teal-50/20 rounded-4xl -z-10"></div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-10 pb-6 border-b border-emerald-200/50">
               <span className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                 <Wrench className="w-5 h-5"/>
               </span>
               Incident Reporting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-4">
              <WorkflowStep
                icon={MessageSquareWarning} title="Report"
                desc="Log an issue with precise location metadata."
                stepNum="1"
              />
              <WorkflowStep
                icon={Wrench} title="Assign"
                desc="Instantly routed to the maintenance team."
                stepNum="2"
              />
              <WorkflowStep
                icon={ThumbsUp} title="Resolve"
                desc="Issue is fixed, verified and ticket closed."
                stepNum="3" isLast
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
