import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';

const Home = () => {
  return (
    <div className="selection:bg-indigo-100 selection:text-indigo-900 bg-transparent">
      <Hero />
      <HowItWorks />
      <CTA />
    </div>
  );
};

export default Home;
