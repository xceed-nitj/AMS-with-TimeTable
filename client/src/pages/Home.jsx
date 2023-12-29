import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Team from "../components/home/Team";
import JoinUs from "../components/home/JoinUs";
import Footer from "../components/footer";
import Navbar from "../components/home/Navbar";
import Services from "../components/home/Services";

const Home = () => {
  return (
    <main className="tw-font-jakarta">
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Team />
      <JoinUs />
      <Footer />
    </main>
  );
};

export default Home;
