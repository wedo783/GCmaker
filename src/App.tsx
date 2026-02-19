import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CardProvider } from './context/CardContext';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import './index.css';

function App() {
  return (
    <Router>
      <CardProvider>
        <Routes>
          {/* Admin panel */}
          <Route path="/admin" element={<AdminPage />} />
          {/* Card viewer — works for both / and /:slug */}
          <Route path="/:slug" element={<UserPage />} />
          <Route path="/" element={<UserPage />} />
        </Routes>
      </CardProvider>
    </Router>
  );
}

export default App;
