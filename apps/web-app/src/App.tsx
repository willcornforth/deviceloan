import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Devices from './pages/Devices';
import Loans from './pages/Loans';

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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
