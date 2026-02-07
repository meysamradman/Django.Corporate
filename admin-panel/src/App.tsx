import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { QueryProvider } from './components/providers/QueryProvider';
import { PermissionProvider } from './core/permissions';
import { AIChatProvider } from './components/ai/chat/AIChatContext';
import { RouteProgress } from './lib/loaders';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TooltipProvider } from './components/elements/Tooltip';
import { Toaster } from './components/elements/Sonner';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import MediaPage from './pages/media/page';
import AdminsPage from './pages/admins/page';
import AgentsPage from './pages/agents/page';
import AdminsCreatePage from './pages/admins/create/page';
import AdminsEditPage from './pages/admins/[id]/edit/page';
import AdminsViewPage from './pages/admins/[id]/view/page';
import AdminsPermissionsPage from './pages/admins/permissions/page';
import AdminsMePage from './pages/admins/me/edit/page';
import AgentsEditPage from './pages/agents/[id]/edit/page';
import AgentsMePage from './pages/agents/me/edit/page';
import AdminsAgenciesPage from './pages/admins/agencies/page';
import AdminsAgenciesCreatePage from './pages/admins/agencies/create/page';
import AdminsAgenciesViewPage from './pages/admins/agencies/[id]/view/page';
import AdminsAgenciesEditPage from './pages/admins/agencies/[id]/edit/page';
import UsersPage from './pages/users/page';
import UsersCreatePage from './pages/users/create/page';
import UsersEditPage from './pages/users/[id]/edit/page';
import RolesPage from './pages/roles/page';
import RolesCreatePage from './pages/roles/create/page';
import RolesEditPage from './pages/roles/[id]/edit/page';
import RolesViewPage from './pages/roles/[id]/page';
import PortfoliosPage from './pages/portfolios/page';
import PortfoliosCreatePage from './pages/portfolios/(list)/create/page';
import PortfoliosEditPage from './pages/portfolios/(list)/[id]/edit/page';
import PortfoliosViewPage from './pages/portfolios/(list)/[id]/view/page';
import PortfolioCategoriesPage from './pages/portfolios/categories/page';
import PortfolioTagsPage from './pages/portfolios/tags/page';
import PortfolioOptionsPage from './pages/portfolios/options/page';
import BlogsPage from './pages/blogs/page';
import BlogsCreatePage from './pages/blogs/(list)/create/page';
import BlogsEditPage from './pages/blogs/(list)/[id]/edit/page';
import BlogsViewPage from './pages/blogs/(list)/[id]/view/page';
import BlogCategoriesPage from './pages/blogs/categories/page';
import BlogTagsPage from './pages/blogs/tags/page';
import BlogPrintPage from './pages/blogs/print/page';
import PortfolioPrintPage from './pages/portfolios/print/page';
import PropertyPrintPage from './pages/real-estate/print/page';
import AIChatPage from './pages/ai/chat/page';
import AIImagePage from './pages/ai/image/page';
import AIAudioPage from './pages/ai/audio/page';
import AIContentPage from './pages/ai/content/page';
import AIModelsPage from './pages/ai/models/page';
import AISettingsPage from './pages/ai/settings/page';
import AIUnifiedPage from './pages/ai/ai-unified/page';
import AnalyticsPage from './pages/analytics/page';
import SettingsPage from './pages/settings/page';
import PanelPage from './pages/panel/page';
import EmailPage from './pages/email/page';
import TicketPage from './pages/ticket/page';
import ChatbotPage from './pages/chatbot/page';
import FormBuilderPage from './pages/form-builder/page';
import PageAbout from './pages/page/about/page';
import PageTerms from './pages/page/terms/page';
import PropertiesPage from './pages/real-estate/properties/page';
import PropertiesCreatePage from './pages/real-estate/properties/create/page';
import PropertiesEditPage from './pages/real-estate/properties/[id]/edit/page';
import PropertiesViewPage from './pages/real-estate/properties/[id]/view/page';
import PropertyTypesPage from './pages/real-estate/types/page';
import PropertyStatesPage from './pages/real-estate/states/page';
import PropertyLabelsPage from './pages/real-estate/labels/page';
import PropertyFeaturesPage from './pages/real-estate/features/page';
import PropertyTagsPage from './pages/real-estate/tags/page';
import RealEstateStatisticsPage from './pages/real-estate/statistics/page';

function AgentRedirectView() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/agents/${id}/edit`} replace />;
}

function AgentRedirectEdit() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/agents/${id}/edit`} replace />;
}

function AgentViewRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/agents/${id}/edit`} replace />;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <RouteProgress />
        <Toaster />
        <TooltipProvider>
          <AuthProvider>
            <PermissionProvider>
              <AIChatProvider>
                <Routes>
                  <Route path="/login" element={<AuthLayout />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="media" element={<MediaPage />} />
                    <Route path="admins">
                      <Route index element={<AdminsPage />} />
                      <Route path="create" element={<AdminsCreatePage />} />
                      <Route path="agencies">
                        <Route index element={<AdminsAgenciesPage />} />
                        <Route path="create" element={<AdminsAgenciesCreatePage />} />
                        <Route path=":id/view" element={<AdminsAgenciesViewPage />} />
                        <Route path=":id/edit" element={<AdminsAgenciesEditPage />} />
                      </Route>
                      <Route path="me/edit" element={<AdminsMePage />} />
                      <Route path=":id/view" element={<AdminsViewPage />} />
                      <Route path=":id/edit" element={<AdminsEditPage />} />
                      <Route path="permissions" element={<AdminsPermissionsPage />} />
                      <Route path="agents" element={<Navigate to="/agents" replace />} />
                      <Route path="agents/:id/view" element={<AgentRedirectView />} />
                      <Route path="agents/:id/edit" element={<AgentRedirectEdit />} />
                      <Route path="me-consultant/edit" element={<Navigate to="/agents/me/edit" replace />} />
                    </Route>
                    <Route path="agents">
                      <Route index element={<AgentsPage />} />
                      <Route path="me/edit" element={<AgentsMePage />} />
                      <Route path=":id/view" element={<AgentViewRedirect />} />
                      <Route path=":id/edit" element={<AgentsEditPage />} />
                    </Route>
                    <Route path="users">
                      <Route index element={<UsersPage />} />
                      <Route path="create" element={<UsersCreatePage />} />
                      <Route path=":id/edit" element={<UsersEditPage />} />
                    </Route>
                    <Route path="roles">
                      <Route index element={<RolesPage />} />
                      <Route path="create" element={<RolesCreatePage />} />
                      <Route path=":id" element={<RolesViewPage />} />
                      <Route path=":id/edit" element={<RolesEditPage />} />
                    </Route>
                    <Route path="portfolios">
                      <Route index element={<PortfoliosPage />} />
                      <Route path="create" element={<PortfoliosCreatePage />} />
                      <Route path=":id/edit" element={<PortfoliosEditPage />} />
                      <Route path=":id/view" element={<PortfoliosViewPage />} />
                      <Route path="categories">
                        <Route index element={<PortfolioCategoriesPage />} />
                      </Route>
                      <Route path="tags">
                        <Route index element={<PortfolioTagsPage />} />
                      </Route>
                      <Route path="options">
                        <Route index element={<PortfolioOptionsPage />} />
                      </Route>
                    </Route>
                    <Route path="blogs">
                      <Route index element={<BlogsPage />} />
                      <Route path="create" element={<BlogsCreatePage />} />
                      <Route path=":id/edit" element={<BlogsEditPage />} />
                      <Route path=":id/view" element={<BlogsViewPage />} />
                      <Route path="categories">
                        <Route index element={<BlogCategoriesPage />} />
                      </Route>
                      <Route path="tags">
                        <Route index element={<BlogTagsPage />} />
                      </Route>
                    </Route>
                    <Route path="ai">
                      <Route path="chat" element={<AIChatPage />} />
                      <Route path="image" element={<AIImagePage />} />
                      <Route path="audio" element={<AIAudioPage />} />
                      <Route path="content" element={<AIContentPage />} />
                      <Route path="models" element={<AIModelsPage />} />
                      <Route path="settings" element={<AISettingsPage />} />
                      <Route path="ai-unified" element={<AIUnifiedPage />} />
                    </Route>
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings">
                      <Route index element={<Navigate to="general" replace />} />
                      <Route path=":tab" element={<SettingsPage />} />
                    </Route>
                    <Route path="panel" element={<PanelPage />} />
                    <Route path="email" element={<EmailPage />} />
                    <Route path="ticket" element={<TicketPage />} />
                    <Route path="chatbot" element={<ChatbotPage />} />
                    <Route path="form-builder" element={<FormBuilderPage />} />
                    <Route path="page">
                      <Route path="about" element={<PageAbout />} />
                      <Route path="terms" element={<PageTerms />} />
                    </Route>
                    <Route path="real-estate">
                      <Route index element={<PropertiesPage />} />
                      <Route path="statistics" element={<RealEstateStatisticsPage />} />
                      <Route path="properties">
                        <Route index element={<PropertiesPage />} />
                        <Route path="create" element={<PropertiesCreatePage />} />
                        <Route path=":id/edit" element={<PropertiesEditPage />} />
                        <Route path=":id/view" element={<PropertiesViewPage />} />
                      </Route>
                      <Route path="types" element={<PropertyTypesPage />} />
                      <Route path="states" element={<PropertyStatesPage />} />
                      <Route path="labels" element={<PropertyLabelsPage />} />
                      <Route path="features" element={<PropertyFeaturesPage />} />
                      <Route path="tags" element={<PropertyTagsPage />} />
                    </Route>

                  </Route>

                  <Route path="/blogs/print" element={<ProtectedRoute><BlogPrintPage /></ProtectedRoute>} />
                  <Route path="/portfolios/print" element={<ProtectedRoute><PortfolioPrintPage /></ProtectedRoute>} />
                  <Route path="/real-estate/print" element={<ProtectedRoute><PropertyPrintPage /></ProtectedRoute>} />

                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                </Routes>

              </AIChatProvider>
            </PermissionProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
