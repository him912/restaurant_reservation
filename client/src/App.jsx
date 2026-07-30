/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Toast } from "./components/Toast";
import { AuthModal } from "./components/AuthModal";
import { Home } from "./pages/Home";
import { RestaurantDetails } from "./pages/RestaurantDetails";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { AdminPanel } from "./pages/AdminPanel";
import ProfileModal from "./components/ProfileModel";

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div
          className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950"
          id="app-root-container"
        >
          {/* Main Navigation */}
          <Navbar />

          {/* Main Workspace Layout */}
          <div className="flex-1" id="main-content-canvas">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/restaurant/:id" element={<RestaurantDetails />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/owner-dashboard" element={<OwnerDashboard />} />
              <Route path="/admin-panel" element={<AdminPanel />} />
            </Routes>
          </div>

          {/* Global Toast Alert Layer */}
          <Toast />

          {/* Interactive Authentication Portal Modals */}
          <AuthModal />
          <ProfileModal />
        </div>
      </Router>
    </AppProvider>
  );
}
