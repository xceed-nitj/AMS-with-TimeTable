import {
  AcademicCapIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';

export const services = [
  {
    id: 1,
    icon: (
      <PresentationChartLineIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'premium',
    title: 'Conference Module',
    description:
      'Elevate your conference experience with our expertly crafted conference website development services. We specialize in creating dynamic and responsive platforms that seamlessly blend functionality with aesthetic appeal. We prioritize security, ensuring a safe environment for user data and transactions. Let us elevate your conference to new heights with our innovative and tailored web solutions, keeping you at the forefront of event technology.',
    price: '₹ 7000 onwards',
  },
  {
    id: 2,
    icon: (
      <BriefcaseIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'premium',

    title: 'Short Term Course Page with Certificate Module',
    description:
      'Our service caters to your unique needs, offering a robust and customizable webpage to bring your short-term courses to a wide audience. With our Certificate Module, our team helps in design and generation of digital verifiable certificates. The participants can earn verifiable certificates, adding a credible dimension to their achievements. The certificate includes a secure verification link, bolstering the integrity of the credential.',
    price: '₹ 2000 onwards',
  },
  {
    id: 3,
    icon: (
      <AcademicCapIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'premium',
    title: 'Portfolio Websites',
    description:
      'We specialize in crafting visually stunning and functionally robust websites that showcase your work, talents, and achievements. From captivating visuals to intuitive navigation, our portfolio websites are designed to leave a lasting impression and effectively communicate your unique story. Let us bring your achievements to life online, creating a digital showcase that captivates and engages your audience.',
    price: '₹ 5000 onwards',
  },
  {
    id: 4,
    icon: (
      <AcademicCapIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'institute',
    title: 'Digitalisation of the Institute Time Table',
    description:
      "Timetable Module is aimed at reducing the manual work to a great extent in generating time table online and to digitally view and share the time table to various stakeholders. Streamline your scheduling process with our user-friendly interface, allowing you to create student, teacher, and room timetables in one go. The Timetable Module is designed to be compatible with various devices, promoting accessibility for administrators, teachers, and students alike. Additionally, we've integrated Google location information for classrooms, enhancing convenience and accessibility.",
  },
  {
    id: 5,
    icon: (
      <WrenchScrewdriverIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'institute',
    title: "Management of NITJ's Official Website",
    description:
      "This service is under the Website Development and Management Committe (WDMC) with multiple groups mentored by different faculty members of the institute. We specialize in providing tailored solutions that streamline the maintenance of our institute's website, ensuring seamless functionality and up-to-date information. From academic program updates and event announcements to faculty profiles and student resources, we offered an intuitive interface for effortless content management. Our services extend beyond mere website maintenance; we empower you to showcase the dynamic spirit of your institute, fostering engagement and connectivity.",
  },
  {
    id: 6,
    icon: (
      <Cog6ToothIcon className="tw-w-5 tw-h-5 tw-text-cyan-600 lg:tw-w-6 lg:tw-h-6 dark:tw-text-cyan-300" />
    ),
    type: 'institute',
    title: 'FE Course & Hackathons',
    description:
      'WDM Club at our esteemed institution has taken a pioneering step to offer a unique foundation elective course for first-year students. This course aims to provide an immersive and comprehensive introduction to web development, a critical technology in the field of software engineering which is the future!. The foundation elective course offered is designed to cater to students from diverse academic backgrounds. Inaddition to this, Through workshops, and hackathons, we aim to empower our members with the knowledge and practical experience necessary for success in the dynamic field of software development.',
  },
];
