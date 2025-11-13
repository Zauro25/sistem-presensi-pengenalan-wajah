import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiClient } from "../services/apiClient";

export default function Profile() {
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [santriData, setSantriData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    fetchProfileData(storedUser);
  }, [navigate]);

  const fetchProfileData = async (userData) => {
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      
      console.log("User data:", userData);
      
      // Fetch santri data
      if (userData.role === "santri") {
        try {
          console.log("Fetching santri list...");
          const response = await apiClient.santri.list();
          console.log("Full API response:", response);
          console.log("Response data:", response.data);
          
          // The API might return data in different structures
          let santriList = [];
          if (response.data.results) {
            santriList = response.data.results;
          } else if (response.data.data) {
            santriList = response.data.data;
          } else if (Array.isArray(response.data)) {
            santriList = response.data;
          }
          
          console.log("Santri list:", santriList);
          console.log("Looking for santri_id:", userData.santri_id);
          
          // Try to find by santri_id first, then by username
          let santri = santriList.find((s) => s.id === userData.santri_id);
          if (!santri) {
            santri = santriList.find((s) => s.username === userData.username);
          }
          
          console.log("Found santri data:", santri);
          
          if (santri) {
            setSantriData(santri);
          } else {
            console.warn("No santri data found for this user");
          }
        } catch (santriErr) {
          console.error("Error fetching santri data:", santriErr);
          setError("Gagal memuat data santri. Silakan refresh halaman.");
        }
      }
      
      setFormData({
        username: userData.username || "",
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setError("");
      // Here you would typically make an API call to update the profile
      // For now, we'll just update localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      alert("Profil berhasil diperbarui!");
    } catch (err) {
      setError("Gagal memperbarui profil");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Memuat profil...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role={user?.role || "santri"}
      />

      <div className="md:ml-64 p-4 md:p-8">
        <div className={`max-w-4xl mx-auto rounded-2xl shadow-xl p-6 md:p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              Profile
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Profile Content */}
          <div className="space-y-6">
            {/* User Avatar/Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
                  {user?.username || "-"}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Lengkap
                </label>
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
                  {santriData?.nama || user?.nama_lengkap || "-"}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sektor
                </label>
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
                  {santriData?.sektor ? santriData.sektor.charAt(0).toUpperCase() + santriData.sektor.slice(1) : user?.sektor ? user.sektor.charAt(0).toUpperCase() + user.sektor.slice(1) : "-"}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Angkatan
                </label>
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
                  {santriData?.angkatan || user?.angkatan || "-"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: user?.username || "",
                    });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
