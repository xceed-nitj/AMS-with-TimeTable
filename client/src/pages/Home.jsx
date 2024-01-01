import Hero from '../components/home/Hero';
import About from '../components/home/About';
import JoinUs from '../components/home/JoinUs';
import Footer from '../components/footer';
// import Navbar from '../components/home/Navbar';
import Services from '../components/home/Services';
import RevenueDistribution from '../components/home/RevenueDistribution';
import TeamSection from '../components/home/TeamSection';

const Home = () => {
  return (
    <main className="tw-font-jakarta tw-dark">
      {/* <Navbar /> */}
      <Hero />
      <Services />
      <RevenueDistribution />
      <About />
      <TeamSection />
      <JoinUs />
      <Footer />
    </main>
  );
};

export default Home;
