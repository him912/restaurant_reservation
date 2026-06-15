import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Edit2, Save, User } from "lucide-react";
import { useApp } from "../context/AppContext";

const ProfileModal = () => {
  const {
    profile,
    fetchProfile,
    updateUserProfile,
    isProfileModalOpen,
    closeProfileModal,
    showToast,
  } = useApp();

  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isProfileModalOpen) {
      fetchProfile().catch(() => {});
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || "",
        fullName: profile.fullName || profile.name || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || profile.phone || "",
        profileImage: profile.profileImage || "",
        favoriteCuisines: Array.isArray(profile.favoriteCuisines)
          ? profile.favoriteCuisines.join(", ")
          : (profile.favoriteCuisines || []).join && profile.favoriteCuisines.join(", ") || "",
        dietaryPreferences: Array.isArray(profile.dietaryPreferences)
          ? profile.dietaryPreferences.join(", ")
          : (profile.dietaryPreferences || []).join && profile.dietaryPreferences.join(", ") || "",
        type: profile.type || "user",
      });
    }
  }, [profile]);

  if (!isProfileModalOpen) return null;

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Only update these fields per API contract
      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        profileImage: form.profileImage,
        favoriteCuisines: form.favoriteCuisines
          ? form.favoriteCuisines.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        dietaryPreferences: form.dietaryPreferences
          ? form.dietaryPreferences.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const updated = await updateUserProfile(payload);
      if (!updated) {
        showToast("No response from server when updating profile.", "error");
        setIsSubmitting(false);
        return;
      }

      const favs = Array.isArray(updated?.favoriteCuisines)
        ? updated.favoriteCuisines
        : form.favoriteCuisines
        ? form.favoriteCuisines.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const diets = Array.isArray(updated?.dietaryPreferences)
        ? updated.dietaryPreferences
        : form.dietaryPreferences
        ? form.dietaryPreferences.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      setForm((f) => ({
        ...f,
        favoriteCuisines: favs.join(", "),
        dietaryPreferences: diets.join(", "),
      }));
      setEditMode(false);
      showToast("Profile saved.", "success");
    } catch (err) {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        onClick={closeProfileModal}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 12 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
          className="relative max-w-lg w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pb-4 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">My Profile</h3>
                <p className="text-[11px] text-slate-400">Manage your account details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 text-indigo-400 font-bold text-xs"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-emerald-400 font-bold text-xs"
                >
                  <Save size={14} />
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              )}

              <button
                onClick={closeProfileModal}
                className="p-1.5 text-slate-300 hover:text-slate-100 rounded-full"
                aria-label="Close profile"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
                <input
                  value={form.username || ""}
                  onChange={(e) => handleChange("username", e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border ${editMode ? "border-slate-700" : "border-slate-800 text-slate-400"}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  value={form.fullName || ""}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  disabled={!editMode}
                  className="w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                <input
                  value={form.email || ""}
                  disabled
                  className="w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border border-slate-800 text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  value={form.phoneNumber || ""}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  disabled={!editMode}
                  className="w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Favorite Cuisines</label>
                <input
                  value={form.favoriteCuisines || ""}
                  onChange={(e) => handleChange("favoriteCuisines", e.target.value)}
                  disabled={!editMode}
                  placeholder="Comma separated, e.g. Indian, Italian"
                  className="w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dietary Preferences</label>
                <input
                  value={form.dietaryPreferences || ""}
                  onChange={(e) => handleChange("dietaryPreferences", e.target.value)}
                  disabled={!editMode}
                  placeholder="Comma separated, e.g. Vegetarian"
                  className="w-full rounded-xl py-2.5 px-3 text-sm bg-slate-900 border border-slate-800"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileModal;
