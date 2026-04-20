import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiLoader,
  FiInbox,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { getToken } from "../utils/auth";

const RESOURCES_API = "/api/resources";

async function fetchResourcesList() {
  const res = await fetch(RESOURCES_API);
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

const TYPE_LABELS = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
  EQUIPMENT: "Equipment",
};

const ResourceCard = ({ resource, onBookClick }) => {
  const isActive = resource.status === "ACTIVE";
  const windows = resource.availabilityWindows || [];

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border border-slate-100 flex flex-col">
      <div className="h-1.5 bg-linear-to-r from-emerald-500 to-teal-500" />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            {TYPE_LABELS[resource.type] || resource.type}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
            {isActive ? "Available" : "Unavailable"}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2" title={resource.name}>
          {resource.name}
        </h3>

        <div className="space-y-1.5 mb-4 text-sm text-slate-600 flex-1">
          <div className="flex items-center gap-2">
            <FiMapPin className="shrink-0 text-emerald-600" />
            <span className="truncate">{resource.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="shrink-0 text-emerald-600" />
            <span>Capacity {resource.capacity}</span>
          </div>
          {windows.length > 0 && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                <FiCalendar className="text-emerald-600" />
                Booked slots ({windows.length})
              </div>
              <ul className="text-xs text-slate-500 space-y-1 max-h-20 overflow-y-auto">
                {windows.slice(0, 3).map((w, i) => (
                  <li key={w.id || i} className="flex items-center gap-1.5">
                    <FiClock className="shrink-0 opacity-70" />
                    <span>
                      {w.date} · {w.startTime?.slice(0, 5)} – {w.endTime?.slice(0, 5)}
                    </span>
                  </li>
                ))}
                {windows.length > 3 && (
                  <li className="text-emerald-600 font-medium">+{windows.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!isActive}
          onClick={() => onBookClick(resource)}
          className="w-full mt-auto py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Book now
        </button>
      </div>
    </div>
  );
};

const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchResourcesList();
      setResources(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBookClick = (resource) => {
    if (!getToken()) {
      toast.info("Please log in to book a resource.");
      navigate("/login");
      return;
    }
    navigate("/user/dashboard", {
      state: { bookResourceId: resource.id, bookResourceName: resource.name },
    });
  };

  return (
    <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resources</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse campus spaces and equipment. Use Book now when you are ready to continue.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <FiLoader className="text-4xl animate-spin mb-3 text-emerald-600" />
            <p className="text-sm font-medium">Loading resources…</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <FiInbox className="text-3xl text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No resources found</h3>
            <p className="text-sm text-center">No assets have been published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} onBookClick={handleBookClick} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Resources;
