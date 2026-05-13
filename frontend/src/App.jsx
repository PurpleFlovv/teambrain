import { Toaster } from "@/components/ui/sonner";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    </Routes>
  </HashRouter>
);

const App = () => (
  <AuthProvider>
    <Toaster />
    <AppRoutes />
  </AuthProvider>
);

export default App;
