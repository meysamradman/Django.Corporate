import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { QueryProvider } from './components/providers/QueryProvider';
import { PermissionProvider } from './components/admins/permissions';
import { AIChatProvider } from './components/ai/chat/AIChatContext';
import { RouteProgress } from './lib/loaders';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/elements/Sonner';
import { TooltipProvider } from './components/elements/Tooltip';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Dashboard
import Dashboard from './pages/Dashboard';

// Media
import MediaPage from './pages/media/page';

// Admins
import AdminsPage from './pages/admins/page';
import AdminsCreatePage from './pages/admins/create/page';
import AdminsEditPage from './pages/admins/[id]/edit/page';
import AdminsPermissionsPage from './pages/admins/permissions/page';

// Users
import UsersPage from './pages/users/page';
import UsersCreatePage from './pages/users/create/page';
import UsersEditPage from './pages/users/[id]/edit/page';

// Roles
import RolesPage from './pages/roles/page';
import RolesCreatePage from './pages/roles/create/page';
import RolesEditPage from './pages/roles/[id]/edit/page';
import RolesViewPage from './pages/roles/[id]/page';

// Portfolios
import PortfoliosPage from './pages/portfolios/page';
import PortfoliosCreatePage from './pages/portfolios/(list)/create/page';
import PortfoliosEditPage from './pages/portfolios/(list)/[id]/edit/page';
import PortfoliosViewPage from './pages/portfolios/(list)/[id]/view/page';

// Portfolio Categories
import PortfolioCategoriesPage from './pages/portfolios/categories/page';
import PortfolioCategoriesCreatePage from './pages/portfolios/categories/create/page';
import PortfolioCategoriesEditPage from './pages/portfolios/categories/[id]/edit/page';

// Portfolio Tags
import PortfolioTagsPage from './pages/portfolios/tags/page';
import PortfolioTagsCreatePage from './pages/portfolios/tags/create/page';
import PortfolioTagsEditPage from './pages/portfolios/tags/[id]/edit/page';

// Portfolio Options
import PortfolioOptionsPage from './pages/portfolios/options/page';
import PortfolioOptionsCreatePage from './pages/portfolios/options/create/page';
import PortfolioOptionsEditPage from './pages/portfolios/options/[id]/edit/page';
import PortfolioOptionsViewPage from './pages/portfolios/options/[id]/page';

// Blogs
import BlogsPage from './pages/blogs/page';
import BlogsCreatePage from './pages/blogs/(list)/create/page';
import BlogsEditPage from './pages/blogs/(list)/[id]/edit/page';
import BlogsViewPage from './pages/blogs/(list)/[id]/view/page';

// Blog Categories
import BlogCategoriesPage from './pages/blogs/categories/page';
import BlogCategoriesCreatePage from './pages/blogs/categories/create/page';
import BlogCategoriesEditPage from './pages/blogs/categories/[id]/edit/page';

// Blog Tags
import BlogTagsPage from './pages/blogs/tags/page';
import BlogTagsCreatePage from './pages/blogs/tags/create/page';
import BlogTagsEditPage from './pages/blogs/tags/[id]/edit/page';

// AI
import AIChatPage from './pages/ai/chat/page';
import AIImagePage from './pages/ai/image/page';
import AIAudioPage from './pages/ai/audio/page';
import AIContentPage from './pages/ai/content/page';
import AIModelsPage from './pages/ai/models/page';
import AISettingsPage from './pages/ai/settings/page';
import AIUnifiedPage from './pages/ai/ai-unified/page';

// Analytics
import AnalyticsPage from './pages/analytics/page';

// Settings
import SettingsPage from './pages/settings/page';

// Panel
import PanelPage from './pages/panel/page';

// Email
import EmailPage from './pages/email/page';

// Ticket
import TicketPage from './pages/ticket/page';

// Chatbot
import ChatbotPage from './pages/chatbot/page';

// Form Builder
import FormBuilderPage from './pages/form-builder/page';

// Pages (Static)
import PageAbout from './pages/page/about/page';
import PageTerms from './pages/page/terms/page';


