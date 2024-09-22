import Hero from '../components/home/Hero';
import About from '../components/home/About';
import JoinUs from '../components/home/JoinUs';
import GrowthTree from '../components/home/Tree/Tree';
import Footer from '../components/footer';
import Services from '../components/home/Services';
import RevenueDistribution from '../components/home/RevenueDistribution';
import TeamSection from '../components/home/TeamSection';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location?.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <main className="tw-font-jakarta tw-dark">
      {/* <Navbar /> */}
      <Hero />
      <Services />
      <GrowthTree />
      <About />
      <TeamSection />
      <JoinUs />
      <Footer />
    </main>
  );
};

export default Home;
