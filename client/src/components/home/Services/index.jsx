import SectionHeader from '../../ui/home/SectionHeader';
import EnquireModal from './EnquireModal';
import { useDisclosure } from '@chakra-ui/react';
import ServiceCard from './ServiceCard';
import { services } from '../../../constants/services';
import { useState, useEffect, useRef } from 'react';

const Services = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef(null);

  const filteredServices = services.filter((service) => service.type === 'premium');
  const filteredInstituteServices = services.filter((service) => service.type === 'institute');
  const totalSlides = Math.ceil(filteredServices.length / 3); // Number of slides to show

  // Create a duplicated array to enable infinite scrolling effect
  const duplicatedServices = [ ...filteredServices, ...filteredServices, ...filteredServices];
  const duplicatedInstituteServices = [ ...filteredInstituteServices, ...filteredInstituteServices, ...filteredInstituteServices];

  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex+1 >= filteredServices.length) {
            sliderRef.current.style.transition = 'none'; // Disable transition for reset
            return prevIndex=0; // Reset index to 0 when exceeding the original content length
          }
          sliderRef.current.style.transition = 'transform 3s ease'; // Re-enable transition
          return prevIndex + 1 ;
        });
      }, 3000); // 3000ms interval for sliding
    }

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [isPaused, filteredServices.length]);

  useEffect(() => {
    let intervalInstitute;
    if (!isPaused) {
      intervalInstitute = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex+1 >= filteredInstituteServices.length) {
            sliderRef.current.style.transition = 'none'; // Disable transition for reset
            return 0; // Reset index to 0 when exceeding the original content length
          }
          sliderRef.current.style.transition = 'transform 2s ease'; // Re-enable transition
          return prevIndex + 1 ;
        });
      }, 3000); // 3000ms interval for sliding
    }

    return () => clearInterval(intervalInstitute); // Cleanup interval on component unmount
  }, [isPaused, filteredInstituteServices.length]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <section id="services" className="tw-bg-white dark:tw-bg-gray-900 overflow-hidden">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
          <SectionHeader centered title="Our Services" />
          <p className="tw-text-center tw-max-w-4xl tw-mx-auto tw-mb-4">
            XCEED has an experienced team of developers, designers and mentors
            dedicated to provide economical web based solutions as per your
            requirement. Here are some of our most demanded services.
          </p>
        </div>
        <div>
          <h4 className="tw-mb-4 tw-text-2xl tw-font-extrabold tw-leading-none tw-tracking-tight tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-2xl lg:tw-text-2xl">
            Premium Services
          </h4>
        </div>
        <div 
          className="tw-overflow-hidden tw-w-full tw-mb-20" 
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={sliderRef}
            className="tw-flex tw-transition-transform tw-duration-500"
            style={{
              transform: `translateX(-${(currentIndex * 100) / 4}%)`, // Adjusted for full width
              width: `${(duplicatedServices.length / 3) * 100}%`,
              justifyContent: "space-around"
            }}
          >
            {duplicatedServices.map((service, index) => (
              <div
                className="tw-flex-shrink-0 tw-px-2 tw-py-4 tw-w-full md:tw-w-64 lg:tw-w-80 xs:tw-w-32" // Responsive width
                key={`${service.id}-${index}`}
                style={{ 
                  border:"2px solid #164e63",
                  borderRadius: "10px",  
                  padding: "20px"
                }}
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>

        {/* Modal toggle */}
        <button
          onClick={onOpen}
          type="button"
          className="tw-mx-auto tw-flex tw-items-center tw-justify-center tw-p-0.5 tw-overflow-hidden tw-text-sm tw-font-medium tw-text-gray-900 tw-rounded-lg tw-group tw-bg-gradient-to-br from-cyan-500 tw-to-blue-500 group-hover:tw-from-cyan-500 group-hover:tw-to-blue-500 hover:tw-text-white dark:tw-text-white focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-200 dark:focus:tw-ring-cyan-800"
        >
          <span className="tw-relative tw-px-5 tw-py-2.5 tw-transition-all tw-ease-in tw-duration-75 tw-bg-white dark:tw-bg-gray-700 tw-rounded-md group-hover:tw-bg-opacity-50">
            Enquire about services
          </span>
        </button>
        {/* Main modal */}
        <EnquireModal isOpen={isOpen} onClose={onClose} />

        <hr className="tw-h-px tw-my-8 tw-bg-gray-200 tw-border-0 dark:tw-bg-gray-700" />
        <div>
          <h4 className="tw-mb-4 tw-text-2xl tw-font-extrabold tw-leading-none tw-tracking-tight tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-2xl lg:tw-text-2xl">
            Institute Services
          </h4>
        </div>
        <div 
          className="tw-overflow-hidden tw-w-full tw-mb-20" 
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={sliderRef}
            className="tw-flex tw-transition-transform tw-duration-500"
            style={{
              transform: `translateX(-${(currentIndex * 100) / 4}%)`, // Adjusted for full width
              width: `${(duplicatedInstituteServices.length / 3) * 100}%`,
              justifyContent: "space-around"
            }}
          >
            {duplicatedInstituteServices.map((service, index) => (
              <div
                className="tw-flex-shrink-0 tw-px-2 tw-py-4 tw-w-full md:tw-w-64 lg:tw-w-80 xs:tw-w-32" // Responsive width based on screen size
                key={`${service.id}-${index}`}
                style={{ 
                  border:"2px solid #164e63",
                  borderRadius: "10px",  
                  padding: "20px"
                }}
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>       
      </div>
    </section>
  );
};

export default Services;
