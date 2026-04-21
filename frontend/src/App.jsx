import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from './pages/Home';
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import UserDashboard from "./pages/user/UserDashboard";
import ReportAnIssue from "./pages/ReportAnIssue";
import Resources from './pages/Resources';
import BookingPage from "./pages/Booking/BookingPage";
import MyBookings from "./pages/Booking/MyBookings";
import MyBookingsCalendar from "./pages/Booking/MyBookingsCalendar";

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-100 text-slate-900 flex flex-col font-sans">
    <Navbar />
    <div className="grow bg-gray-100">{children}</div>
    <Footer />
  </div>
);

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/resources" element={<AppLayout><Resources /></AppLayout>} />
        <Route path="/admin/dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />
        <Route path="/technician/dashboard" element={<AppLayout><TechnicianDashboard /></AppLayout>} />
        <Route path="/user/dashboard" element={<AppLayout><UserDashboard /></AppLayout>} />
        <Route path="/admin/facilities" element={<AppLayout><AdminPage /></AppLayout>} />
        <Route path="/admin/bookings" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/report-an-issue" element={<AppLayout><ReportAnIssue /></AppLayout>} />

        <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
        <Route path="/register" element={<AppLayout><Register /></AppLayout>} />

      // Booking routes
      <Route path="/book/:id" element={<AppLayout><BookingPage /></AppLayout>} />
      <Route path="/bookings" element={<AppLayout><MyBookings hideLayout={true} /></AppLayout>} />
      <Route path="/bookings-calendar" element={<AppLayout><MyBookingsCalendar /></AppLayout>} />


      </Routes>
    </>
  );
};

export default App;