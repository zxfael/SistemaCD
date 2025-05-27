import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import MenuSection from '../components/home/MenuSection';
import { useEffect } from 'react';

const HomePage = () => {
  useEffect(() => {
    document.title = 'Sabor Digital - Cardápios Digitais Personalizáveis';
  }, []);

  return (
    <>
      <HeroSection />
      <MenuSection />
      <FeaturesSection />
    </>
  );
};

export default HomePage;