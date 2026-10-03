import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

/**
 * App.jsx — Root router
 *
 * Phase 0: Basic routing skeleton with a health-check visible page.
 * Later phases will add ProtectedRoute, role-aware redirects, and
 * all dashboard routes.
 *
 * Route structure (fully built out in Phase 1+):
 * /                     → redirect based on auth state
 * /login                → Login page (public)
 * /register             → Register page (public)
 * /verify/:token        → Public certificate verification (unauthenticated)
 * /owner/*              → Owner dashboard (protected, role: owner)
 * /officer/*            → Officer dashboard (protected, role: lmo|gatc)
 * /admin/*              → Admin dashboard (protected, role: admin)
 */

// Phase 0: Simple placeholder until Phase 1 auth pages are built
function HealthPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        {/* Logo mark */}
        <div className="w-16 h-16 bg-primary-600 rounded-card mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">V</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">VerifyChain</h1>
        <p className="text-text-secondary text-sm mb-6">
          Legal Metrology Instrument Verification System
        </p>

        <div className="bg-primary-50 rounded-lg p-4 text-left">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">
            Phase 0 — Setup Complete
          </p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>✅ React + Vite + Tailwind CSS running</li>
            <li>✅ Design tokens configured</li>
            <li>✅ PWA manifest configured</li>
            <li>⏳ Auth pages — Phase 1</li>
            <li>⏳ Dashboards — Phases 2–5</li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-text-secondary">
          SIH 2026 · Problem Statement SIH26036 · Team _Build2Solve
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Global toast notifications — position bottom-center for mobile friendliness */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* Phase 0: placeholder home */}
        <Route path="/" element={<HealthPage />} />

        {/* Phase 1+: authentication routes will go here */}
        {/* <Route path="/login" element={<Login />} /> */}
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Phase 4+: public certificate verification */}
        {/* <Route path="/verify/:token" element={<Verify />} /> */}

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
