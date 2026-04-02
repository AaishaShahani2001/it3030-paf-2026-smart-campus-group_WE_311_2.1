import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiSearch,
  FiFilter,
  FiLoader,
  FiInbox,
  FiMapPin,
  FiUsers,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
// Resource API endpoint
const API_BASE = "/api/resources";

async function getAllResources(filters) {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.capacity) params.append("capacity", filters.capacity);
  if (filters.location) params.append("location", filters.location);
  const res = await fetch(`${API_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

const RESOURCE_TYPES = [
  { value: "", label: "All Types" },
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Lab" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const TYPE_LABELS = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
  EQUIPMENT: "Equipment",
};

/* ── User-side card with expandable availability windows ── */
const UserResourceCard = ({ resource }) => {
  const isActive = resource.status === "ACTIVE";
  const windows = resource.availabilityWindows || [];
  const [expanded, setExpanded] = useState(false);

  const visibleWindows = expanded ? windows : windows.slice(0, 2);
  const hasMore = windows.length > 2;

  return (
    <div className="bg-surface rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-secondary/30">
      <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
      <div className="p-5">
        {/* Type badge + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/40 text-text">
            {TYPE_LABELS[resource.type] || resource.type}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                ? "bg-primary/15 text-primary-dark"
                : "bg-danger/10 text-danger"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-primary" : "bg-danger"
                }`}
            />
            {isActive ? "Active" : "Out of Service"}
          </span>
        </div>

        {/* Name */}
        <h3
          className="text-lg font-bold text-text mb-3 truncate"
          title={resource.name}
        >
          {resource.name}
        </h3>

        {/* Info rows */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-text-light">
            <FiMapPin className="shrink-0 text-primary" />
            <span className="truncate">{resource.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-light">
            <FiUsers className="shrink-0 text-primary" />
            <span>Capacity: {resource.capacity}</span>
          </div>
        </div>

        {/* Availability Windows */}
        {windows.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FiCalendar className="text-primary text-sm" />
              <span className="text-xs font-semibold text-text">
                Unavailable / Booked ({windows.length} slot
                {windows.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="space-y-1.5">
              {visibleWindows.map((w, i) => (
                <div
                  key={w.id || i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/15 text-xs text-text-light"
                >
                  <FiCalendar className="shrink-0 text-primary/70 text-[11px]" />
                  <span className="font-medium text-text">{w.date}</span>
                  <span className="text-text-light/50 mx-0.5">•</span>
                  <FiClock className="shrink-0 text-primary/70 text-[11px]" />
                  <span>
                    {w.startTime?.slice(0, 5)} – {w.endTime?.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                {expanded ? (
                  <>
                    <FiChevronUp className="text-sm" />
                    Show less
                  </>
                ) : (
                  <>
                    <FiChevronDown className="text-sm" />
                    +{windows.length - 2} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════ Main ResourceList Page ══════════════ */
const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    capacity: "",
    location: "",
  });

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllResources(filters);
      setResources(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: "", capacity: "", location: "" });
  };

  const hasActiveFilters = filters.type || filters.capacity || filters.location;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Campus Resources</h1>
        <p className="text-sm text-text-light mt-1">
          Browse available lecture halls, labs, meeting rooms &amp; equipment.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-surface rounded-2xl shadow-sm border border-secondary/30 p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-primary text-lg" />
          <span className="text-sm font-semibold text-text">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-secondary/50 bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Min capacity"
            value={filters.capacity}
            onChange={(e) => handleFilterChange("capacity", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-secondary/50 bg-white text-text text-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/50" />
            <input
              type="text"
              placeholder="Search location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-secondary/50 bg-white text-text text-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-light">
          <FiLoader className="text-4xl animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Loading resources…</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-light">
          <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
            <FiInbox className="text-3xl text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-1">
            No resources found
          </h3>
          <p className="text-sm">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "No campus resources have been added yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <UserResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceList;
