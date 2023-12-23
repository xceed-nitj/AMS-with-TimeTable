import {
  AcademicCapIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import SectionHeader from "../ui/home/SectionHeader";

const Services = () => {
  return (
    <section id="services" className="tw-bg-white dark:tw-bg-gray-900">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
          <SectionHeader centered title="Our Services" />
          <p className="tw-text-center tw-max-w-4xl tw-mx-auto tw-mb-4">
            Xceed has an experienced team of developers, designers and mentors
            dedicated to create web solutions based on your requirement. Here
            are some of our most demanded services.
          </p>
        </div>
        <div>
          <h4 className="tw-mb-4 tw-text-2xl tw-font-extrabold tw-leading-none tw-tracking-tight tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-2xl lg:tw-text-2xl">
            Premium Services
          </h4>
        </div>
        <div className="tw-mb-4 tw-space-y-8 md:tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-gap-12 md:tw-space-y-0">
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <PresentationChartLineIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              Timetable Module
            </h3>
            <p className="tw-mb-2 tw-text-gray-500 dark:tw-text-gray-400">
              Plan it, create it, launch it. Collaborate seamlessly with all the
              organization and hit your marketing goals every month with our
              marketing plan.
            </p>
            <p className="tw-mb-2 tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic">
              ₹ 10000 onwards
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <AcademicCapIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              Portfolio Websites
            </h3>
            <p className="tw-mb-2 tw-text-gray-500 dark:tw-text-gray-400">
              Protect your organization, devices and stay compliant with our
              structured workflows and custom permissions made for you.
            </p>
            <p className="tw-mb-2 tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic">
              ₹ 7000 onwards
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <BriefcaseIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              Conference Websites
            </h3>
            <p className="tw-mb-2 tw-text-gray-500 dark:tw-text-gray-400">
              Auto-assign tasks, send Slack messages, and much more. Now power
              up with hundreds of new templates to help you get started.
            </p>
            <p className="tw-mb-2 tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic">
              ₹ 5000 onwards
            </p>
          </div>
        </div>
        {/* Modal toggle */}
        <button
          data-modal-target="default-modal"
          data-modal-toggle="default-modal"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-p-0.5 tw-overflow-hidden tw-text-sm tw-font-medium tw-text-gray-900 tw-rounded-lg tw-group tw-bg-gradient-to-br from-cyan-500 tw-to-blue-500 group-hover:tw-from-cyan-500 group-hover:tw-to-blue-500 hover:tw-text-white dark:tw-text-white focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-200 dark:focus:tw-ring-cyan-800"
        >
          <span className="tw-relative tw-px-5 tw-py-2.5 tw-transition-all tw-ease-in tw-duration-75 tw-bg-white dark:tw-bg-gray-700 tw-rounded-md group-hover:tw-bg-opacity-50">
            Enquire about services
          </span>
        </button>
        {/* Main modal */}
        <div
          id="default-modal"
          tabIndex={-1}
          aria-hidden="true"
          className="tw-hidden tw-overflow-y-auto tw-overflow-x-hidden tw-fixed tw-top-0 tw-right-0 tw-left-0 tw-z-50 tw-justify-center tw-items-center tw-w-full md:tw-inset-0 tw-h-[calc(100%-1rem)] tw-max-h-full"
        >
          <div className="tw-relative tw-p-4 tw-w-full tw-max-w-2xl tw-max-h-full">
            {/* Modal content */}
            <div className="tw-relative tw-bg-white tw-rounded-lg tw-shadow dark:tw-bg-gray-700">
              {/* Modal header */}
              <div className="tw-flex tw-items-center tw-justify-between tw-p-4 md:tw-p-5 tw-border-b tw-rounded-t dark:tw-border-gray-600">
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900 dark:tw-text-white">
                  Contact Details
                </h3>
                <button
                  type="button"
                  className="tw-text-gray-400 tw-bg-transparent hover:tw-bg-gray-200 hover:tw-text-gray-900 tw-rounded-lg tw-text-sm tw-w-8 tw-h-8 tw-mx-auto tw-inline-flex tw-justify-center tw-items-center dark:hover:tw-bg-gray-600 dark:hover:tw-text-white"
                  data-modal-hide="default-modal"
                >
                  <svg
                    className="tw-size-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="tw-sr-only">Close modal</span>
                </button>
              </div>
              {/* Modal body */}
              <div className="tw-p-4 md:tw-p-5 tw-space-y-4">
                <p className="tw-text-base tw-leading-relaxed tw-text-gray-500 dark:tw-text-gray-400">
                  Contact below to learn more about our services and pricing
                  based on your requirements.
                </p>
                <ul className="tw-text-base tw-leading-relaxed tw-text-gray-500 dark:tw-text-gray-400">
                  <li>Dr Harimurugan</li>
                  <li>harimurugan@nitj.ac.in</li>
                  <li>7009109091</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <hr className="tw-h-px tw-my-8 tw-bg-gray-200 tw-border-0 dark:tw-bg-gray-700" />
        <div>
          <h4 className="tw-mb-4 tw-text-2xl tw-font-extrabold tw-leading-none tw-tracking-tight tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-2xl lg:tw-text-2xl">
            Institute Services
          </h4>
        </div>
        <div className="tw-space-y-8 md:tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-gap-12 md:tw-space-y-0">
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <AcademicCapIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              NITJ&apos;s Official Website
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
              Protect your organization, devices and stay compliant with our
              structured workflows and custom permissions made for you.
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <WrenchScrewdriverIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              Skill Development
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
              Craft beautiful, delightful experiences for both marketing and
              product with real cross-company collaboration.
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <Cog6ToothIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              Workshops
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
              Keep your company&apos;s lights on with customizable, iterative,
              and structured workflows built for all efficient teams and
              individual.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
