import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login.tsx';
import LenderPage from './lenderPage.tsx';
import RentPage from './RentPage.tsx';
import Navbar from './Navbar.tsx';
import CropCare from './CropCare.tsx';
import ProfilePage from './ProfilePage.tsx';
import AdminPage from './AdminPage.tsx';
import SupportPage from './SupportPage.tsx';

export const Layout = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lender" element={<LenderPage />} />
        <Route path="/rent" element={<RentPage />} />
        <Route path="/crop-care" element={<CropCare />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </BrowserRouter>
  );
};