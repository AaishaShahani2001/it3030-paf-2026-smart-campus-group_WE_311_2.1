import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default Home;
