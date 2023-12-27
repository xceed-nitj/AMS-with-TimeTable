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
            XCEED has an experienced team of developers, designers and mentors
            dedicated to provide economical web based solutions as per your requirement. Here
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
              Conference Module
            </h3>
            <p className="tw-mb-2 tw-text-gray-500 dark:tw-text-gray-400">
            Elevate your conference experience with our expertly crafted conference website development services. We specialize in creating dynamic and responsive platforms that seamlessly blend functionality with aesthetic appeal.  
            We prioritize security, ensuring a safe environment for user data and transactions. Let us elevate your conference to new heights with our innovative and tailored web solutions, keeping you at the forefront of event technology.
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
              Short Term Course Page with Certificate Module
            </h3>
            <p className="tw-mb-2 tw-text-gray-500 dark:tw-text-gray-400">
            Our service caters to your unique needs, offering a robust and customizable webpage to bring your short-term courses to a wide audience. With our Certificate Module, our team helps in design and generation of digital verifiable certificates. The participants can earn verifiable certificates, adding a credible dimension to their achievements. The certificate includes a secure verification link, bolstering the integrity of the credential.
            </p>
            <p className="tw-mb-2 tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic">
              ₹ 5000 onwards
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
            We specialize in crafting visually stunning and functionally robust websites that showcase your work, talents, and achievements. From captivating visuals to intuitive navigation, our portfolio websites are designed to leave a lasting impression and effectively communicate your unique story. Let us bring your achievements to life online, creating a digital showcase that captivates and engages your audience.
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
              Digitalisation of the Institute Time Table
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
            Timetable Module is aimed at reducing the manual work to a great extent in generating time table online and to digitally view and share the time table to various stakeholders. Streamline your scheduling process with our user-friendly interface, allowing you to create student, teacher, and room timetables in one go. The Timetable Module is designed to be compatible with various devices, promoting accessibility for administrators, teachers, and students alike. Additionally, we've integrated Google location information for classrooms, enhancing convenience and accessibility.
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <WrenchScrewdriverIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
            Management of NITJ&apos;s Official Website
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
            This service is under the Website Development and Management Committe (WDMC) with multiple groups mentored by different faculty members of the institute. We specialize in providing tailored solutions that streamline the maintenance of our institute's website, ensuring seamless functionality and up-to-date information. From academic program updates and event announcements to faculty profiles and student resources, we offered an intuitive interface for effortless content management. Our services extend beyond mere website maintenance; we empower you to showcase the dynamic spirit of your institute, fostering engagement and connectivity. 
            </p>
          </div>
          <div>
            <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full tw-bg-cyan-100 lg:tw-h-12 lg:tw-w-12 dark:tw-bg-cyan-900">
              <Cog6ToothIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
            </div>
            <h3 className="tw-mb-2 tw-text-xl tw-font-bold dark:tw-text-white">
              FE Course & Hackathons
            </h3>
            <p className="tw-text-gray-500 dark:tw-text-gray-400">
            WDM Club at our esteemed institution has taken a pioneering step to offer a unique foundation elective course for first-year students. This course aims to provide an immersive and comprehensive introduction to web development, a critical technology in the field of software engineering which is the future!.
The foundation elective course offered is designed to cater to students from diverse academic backgrounds. Inaddition to this, Through workshops, and hackathons, we aim to empower our members with the knowledge and practical experience necessary for success in the dynamic field of software development.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
