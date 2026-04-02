import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const DeleteConfirmModal = ({ isOpen, resource, onConfirm, onCancel }) => {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-secondary/30 overflow-hidden scale-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="text-xl text-danger" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">Delete Resource</h2>
              <p className="text-sm text-text-light mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-text mb-6">
            Are you sure you want to delete <span className="font-semibold">{resource.name}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text hover:bg-secondary/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(resource.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white hover:bg-red-600 shadow-md transition-colors"
            >
              Delete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
