import { Toaster } from "@/components/ui/sonner";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import MyTeams from "./pages/MyTeams";
import MyTeamDetail from "./pages/MyTeamDetail";
import TeamSquare from "./pages/TeamSquare";
import JoinTeam from "./pages/JoinTeam";
import Profile from "./pages/Profile";
import About from "./pages/About";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-[var(--bg-deep-space)] text-[var(--text-muted)]">加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-[var(--bg-deep-space)] text-[var(--text-muted)]">加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <div className="flex flex-col h-screen bg-[var(--bg-deep-space)]">
      <Navbar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  </ProtectedRoute>
);

const AppRoutes = () => (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
      <Route path="/my-teams" element={<ProtectedLayout><MyTeams /></ProtectedLayout>} />
      <Route path="/my-teams/:id" element={<ProtectedLayout><MyTeamDetail /></ProtectedLayout>} />
      <Route path="/teams" element={<ProtectedLayout><TeamSquare /></ProtectedLayout>} />
      <Route path="/join-team" element={<ProtectedLayout><JoinTeam /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/about" element={<ProtectedLayout><About /></ProtectedLayout>} />
      <Route path="/admin/*" element={<ProtectedLayout><AdminRoute><AdminPage /></AdminRoute></ProtectedLayout>} />
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
