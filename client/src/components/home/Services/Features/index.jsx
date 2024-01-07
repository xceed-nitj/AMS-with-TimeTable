import SectionHeader from '../../../ui/home/SectionHeader';
import FeatureCard from './FeatureCard';

const ServiceFeatures = ({ features }) => {
  if (!features) {
    return null;
  }

  return (
    <section className="tw-bg-white dark:tw-bg-gray-900">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
          <SectionHeader centered title="Features on Offer" />
          <p className="tw-text-center tw-max-w-4xl tw-mx-auto tw-mb-4">
            XCEED has an experienced team of developers, designers and mentors
            dedicated to provide economical web based solutions as per your
            requirement. Here are some of our most demanded services.
          </p>
        </div>
        <div className="tw-mb-4 tw-space-y-8 md:tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-gap-12 md:tw-space-y-0 tw-py-5">
          {features.map((service, key) => (
            <FeatureCard key={key} index={key} title={service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceFeatures;
