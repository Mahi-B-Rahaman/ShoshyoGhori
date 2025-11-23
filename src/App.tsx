import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login.tsx';
import LenderPage from './lenderPage.tsx';
import RentPage from './RentPage.tsx';
import Navbar from './Navbar.tsx';
import ProfilePage from './ProfilePage.tsx';
import { AuthProvider } from './AuthContext.tsx';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="animate-fadeIn">
          <Navbar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/lender" element={<LenderPage />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
