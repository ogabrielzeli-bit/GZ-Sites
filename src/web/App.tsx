import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Pipeline } from './pages/Pipeline';
import { Prospects } from './pages/Prospects';
import { ProspectDetail } from './pages/ProspectDetail';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { SettingsPage } from './pages/Settings';
import { PreviewPage } from './pages/Creative';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="prospects" element={<Prospects />} />
        <Route path="prospects/:id" element={<ProspectDetail />} />
        <Route path="preview/:id" element={<PreviewPage />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<div className="text-muted">Página não encontrada.</div>} />
      </Route>
    </Routes>
  );
}
