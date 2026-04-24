import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import DonorDetail from './pages/DonorDetail';
import Donations from './pages/Donations';
import AddDonation from './pages/AddDonation';
import Receipt from './pages/Receipt';
import Expenditures from './pages/Expenditures';
import AddExpenditure from './pages/AddExpenditure';
import Visits from './pages/Visits';
import VisitDetail from './pages/VisitDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ReceiptSearch from './pages/ReceiptSearch';
import Layout from './components/Layout';
import FestivalFund from './pages/FestivalFund';
import JummaTholi from './pages/JummaTholi';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="donors" element={<Donors />} />
        <Route path="donors/:id" element={<DonorDetail />} />
        <Route path="donations" element={<Donations />} />
        <Route path="donations/new" element={<AddDonation />} />
        <Route path="receipt/:id" element={<Receipt />} />
        <Route path="receipts/search" element={<ReceiptSearch />} />
        <Route path="expenditures" element={<Expenditures />} />
        <Route path="expenditures/new" element={<AddExpenditure />} />
        <Route path="visits" element={<Visits />} />
        <Route path="visits/:id" element={<VisitDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="festival-fund" element={<FestivalFund />} />
        <Route path="jumma-tholi" element={<JummaTholi />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