function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <RouteProgress />
        <TooltipProvider>
          <AuthProvider>
            <PermissionProvider>
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
                  {/* Dashboard */}
                  <Route index element={<Dashboard />} />
                  
                  {/* Media */}
                  <Route path="media" element={<MediaPage />} />
                  
                  {/* Admins Routes */}
                  <Route path="admins">
                    <Route index element={<AdminsPage />} />
                    <Route path="create" element={<AdminsCreatePage />} />
                    <Route path=":id/edit" element={<AdminsEditPage />} />
                    <Route path="permissions" element={<AdminsPermissionsPage />} />
                  </Route>

                  {/* Users Routes */}
                  <Route path="users">
                    <Route index element={<UsersPage />} />
                    <Route path="create" element={<UsersCreatePage />} />
                    <Route path=":id/edit" element={<UsersEditPage />} />
                  </Route>

                  {/* Roles Routes */}
                  <Route path="roles">
                    <Route index element={<RolesPage />} />
                    <Route path="create" element={<RolesCreatePage />} />
                    <Route path=":id" element={<RolesViewPage />} />
                    <Route path=":id/edit" element={<RolesEditPage />} />
                  </Route>

                  {/* Portfolios Routes */}
                  <Route path="portfolios">
                    <Route index element={<PortfoliosPage />} />
                    <Route path="create" element={<PortfoliosCreatePage />} />
                    <Route path=":id/edit" element={<PortfoliosEditPage />} />
                    <Route path=":id/view" element={<PortfoliosViewPage />} />
                    
                    {/* Portfolio Categories */}
                    <Route path="categories">
                      <Route index element={<PortfolioCategoriesPage />} />
                      <Route path="create" element={<PortfolioCategoriesCreatePage />} />
                      <Route path=":id/edit" element={<PortfolioCategoriesEditPage />} />
                    </Route>

                    {/* Portfolio Tags */}
                    <Route path="tags">
                      <Route index element={<PortfolioTagsPage />} />
                      <Route path="create" element={<PortfolioTagsCreatePage />} />
                      <Route path=":id/edit" element={<PortfolioTagsEditPage />} />
                    </Route>

                    {/* Portfolio Options */}
                    <Route path="options">
                      <Route index element={<PortfolioOptionsPage />} />
                      <Route path="create" element={<PortfolioOptionsCreatePage />} />
                      <Route path=":id" element={<PortfolioOptionsViewPage />} />
                      <Route path=":id/edit" element={<PortfolioOptionsEditPage />} />
                    </Route>
                  </Route>

                  {/* Blogs Routes */}
                  <Route path="blogs">
                    <Route index element={<BlogsPage />} />
                    <Route path="create" element={<BlogsCreatePage />} />
                    <Route path=":id/edit" element={<BlogsEditPage />} />
                    <Route path=":id/view" element={<BlogsViewPage />} />
                    
                    {/* Blog Categories */}
                    <Route path="categories">
                      <Route index element={<BlogCategoriesPage />} />
                      <Route path="create" element={<BlogCategoriesCreatePage />} />
                      <Route path=":id/edit" element={<BlogCategoriesEditPage />} />
                    </Route>

                    {/* Blog Tags */}
                    <Route path="tags">
                      <Route index element={<BlogTagsPage />} />
                      <Route path="create" element={<BlogTagsCreatePage />} />
                      <Route path=":id/edit" element={<BlogTagsEditPage />} />
                    </Route>
                  </Route>

                  {/* AI Routes */}
                  <Route path="ai">
                    <Route path="chat" element={<AIChatPage />} />
                    <Route path="image" element={<AIImagePage />} />
                    <Route path="audio" element={<AIAudioPage />} />
                    <Route path="content" element={<AIContentPage />} />
                    <Route path="models" element={<AIModelsPage />} />
                    <Route path="settings" element={<AISettingsPage />} />
                    <Route path="ai-unified" element={<AIUnifiedPage />} />
                  </Route>

                  {/* Analytics */}
                  <Route path="analytics" element={<AnalyticsPage />} />

                  {/* Settings */}
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Panel */}
                  <Route path="panel" element={<PanelPage />} />

                  {/* Email */}
                  <Route path="email" element={<EmailPage />} />

                  {/* Ticket */}
                  <Route path="ticket" element={<TicketPage />} />

                  {/* Chatbot */}
                  <Route path="chatbot" element={<ChatbotPage />} />

                  {/* Form Builder */}
                  <Route path="form-builder" element={<FormBuilderPage />} />

                  {/* Static Pages */}
                  <Route path="page">
                    <Route path="about" element={<PageAbout />} />
                    <Route path="terms" element={<PageTerms />} />
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
            </PermissionProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
