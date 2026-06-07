import { useEffect, useState } from "react";
import { getAuthApi } from "../utils/api";
import { getToken } from "../utils/auth";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getAuthApi().get("/auth/users");
        setProfile(response.data.data);
      } catch (err) {
        setMessage("Unable to fetch profile. Please login.");
      }
    };

    if (getToken()) {
      fetchProfile();
    } else {
      setMessage("Please login to view your profile.");
    }
  }, []);

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <h2>My Profile</h2>
        {message && <p className="error-message">{message}</p>}
        {profile && (
          <div className="profile-details">
            <p><strong>Name:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Favorite cuisines:</strong> {profile.favoriteCuisines?.join(", ") || "None"}</p>
            <p><strong>Dietary preferences:</strong> {profile.dietaryPreferences?.join(", ") || "None"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
