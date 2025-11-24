import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login.tsx';
import LenderPage from './lenderPage.tsx';
import RentPage from './RentPage.tsx';
import Navbar from './Navbar.tsx';
import CropCare from './CropCare.tsx';
import ProfilePage from './ProfilePage.tsx';
import { AuthProvider } from './AuthContext.tsx'; 
import { NotificationProvider } from './NotificationContext.tsx';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50 text-gray-800">
          <BrowserRouter>
            <div className="animate-fadeIn">
              <Navbar />
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/lender" element={<LenderPage />} />
                <Route path="/rent" element={<RentPage />} />
                <Route path="/crop-care" element={<CropCare />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
