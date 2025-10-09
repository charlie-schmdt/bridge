import { useState } from "react";
import { Input, Switch, Button, Textarea } from "@heroui/react";
import { PlusCircle, Lock, X } from "lucide-react";
import NotificationBanner from "./NotificationBanner";

// ============================
// Custom Modal Component
// ============================
const CustomModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // prevent accidental close
      >
        {children}
      </div>
    </div>
  );
};

// Modal Header
const ModalHeader = ({ title, onClose }) => (
  <div className="flex justify-between items-center p-4 border-b border-gray-200">
    <h3 id="modal-title" className="text-xl font-bold text-gray-900">
      {title}
    </h3>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100"
      aria-label="Close modal"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

// Modal Body
const ModalBody = ({ children }) => (
  <div className="p-6 space-y-6">{children}</div>
);

// Modal Footer
const ModalFooter = ({ children }) => (
  <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
    {children}
  </div>
);

// ============================
// Main Component
// ============================
export default function CreateWorkspaceCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: true,
  });
  const [error, setError] = useState("");
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Fix for the Switch toggle (HeroUI uses `onValueChange`)
  const handleTogglePrivate = (checked) => {
    setFormData((prev) => ({ ...prev, isPrivate: checked }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Workspace name is required.");
      console.error("Submission blocked: Workspace name required");
      return;
    }

    try {
      const userData = localStorage.getItem('bridge_user');
      if (!userData) {
        console.error('No user data found');
        return;
      }
      const user = JSON.parse(userData);
      console.log('User data:', user); // Added logging to verify user data
      if (!user.id) {
        console.error('No user ID found in stored data');
        return;
      }

      const response = await fetch('http://localhost:3000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isPrivate: formData.isPrivate,
          ownerId: user.id  // Changed from 'id' to 'ownerId' to match controller
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create workspace');
      }

      console.log("✅ Workspace Created:", data);
      handleClose();

      // Reset form after successful submission
      setFormData({ name: "", description: "", isPrivate: true });
      setError("");

      // Show success banner
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
      console.error('Error creating workspace:', err);
    }
  };

  return (
    <>
      {/* Create Workspace Card */}
      <div
        onClick={handleOpen}
        className="group border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white 
          rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer 
          p-6 sm:p-8 w-full flex flex-col items-center text-center space-y-3"
        role="button"
        tabIndex={0}
      >
        <PlusCircle className="w-10 h-10 text-blue-500 group-hover:text-blue-600 transition duration-200" />
        <p className="text-lg font-semibold text-gray-800">Create New Workspace</p>
        <p className="text-sm text-gray-500">Start organizing your projects and teams here.</p>
        <button onClick={handleOpen} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer">
          Get Started
        </button>
      </div>

      {/* Modal */}
      <CustomModal isOpen={isModalOpen} onClose={handleClose}>
        <ModalHeader title="🚀 Create a New Workspace" onClose={handleClose} />
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Textarea
              label="Workspace Name"
              placeholder="e.g., Q4 Marketing Campaign"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              rows={1}
              className="p-3"
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <Textarea
            label="Description (Optional)"
            placeholder="What’s the primary goal for this workspace?"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="p-3"
          />
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 font-medium">Private Workspace</span>
            </div>
            <Switch
              size="md"
              isSelected={formData.isPrivate}
              onValueChange={handleTogglePrivate}
            />
          </div>

          <p className="text-xs text-gray-500 ml-1">
            {formData.isPrivate
              ? "Only invited members can view this workspace."
              : "This workspace will be visible and joinable by everyone in your organization."}
          </p>
        </ModalBody>
        <ModalFooter>
          <button className="mt-2 text-black bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer"
            disabled={!formData.name.trim()}
            onClick={handleSubmit}
          >
            Save Workspace
          </button>
        </ModalFooter>
      </CustomModal>

      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-[9999]">
          <NotificationBanner message="Workspace created successfully! 🎉" type="created" />
        </div>
      )}
    </>
  );
}
