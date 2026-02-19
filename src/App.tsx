import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CardProvider } from './context/CardContext';
import { AuthSettingsProvider } from './context/AuthSettingsContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './components/Admin/AdminLogin';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import './index.css';

function App() {
  return (
    <Router>
      <AuthSettingsProvider>
        <CardProvider>
          <Routes>
            {/* Admin panel */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/edit/:cardId" element={<AdminPage />} />

            {/* Card viewer — works for both / and /:slug */}
            <Route path="/:slug" element={<UserPage />} />
            <Route path="/" element={<UserPage />} />
          </Routes>
        </CardProvider>
      </AuthSettingsProvider>
    </Router>
  );
}

export default App;
