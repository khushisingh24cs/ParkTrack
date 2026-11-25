import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Overview from './pages/Overview';
import SubmitReport from './pages/SubmitReport';
import TrackReports from './pages/TrackReports';
import HandlerDashboard from './pages/HandlerDashboard';
import RoutingManagement from './pages/RoutingManagement';
import Analytics from './pages/Analytics';
import ValidationLab from './pages/ValidationLab';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/submit" element={<SubmitReport />} />
        <Route path="/track" element={<TrackReports />} />
        <Route path="/handlers" element={<HandlerDashboard />} />
        <Route path="/routing" element={<RoutingManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/validation-lab" element={<ValidationLab />} />
      </Route>
    </Routes>
  );
}

