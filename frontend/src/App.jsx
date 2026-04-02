import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import ResourceList from './pages/ResourceList';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Layout = ({ children }) => (
  <div className="min-h-screen font-sans bg-white selection:bg-emerald-100 flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* We keep Home as is, since it has its own layout pattern, or wrap it if preferred. 
            Home.jsx already has Navbar and Footer, so we just render it outside Layout */}
        <Route path="/home" element={<Home />} />
        
        <Route path="/facilities" element={<Layout><ResourceList /></Layout>} />
        <Route path="/admin/facilities" element={<Layout><AdminPage /></Layout>} />
      </Routes>
    </>
  )
}

export default App