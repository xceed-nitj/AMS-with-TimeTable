import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const ServiceHero = ({ icon, title, description, images }) => {
  const [currentImage, setCurrentImage] = useState(0);

  function nextImage() {
    setCurrentImage((currentImage + 1) % images.length);
  }
  function prevImage() {
    setCurrentImage((currentImage - 1 + images.length) % images.length);
  }

  return (
    <section className="tw-max-w-7xl tw-mx-auto tw-px-4 lg:tw-px-6 lg:tw-pt-32 tw-py-10 lg:tw-py-20">
      <div className=" tw-flex tw-flex-col md:tw-items-center tw-justify-center md:tw-text-center tw-gap-5 lg:tw-gap-10">
        <div className="tw-mb-4 tw-text-cyan-600 dark:tw-text-cyan-300 *:tw-size-14 lg:*:tw-size-20">
          {icon}
        </div>
        <h1 className="tw-text-3xl md:tw-text-4xl lg:tw-text-5xl tw-font-bold tw-text-white tw-text-left">
          {title}
        </h1>
        <p className="tw-max-w-4xl tw-leading-normal tw-text-gray-400">
          {description}
        </p>
      </div>

      {images && images.length > 1 && (
        <div className="tw-w-full tw-overflow-hidden tw-relative tw-mt-16 tw-mb-20 tw-rounded-xl md:tw-rounded-2xl">
          <button
            onClick={prevImage}
            className="tw-absolute tw-top-1/2 tw--translate-y-1/2 tw-left-0 tw-px-4 tw-py-2 tw-bg-cyan-500 tw-text-white tw-font-semibold tw-rounded-xl tw-shadow-lg tw-transform tw--translate-x-[90%] tw-transition tw-duration-300 hover:tw--translate-x-0"
          >
            <ArrowLeftIcon className="tw-w-4 tw-h-4 tw-inline tw-mr-2" />
            Previous
          </button>
          <img
            className="tw-w-full tw-max-h-[700px] tw-object-cover tw-object-center tw-mx-auto"
            src={images[currentImage]}
            alt="Feature image"
          />
          <button
            onClick={nextImage}
            className="tw-absolute tw-top-1/2 tw--translate-y-1/2 tw-right-0 tw-px-4 tw-py-2 tw-bg-cyan-500 tw-text-white tw-font-semibold tw-rounded-xl tw-shadow-lg tw-transform tw-translate-x-[90%] tw-transition tw-duration-300 hover:tw-translate-x-0"
          >
            Next
            <ArrowRightIcon className="tw-w-4 tw-h-4 tw-inline tw-ml-2" />
          </button>
        </div>
      )}
    </section>
  );
};

export default ServiceHero;
