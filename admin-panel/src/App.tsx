import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { QueryProvider } from './components/providers/QueryProvider';
import { AIChatProvider } from './components/ai/chat/AIChatContext';
import { RouteProgress } from './lib/loaders';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/elements/Sonner';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import Test from './pages/Test';
// Admins
import AdminsPage from './pages/admins';
import AdminsCreatePage from './pages/admins/create';
import AdminsEditPage from './pages/admins/edit';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <RouteProgress />
        <AuthProvider>
          <AIChatProvider>
            <Routes>
              {/* Auth - صفحه ورود */}
              <Route path="/login" element={<AuthLayout />} />

              {/* Admin layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="test" element={<Test />} />
                
                {/* Admins Routes */}
                <Route path="admins">
                  <Route index element={<AdminsPage />} />
                  <Route path="create" element={<AdminsCreatePage />} />
                  <Route path=":id/edit" element={<AdminsEditPage />} />
                </Route>
              </Route>

              {/* Backward compatibility: /dashboard → / */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              closeButton
              duration={4000}
            />
          </AIChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
