import { useParams } from 'react-router-dom';
import ServiceHero from '../components/home/Services/ServiceHero';
import ServiceFeatures from '../components/home/Services/Features';
import Team from '../components/home/TeamSection/Team';
import Footer from '../components/footer';
import JoinUs from '../components/home/JoinUs';
import { services } from '../constants/services';
import { useEffect } from 'react';

const ServicePage = () => {
  const { serviceId } = useParams();
  const service = services.find(
    (service) => service.id === parseInt(serviceId)
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="tw-font-jakarta tw-dark tw-bg-gray-900 tw-min-h-screen tw-text-white">
      <ServiceHero {...service} />
      <ServiceFeatures features={service?.features} />
      <Team
        title="People Involved"
        desp="Xceed has an experienced team of developers, designers and mentors
            dedicated to create web solutions based on your requirement."
        teamData={service?.team}
        variant="core"
      />
      <JoinUs />
      <Footer />
    </main>
  );
};

export default ServicePage;
