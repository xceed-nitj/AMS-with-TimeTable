import SectionHeader from '../../ui/home/SectionHeader';
import EnquireModal from './EnquireModal';
import { useDisclosure } from '@chakra-ui/react';
import ServiceCard from './ServiceCard';
import { services } from '../../../constants/services';

const Services = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <section id="services" className="tw-bg-white dark:tw-bg-gray-900">
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
        <div className="tw-mb-4 tw-space-y-8 md:tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-gap-12 md:tw-space-y-0 tw-py-5">
          {services
            .filter((service) => service.type === 'premium')
            .map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
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
        <div className="tw-space-y-8 md:tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-gap-12 md:tw-space-y-0 tw-py-5">
          {services
            .filter((service) => service.type === 'institute')
            .map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
