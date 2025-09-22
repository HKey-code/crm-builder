import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { SettingsOverview } from './pages/settings/Overview'
import { ScriptingLayout } from './pages/settings/scripting/ScriptingLayout.tsx'
import { ScriptsList } from './pages/settings/scripting/ScriptsList.tsx'
import { List as ScriptsListV2 } from './pages/settings/scripting/List.tsx'
import { New as ScriptNewV2 } from './pages/settings/scripting/New.tsx'
import { ScriptView } from './pages/settings/scripting/ScriptView.tsx'
import { ScriptEdit } from './pages/settings/scripting/ScriptEdit.tsx'
import { ScriptVersions } from './pages/settings/scripting/ScriptVersions.tsx'
import { ScriptTestRunner } from './pages/settings/scripting/ScriptTestRunner.tsx'
import { ScriptImportExport } from './pages/settings/scripting/ScriptImportExport.tsx'
import { SettingsWorkflow } from './pages/settings/Workflow'
import { SettingsUsers } from './pages/settings/Users'
import { SettingsRoles } from './pages/settings/Roles'
import { SettingsNotifications } from './pages/settings/Notifications'
import { SettingsTemplates } from './pages/settings/Templates'
import { SettingsBranding } from './pages/settings/Branding'
import { SettingsCatalog } from './pages/settings/Catalog'
import { SettingsPermitTypes } from './pages/settings/PermitTypes'
import { SettingsFees } from './pages/settings/Fees'
import { SettingsGIS } from './pages/settings/GIS'
import { SettingsAudit } from './pages/settings/Audit'
import AppShell from './layouts/AppShell'
import AppShellFullBleed from './layouts/AppShellFullBleed'
import AdminShell from './layouts/AdminShell'
import ApplyPage from './pages/Apply'
import ApplicationsPage from './pages/Applications'
import ApplicationDetailsPage from './pages/ApplicationDetails'
import HelpPage from './pages/Help'
import NotificationsPage from './pages/Notifications'

function App() {
  const router = createBrowserRouter([
    // Full-bleed shell for hero pages
    {
      element: <AppShellFullBleed />,
      children: [
        { path: '/applications', element: <ApplicationsPage /> },
      ],
    },
    // Default shell for the rest
    {
      element: <AppShell />,
      children: [
        { path: '/', element: <Navigate to="/applications" replace /> },
        { path: '/apply', element: <ApplyPage /> },
        { path: '/applications/:id', element: <ApplicationDetailsPage /> },
        { path: '/help', element: <HelpPage /> },
        { path: '/notifications', element: <NotificationsPage /> },
        {
          path: '/settings',
          element: <AdminShell fullBleed />,
          children: [
            { index: true, element: <SettingsOverview /> },
            {
              path: 'scripting',
              element: <ScriptingLayout />,
              children: [
                { index: true, element: <ScriptsListV2 /> },
                { path: 'list', element: <ScriptsListV2 /> },
                { path: 'new', element: <ScriptNewV2 /> },
                { path: ':id', element: <ScriptView /> },
                { path: ':id/edit', element: <ScriptEdit /> },
                { path: ':id/versions', element: <ScriptVersions /> },
                { path: ':id/test', element: <ScriptTestRunner /> },
                { path: ':id/import-export', element: <ScriptImportExport /> },
              ],
            },
            { path: 'workflow', element: <SettingsWorkflow /> },
            { path: 'users', element: <SettingsUsers /> },
            { path: 'roles-permissions', element: <SettingsRoles /> },
            { path: 'notifications', element: <SettingsNotifications /> },
            { path: 'templates', element: <SettingsTemplates /> },
            { path: 'branding', element: <SettingsBranding /> },
            { path: 'catalog', element: <SettingsCatalog /> },
            { path: 'permit-types', element: <SettingsPermitTypes /> },
            { path: 'fees', element: <SettingsFees /> },
            { path: 'gis', element: <SettingsGIS /> },
            { path: 'audit-logs', element: <SettingsAudit /> },
          ],
        },
        // 404 catch-all
        { path: '*', element: <Navigate to="/applications" replace /> },
      ],
    },
  ])

  return <RouterProvider router={router} />
}

export default App
