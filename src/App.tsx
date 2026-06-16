import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import TracingPage from '@/pages/Tracing';
import LadlePage from '@/pages/Ladle';
import TundishPage from '@/pages/Tundish';
import MoldPage from '@/pages/Mold';
import SecondaryCoolingPage from '@/pages/SecondaryCooling';
import CuttingPage from '@/pages/Cutting';
import CleaningPage from '@/pages/Cleaning';
import WarehousePage from '@/pages/Warehouse';
import QualityDisposalPage from '@/pages/QualityDisposal';
import OutboundPlanPage from '@/pages/OutboundPlan';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracing" element={<TracingPage />} />
          <Route path="/ladle" element={<LadlePage />} />
          <Route path="/tundish" element={<TundishPage />} />
          <Route path="/mold" element={<MoldPage />} />
          <Route path="/secondary-cooling" element={<SecondaryCoolingPage />} />
          <Route path="/cutting" element={<CuttingPage />} />
          <Route path="/cleaning" element={<CleaningPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/quality-disposal" element={<QualityDisposalPage />} />
          <Route path="/outbound-plan" element={<OutboundPlanPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
