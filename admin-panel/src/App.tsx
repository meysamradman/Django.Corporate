import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { TopLoader } from './components/layout/TopLoader';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Toaster } from './components/elements/Sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <TopLoader />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          closeButton
          duration={4000}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
