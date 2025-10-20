import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import RegistrasiSantri from "./pages/RegistrasiSantri";
import Absensi from "./pages/Absensi";
import ListIzin from "./pages/ListIzin";
import Rekap from "./pages/Rekap";
import DashboardSantri from "./pages/DashboardSantri";
import RegisterSantri from "./pages/RegisterSantri";
import RegisterWajah from "./pages/RegisterWajah";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path="/registrasi" element={<ProtectedRoute><RegistrasiSantri/></ProtectedRoute>} />
        <Route path="/register" element={<RegisterSantri />} />
        <Route path="/absensi" element={<ProtectedRoute><Absensi/></ProtectedRoute>} />
        <Route path="/izin" element={<ProtectedRoute><ListIzin/></ProtectedRoute>} />
        <Route path="/rekap" element={<ProtectedRoute><Rekap/></ProtectedRoute>} />
        <Route path="/register-wajah" element={<ProtectedRoute><RegisterWajah /></ProtectedRoute>}/>
        <Route path="/dashboard-santri" element={<ProtectedRoute><DashboardSantri /></ProtectedRoute>}/>
      </Routes>
    </Router>
  );
}
