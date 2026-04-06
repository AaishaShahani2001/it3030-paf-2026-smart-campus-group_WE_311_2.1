import React, { useState, useEffect } from "react";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";

const RESOURCE_TYPES = [
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Lab" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const RESOURCE_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "OUT_OF_SERVICE", label: "Out of Service" },
];

const EQUIPMENT_ITEMS = [
  { value: "Projector", label: "Projector" },
  { value: "Microphone", label: "Microphone" },
  { value: "Camera", label: "Camera" },
  { value: "Laptop", label: "Laptop" },
  { value: "Speaker", label: "Speaker" },
  { value: "Whiteboard", label: "Whiteboard" },
  { value: "Printer", label: "Printer" },
  { value: "Scanner", label: "Scanner" },
  { value: "Others", label: "Others (Custom)" },
];

const emptyWindow = { date: "", startTime: "08:00", endTime: "17:00" };

const emptyForm = {
  name: "",
  type: "LECTURE_HALL",
  equipmentType: "",
  customEquipment: "",
  capacity: "",
  location: "",
  status: "ACTIVE",
  availabilityWindows: [{ ...emptyWindow }],
};

const ResourceForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      const isPreset = EQUIPMENT_ITEMS.some(e => e.value === initialData.equipmentType && e.value !== "Others");
      const windows = initialData.availabilityWindows?.length > 0
        ? initialData.availabilityWindows.map(w => ({
          date: w.date || "",
          startTime: w.startTime?.slice(0, 5) || "08:00",
          endTime: w.endTime?.slice(0, 5) || "17:00",
        }))
        : [{ ...emptyWindow }];
      setForm({
        name: initialData.name || "",
        type: initialData.type || "LECTURE_HALL",
        equipmentType: isPreset ? initialData.equipmentType : (initialData.equipmentType ? "Others" : ""),
        customEquipment: isPreset ? "" : (initialData.equipmentType || ""),
        capacity: initialData.capacity ?? "",
        location: initialData.location || "",
        status: initialData.status || "ACTIVE",
        availabilityWindows: windows,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.type) e.type = "Type is required";
    if (form.type === "EQUIPMENT" && !form.equipmentType) e.equipmentType = "Select equipment item";
    if (form.type === "EQUIPMENT" && form.equipmentType === "Others" && !form.customEquipment.trim()) e.customEquipment = "Enter equipment name";
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = "Capacity must be ≥ 1";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.status) e.status = "Status is required";

    // Validate availability windows
    const windowErrors = [];
    form.availabilityWindows.forEach((w, i) => {
      const we = {};
      if (!w.date) we.date = "Date is required";
      if (!w.startTime) we.startTime = "Required";
      if (!w.endTime) we.endTime = "Required";
      if (w.startTime && w.endTime && w.startTime >= w.endTime) we.endTime = "Must be after start";
      if (Object.keys(we).length > 0) windowErrors[i] = we;
    });
    if (form.availabilityWindows.length === 0) e.windows = "At least one availability window is required";
    if (windowErrors.length > 0) e.windowErrors = windowErrors;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const resolvedEquipmentType = form.type === "EQUIPMENT"
      ? (form.equipmentType === "Others" ? form.customEquipment.trim() : form.equipmentType)
      : null;
    onSubmit({
      name: form.name,
      type: form.type,
      capacity: Number(form.capacity),
      location: form.location,
      status: form.status,
      equipmentType: resolvedEquipmentType,
      availabilityWindows: form.availabilityWindows.map(w => ({
        date: w.date,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "type" && value !== "EQUIPMENT") {
        updated.equipmentType = "";
        updated.customEquipment = "";
      }
      if (field === "equipmentType") {
        if (value !== "Others") {
          updated.customEquipment = "";
          if (value) updated.name = value;
        } else {
          updated.name = "";
        }
      }
      if (field === "customEquipment") {
        updated.name = value;
      }
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Availability window handlers ---
  const addWindow = () => {
    setForm(prev => ({
      ...prev,
      availabilityWindows: [...prev.availabilityWindows, { ...emptyWindow }],
    }));
  };

  const removeWindow = (index) => {
    setForm(prev => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index),
    }));
  };

  const updateWindow = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.map((w, i) =>
        i === index ? { ...w, [field]: value } : w
      ),
    }));
    // Clear specific window error
    if (errors.windowErrors?.[index]?.[field]) {
      setErrors(prev => {
        const we = [...(prev.windowErrors || [])];
        if (we[index]) {
          we[index] = { ...we[index], [field]: undefined };
        }
        return { ...prev, windowErrors: we };
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(45,58,30,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-base w-full max-w-lg rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary/40 sticky top-0 bg-base z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-text">
            {isEditing ? "Edit Resource" : "Add New Resource"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Room A-101"
              className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.name ? "border-danger" : "border-secondary/50"
                }`}
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.type ? "border-danger" : "border-secondary/50"
                  }`}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.status ? "border-danger" : "border-secondary/50"
                  }`}
              >
                {RESOURCE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment sub-selector */}
          {form.type === "EQUIPMENT" && (
            <div className="animate-slide-up">
              <label className="block text-sm font-semibold text-text mb-1">Equipment Item</label>
              <select
                value={form.equipmentType}
                onChange={(e) => handleChange("equipmentType", e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.equipmentType ? "border-danger" : "border-secondary/50"
                  }`}
              >
                <option value="">Select equipment…</option>
                {EQUIPMENT_ITEMS.map((eq) => (
                  <option key={eq.value} value={eq.value}>{eq.label}</option>
                ))}
              </select>
              {errors.equipmentType && <p className="text-danger text-xs mt-1">{errors.equipmentType}</p>}

              {form.equipmentType === "Others" && (
                <div className="mt-3 animate-slide-up">
                  <label className="block text-sm font-semibold text-text mb-1">Custom Equipment Name</label>
                  <input
                    type="text"
                    value={form.customEquipment}
                    onChange={(e) => handleChange("customEquipment", e.target.value)}
                    placeholder="e.g. 3D Printer, VR Headset"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.customEquipment ? "border-danger" : "border-secondary/50"
                      }`}
                  />
                  {errors.customEquipment && <p className="text-danger text-xs mt-1">{errors.customEquipment}</p>}
                </div>
              )}
            </div>
          )}

          {/* Capacity + Location row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                placeholder="e.g. 50"
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.capacity ? "border-danger" : "border-secondary/50"
                  }`}
              />
              {errors.capacity && <p className="text-danger text-xs mt-1">{errors.capacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Block A, Floor 1"
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.location ? "border-danger" : "border-secondary/50"
                  }`}
              />
              {errors.location && <p className="text-danger text-xs mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* ═══ Availability Windows Section ═══ */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-text">Unavailability / Booked Slots</label>
              <button
                type="button"
                onClick={addWindow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary-dark hover:bg-primary/25 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Add Slot
              </button>
            </div>
            {errors.windows && <p className="text-danger text-xs mb-2">{errors.windows}</p>}

            <div className="space-y-3">
              {form.availabilityWindows.map((w, index) => {
                const we = errors.windowErrors?.[index] || {};
                return (
                  <div
                    key={index}
                    className="relative bg-secondary/10 rounded-xl p-3 border border-secondary/30 animate-slide-up"
                  >
                    {/* Remove button (only if more than 1 window) */}
                    {form.availabilityWindows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWindow(index)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-danger/15 text-danger/60 hover:text-danger transition-colors cursor-pointer"
                        title="Remove window"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    )}

                    <div className="text-xs font-medium text-text-light mb-2">
                      Window {index + 1}
                    </div>

                    {/* Date */}
                    <div className="mb-2">
                      <input
                        type="date"
                        value={w.date}
                        onChange={(e) => updateWindow(index, "date", e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${we.date ? "border-danger" : "border-secondary/50"
                          }`}
                      />
                      {we.date && <p className="text-danger text-xs mt-0.5">{we.date}</p>}
                    </div>

                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-light mb-0.5">From</label>
                        <input
                          type="time"
                          value={w.startTime}
                          onChange={(e) => updateWindow(index, "startTime", e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${we.startTime ? "border-danger" : "border-secondary/50"
                            }`}
                        />
                        {we.startTime && <p className="text-danger text-xs mt-0.5">{we.startTime}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-0.5">To</label>
                        <input
                          type="time"
                          value={w.endTime}
                          onChange={(e) => updateWindow(index, "endTime", e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${we.endTime ? "border-danger" : "border-secondary/50"
                            }`}
                        />
                        {we.endTime && <p className="text-danger text-xs mt-0.5">{we.endTime}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-light hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              {isEditing ? "Update Resource" : "Create Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;
