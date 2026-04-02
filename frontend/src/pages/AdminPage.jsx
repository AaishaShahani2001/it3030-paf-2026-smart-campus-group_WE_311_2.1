import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiSearch, FiFilter, FiLoader, FiInbox, FiShield } from "react-icons/fi";
// Resource API endpoints
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

async function createResource(data) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create resource");
  return res.json();
}

async function updateResource(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update resource");
  return res.json();
}

async function deleteResource(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete resource");
}

async function updateResourceStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}
import ResourceCard from "../components/ResourceCard";
import ResourceForm from "../components/ResourceForm";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const RESOURCE_TYPES = [
  { value: "", label: "All Types" },
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Lab" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const AdminPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", capacity: "", location: "" });

  // modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [deletingResource, setDeletingResource] = useState(null);

  /* ---------- fetch ---------- */
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

  /* ---------- actions ---------- */
  const handleCreate = async (data) => {
    try {
      await createResource(data);
      toast.success("Resource created!");
      setFormOpen(false);
      fetchResources();
    } catch (err) {
      toast.error(err.message || "Failed to create");
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateResource(editingResource.id, data);
      toast.success("Resource updated!");
      setEditingResource(null);
      setFormOpen(false);
      fetchResources();
    } catch (err) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteResource(id);
      toast.success("Resource deleted");
      setDeletingResource(null);
      fetchResources();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleToggleStatus = async (resource) => {
    const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    try {
      await updateResourceStatus(resource.id, newStatus);
      toast.success(`Status changed to ${newStatus === "ACTIVE" ? "Active" : "Out of Service"}`);
      fetchResources();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const openEditModal = (resource) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingResource(null);
  };

  /* ---------- filter handling ---------- */
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <FiShield className="text-primary text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text">Admin Panel</h1>
            <p className="text-sm text-text-light mt-0.5">
              Create, edit, and manage all campus resources.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingResource(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <FiPlus className="text-lg" />
          Add Resource
        </button>
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
              <option key={t.value} value={t.value}>{t.label}</option>
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
          <h3 className="text-lg font-semibold text-text mb-1">No resources found</h3>
          <p className="text-sm mb-4">
            {hasActiveFilters
              ? "Try adjusting your filters or add a new resource."
              : "Get started by adding your first campus resource."}
          </p>
          <button
            onClick={() => { setEditingResource(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <FiPlus />
            Add Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onEdit={openEditModal}
              onDelete={(res) => setDeletingResource(res)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ResourceForm
        isOpen={formOpen}
        onClose={closeFormModal}
        onSubmit={editingResource ? handleUpdate : handleCreate}
        initialData={editingResource}
      />

      <DeleteConfirmModal
        isOpen={!!deletingResource}
        resource={deletingResource}
        onConfirm={handleDelete}
        onCancel={() => setDeletingResource(null)}
      />
    </div>
  );
};

export default AdminPage;
