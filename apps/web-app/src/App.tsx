import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Devices from './pages/Devices';
import Loans from './pages/Loans';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/devices" element={<Devices />} />
            <Route 
              path="/loans" 
              element={
                <ProtectedRoute>
                  <Loans />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute>
                  <Approvals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
