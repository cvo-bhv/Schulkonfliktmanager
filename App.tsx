import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StructureManagement } from './pages/StructureManagement';
import { IncidentList } from './pages/IncidentList';
import { IncidentForm } from './pages/IncidentForm';
import { PrintView } from './pages/PrintView';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Dedicated Print Route (No Layout) */}
        <Route path="/print" element={<PrintView />} />

        {/* Main Application Routes (With Layout) */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/incidents" element={<Layout><IncidentList /></Layout>} />
        <Route path="/incidents/new" element={<Layout><IncidentForm /></Layout>} />
        <Route path="/incidents/edit/:id" element={<Layout><IncidentForm /></Layout>} />
        <Route path="/structure" element={<Layout><StructureManagement /></Layout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;