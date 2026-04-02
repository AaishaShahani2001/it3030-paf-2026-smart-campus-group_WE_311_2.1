import React, { useState } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiMapPin,
  FiUsers,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const TYPE_LABELS = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
  EQUIPMENT: "Equipment",
};

const ResourceCard = ({ resource, onEdit, onDelete, onToggleStatus }) => {
  const isActive = resource.status === "ACTIVE";
  const windows = resource.availabilityWindows || [];
  const [expanded, setExpanded] = useState(false);

  // Show first 2 windows by default, rest on expand
  const visibleWindows = expanded ? windows : windows.slice(0, 2);
  const hasMore = windows.length > 2;

  return (
    <div className="group bg-surface rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-secondary/30">
      {/* Header strip */}
      <div className="h-2 bg-gradient-to-r from-primary to-secondary" />

      <div className="p-5">
        {/* Top row: type badge + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/40 text-text">
            {TYPE_LABELS[resource.type] || resource.type}
          </span>
          {resource.type === "EQUIPMENT" && resource.equipmentType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary-dark ml-1">
              {resource.equipmentType}
            </span>
          )}

          <button
            onClick={() => onToggleStatus(resource)}
            title={isActive ? "Set Out of Service" : "Set Active"}
            className="flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
          >
            {isActive ? (
              <>
                <FiToggleRight className="text-primary text-xl" />
                <span className="text-xs font-semibold text-primary">Active</span>
              </>
            ) : (
              <>
                <FiToggleLeft className="text-danger text-xl" />
                <span className="text-xs font-semibold text-danger">Out of Service</span>
              </>
            )}
          </button>
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-text mb-3 truncate" title={resource.name}>
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
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <FiCalendar className="text-primary text-sm" />
              <span className="text-xs font-semibold text-text">
                Unavailable / Booked ({windows.length} slot{windows.length !== 1 ? "s" : ""})
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
                  <span>{w.startTime?.slice(0, 5)} – {w.endTime?.slice(0, 5)}</span>
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-secondary/30">
          <button
            onClick={() => onEdit(resource)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/15 text-primary-dark hover:bg-primary/30 transition-colors duration-200 cursor-pointer"
          >
            <FiEdit2 className="text-sm" />
            Edit
          </button>
          <button
            onClick={() => onDelete(resource)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors duration-200 cursor-pointer"
          >
            <FiTrash2 className="text-sm" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
