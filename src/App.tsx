import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SUPABASE_CONFIG_ERROR } from "./lib/supabase";
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ContactPage from "./pages/ContactPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:slug" element={<ProjectDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  if (SUPABASE_CONFIG_ERROR) {
    return (
      <div className="min-h-screen bg-gray-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-red-950/30 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-red-300">Configuration Error</p>
          <h1 className="mt-4 text-3xl font-bold">Supabase environment variables are missing</h1>
          <p className="mt-4 text-lg text-gray-200">
            Set <code>VITE_SUPABASE_URL</code> and either <code>VITE_SUPABASE_ANON_KEY</code>
            {" "}or <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code> in the
            deployment environment, then redeploy.
          </p>
          <p className="mt-3 text-sm text-gray-300">{SUPABASE_CONFIG_ERROR}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
