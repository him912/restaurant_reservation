import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Edit2, Save } from "lucide-react";
import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

const ProfileModal = ({ onClose }) => {
  const [user, setUser] = useState({});
  const [editMode, setEditMode] = useState(false);
  const { closeProfileModal, isProfileModalOpen } = useApp();

  console.log(`====<>${isProfileModalOpen}`);

  if (!isProfileModalOpen) return null;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("dineflow_token");

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("dineflow_token");

      await axios.put(`${API_URL}/users/`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEditMode(false);
      alert("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 relative"
        onClick={closeProfileModal}
      >
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={20} />
        </button>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">My Profile</h2>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 text-indigo-600"
            >
              <Edit2 size={16} />
              Edit
            </button>
          ) : (
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 text-green-600"
            >
              <Save size={16} />
              Save
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>

            <input
              value={user.username || ""}
              disabled={!editMode}
              onChange={(e) =>
                setUser({
                  ...user,
                  username: e.target.value,
                })
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>

            <input
              value={user.email || ""}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>

            <input
              value={user.phone || ""}
              disabled={!editMode}
              onChange={(e) =>
                setUser({
                  ...user,
                  phone: e.target.value,
                })
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>

            <input
              value={user.role || ""}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
