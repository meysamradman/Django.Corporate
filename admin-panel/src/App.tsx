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
import Dashboard from './pages/Dashboard';
import MediaPage from './pages/media/page';
import AdminsPage from './pages/admins/page';
import AdminsCreatePage from './pages/admins/create/page';
import AdminsEditPage from './pages/admins/[id]/edit/page';
import AdminsPermissionsPage from './pages/admins/permissions/page';
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
import PortfolioCategoriesCreatePage from './pages/portfolios/categories/create/page';
import PortfolioCategoriesEditPage from './pages/portfolios/categories/[id]/edit/page';
import PortfolioTagsPage from './pages/portfolios/tags/page';
import PortfolioTagsCreatePage from './pages/portfolios/tags/create/page';
import PortfolioTagsEditPage from './pages/portfolios/tags/[id]/edit/page';
import PortfolioOptionsPage from './pages/portfolios/options/page';
import PortfolioOptionsCreatePage from './pages/portfolios/options/create/page';
import PortfolioOptionsEditPage from './pages/portfolios/options/[id]/edit/page';
import PortfolioOptionsViewPage from './pages/portfolios/options/[id]/page';
import BlogsPage from './pages/blogs/page';
import BlogsCreatePage from './pages/blogs/(list)/create/page';
import BlogsEditPage from './pages/blogs/(list)/[id]/edit/page';
import BlogsViewPage from './pages/blogs/(list)/[id]/view/page';
import BlogCategoriesPage from './pages/blogs/categories/page';
import BlogCategoriesCreatePage from './pages/blogs/categories/create/page';
import BlogCategoriesEditPage from './pages/blogs/categories/[id]/edit/page';
import BlogTagsPage from './pages/blogs/tags/page';
import BlogTagsCreatePage from './pages/blogs/tags/create/page';
import BlogTagsEditPage from './pages/blogs/tags/[id]/edit/page';
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
import PropertyTypeCreatePage from './pages/real-estate/types/create/page';
import PropertyTypeEditPage from './pages/real-estate/types/[id]/edit/page';
import PropertyTypeViewPage from './pages/real-estate/types/[id]/view/page';
import PropertyStatesPage from './pages/real-estate/states/page';
import PropertyStateCreatePage from './pages/real-estate/states/create/page';
import PropertyStateEditPage from './pages/real-estate/states/[id]/edit/page';
import PropertyStateViewPage from './pages/real-estate/states/[id]/view/page';
import PropertyLabelsPage from './pages/real-estate/labels/page';
import PropertyLabelCreatePage from './pages/real-estate/labels/create/page';
import PropertyLabelEditPage from './pages/real-estate/labels/[id]/edit/page';
import PropertyLabelViewPage from './pages/real-estate/labels/[id]/view/page';
import PropertyFeaturesPage from './pages/real-estate/features/page';
import PropertyFeatureCreatePage from './pages/real-estate/features/create/page';
import PropertyFeatureEditPage from './pages/real-estate/features/[id]/edit/page';
import PropertyFeatureViewPage from './pages/real-estate/features/[id]/view/page';
import PropertyTagsPage from './pages/real-estate/tags/page';
import PropertyTagCreatePage from './pages/real-estate/tags/create/page';
import PropertyTagEditPage from './pages/real-estate/tags/[id]/edit/page';
import PropertyTagViewPage from './pages/real-estate/tags/[id]/view/page';
import AdvisorsListPage from './pages/real-estate/advisors/page';
import AgenciesListPage from './pages/real-estate/agencies/page';
import AgentViewPage from './pages/real-estate/agents/[id]/view/page';
import AgentEditPage from './pages/real-estate/agents/[id]/edit/page';
import AgentCreatePage from './pages/real-estate/agents/create/page';
import AgencyViewPage from './pages/real-estate/agencies/[id]/view/page';
import AgencyEditPage from './pages/real-estate/agencies/[id]/edit/page';
import AgencyCreatePage from './pages/real-estate/agencies/create/page';
import RealEstateStatisticsPage from './pages/real-estate/statistics/page';

import RealEstateStaticPage from './pages/Staticstyle/realstate/page';
import RealEstateListPage from './pages/Staticstyle/realstate/list/page';
import RealEstateViewPage from './pages/Staticstyle/realstate/[id]/view/page';
import RealEstateEditPage from './pages/Staticstyle/realstate/[id]/edit/page';
import AdvisorsListPageStatic from './pages/Staticstyle/realstate/advisors/list/page';
import AdvisorViewPage from './pages/Staticstyle/realstate/advisors/[id]/view/page';
import AdvisorEditPage from './pages/Staticstyle/realstate/advisors/[id]/edit/page';
import AgenciesListPageStatic from './pages/Staticstyle/realstate/agencies/list/page';
import AgencyViewPageStatic from './pages/Staticstyle/realstate/agencies/[id]/view/page';
import AgencyEditPageStatic from './pages/Staticstyle/realstate/agencies/[id]/edit/page';


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
                    <Route path=":id/edit" element={<AdminsEditPage />} />
                    <Route path="permissions" element={<AdminsPermissionsPage />} />
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
                      <Route path="create" element={<PortfolioCategoriesCreatePage />} />
                      <Route path=":id/edit" element={<PortfolioCategoriesEditPage />} />
                    </Route>
                    <Route path="tags">
                      <Route index element={<PortfolioTagsPage />} />
                      <Route path="create" element={<PortfolioTagsCreatePage />} />
                      <Route path=":id/edit" element={<PortfolioTagsEditPage />} />
                    </Route>
                    <Route path="options">
                      <Route index element={<PortfolioOptionsPage />} />
                      <Route path="create" element={<PortfolioOptionsCreatePage />} />
                      <Route path=":id" element={<PortfolioOptionsViewPage />} />
                      <Route path=":id/edit" element={<PortfolioOptionsEditPage />} />
                    </Route>
                  </Route>
                  <Route path="blogs">
                    <Route index element={<BlogsPage />} />
                    <Route path="create" element={<BlogsCreatePage />} />
                    <Route path=":id/edit" element={<BlogsEditPage />} />
                    <Route path=":id/view" element={<BlogsViewPage />} />
                    <Route path="categories">
                      <Route index element={<BlogCategoriesPage />} />
                      <Route path="create" element={<BlogCategoriesCreatePage />} />
                      <Route path=":id/edit" element={<BlogCategoriesEditPage />} />
                    </Route>
                    <Route path="tags">
                      <Route index element={<BlogTagsPage />} />
                      <Route path="create" element={<BlogTagsCreatePage />} />
                      <Route path=":id/edit" element={<BlogTagsEditPage />} />
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
                  <Route path="settings" element={<SettingsPage />} />
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
                    <Route path="statistics" element={<RealEstateStatisticsPage />} />
                    <Route path="properties">
                      <Route index element={<PropertiesPage />} />
                      <Route path="create" element={<PropertiesCreatePage />} />
                      <Route path=":id/edit" element={<PropertiesEditPage />} />
                      <Route path=":id/view" element={<PropertiesViewPage />} />
                    </Route>
                    <Route path="types">
                      <Route index element={<PropertyTypesPage />} />
                      <Route path="create" element={<PropertyTypeCreatePage />} />
                      <Route path=":id/edit" element={<PropertyTypeEditPage />} />
                      <Route path=":id/view" element={<PropertyTypeViewPage />} />
                    </Route>
                    <Route path="states">
                      <Route index element={<PropertyStatesPage />} />
                      <Route path="create" element={<PropertyStateCreatePage />} />
                      <Route path=":id/edit" element={<PropertyStateEditPage />} />
                      <Route path=":id/view" element={<PropertyStateViewPage />} />
                    </Route>
                    <Route path="labels">
                      <Route index element={<PropertyLabelsPage />} />
                      <Route path="create" element={<PropertyLabelCreatePage />} />
                      <Route path=":id/edit" element={<PropertyLabelEditPage />} />
                      <Route path=":id/view" element={<PropertyLabelViewPage />} />
                    </Route>
                    <Route path="features">
                      <Route index element={<PropertyFeaturesPage />} />
                      <Route path="create" element={<PropertyFeatureCreatePage />} />
                      <Route path=":id/edit" element={<PropertyFeatureEditPage />} />
                      <Route path=":id/view" element={<PropertyFeatureViewPage />} />
                    </Route>
                    <Route path="tags">
                      <Route index element={<PropertyTagsPage />} />
                      <Route path="create" element={<PropertyTagCreatePage />} />
                      <Route path=":id/edit" element={<PropertyTagEditPage />} />
                      <Route path=":id/view" element={<PropertyTagViewPage />} />
                    </Route>
                    <Route path="agents">
                      <Route index element={<AdvisorsListPage />} />
                      <Route path="create" element={<AgentCreatePage />} />
                      <Route path=":id/view" element={<AgentViewPage />} />
                      <Route path=":id/edit" element={<AgentEditPage />} />
                    </Route>
                    <Route path="advisors">
                      <Route index element={<AdvisorsListPage />} />
                      <Route path="create" element={<AgentCreatePage />} />
                      <Route path=":id/view" element={<AgentViewPage />} />
                      <Route path=":id/edit" element={<AgentEditPage />} />
                    </Route>
                    <Route path="agencies">
                      <Route index element={<AgenciesListPage />} />
                      <Route path="create" element={<AgencyCreatePage />} />
                      <Route path=":id/view" element={<AgencyViewPage />} />
                      <Route path=":id/edit" element={<AgencyEditPage />} />
                    </Route>
                  </Route>
                  <Route path="staticstyle">
                    <Route path="realstate">
                      <Route index element={<RealEstateStaticPage />} />
                      <Route path="list" element={<RealEstateListPage />} />
                      <Route path="advisors/list" element={<AdvisorsListPageStatic />} />
                      <Route path="advisors/:id/view" element={<AdvisorViewPage />} />
                      <Route path="advisors/:id/edit" element={<AdvisorEditPage />} />
                      <Route path="agencies/list" element={<AgenciesListPageStatic />} />
                      <Route path="agencies/:id/view" element={<AgencyViewPageStatic />} />
                      <Route path="agencies/:id/edit" element={<AgencyEditPageStatic />} />
                      <Route path=":id">
                        <Route path="view" element={<RealEstateViewPage />} />
                        <Route path="edit" element={<RealEstateEditPage />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>
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
