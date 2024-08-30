import {
  AcademicCapIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import { GiPodiumWinner } from "react-icons/gi";
import { GoCodeReview } from "react-icons/go";
import { certificateTeam, conferenceTeam, timeTableTeam } from './members';

export const services = [
  {
    id: 1,
    icon: <PresentationChartLineIcon />,
    type: 'premium',
    title: 'Conference Module',
    description:
      'Elevate your conference experience with our expertly crafted conference website development services. We specialize in creating dynamic and responsive platforms that seamlessly blend functionality with aesthetic appeal. We prioritize security, ensuring a safe environment for user data and transactions. Let us elevate your conference to new heights with our innovative and tailored web solutions, keeping you at the forefront of event technology.',
    price: '₹ 7000 onwards',
    features: [
      'Intuitive navigation for easy access to schedule, speakers, venue, and registration.',
      'Admin panel will be provided to the conference organisers for the dynamic updation of the website',
      'Responsive design for a seamless experience on various devices.  ',
      'Interactive program schedule detailing keynote speakers, sessions, workshops, and social events.  ',
      'Speaker profiles with comprehensive information on bios and presentation topics.    ',
      'Sponsorship section highlighting sponsors and exhibitors, outlining their involvement and benefits.',
    ],
    team: conferenceTeam,
  },
  {
    id: 2,
    icon: <BriefcaseIcon />,
    type: 'premium',

    title: 'Short Term Course Page with Certificate Module',
    description:
      'Our service caters to your unique needs, offering a robust and customizable webpage to bring your short-term courses to a wide audience. With our Certificate Module, our team helps in design and generation of digital verifiable certificates. The participants can earn verifiable certificates, adding a credible dimension to their achievements. The certificate includes a secure verification link, bolstering the integrity of the credential.',
    price: '₹ 2000 onwards',
    team: certificateTeam,
    features: [
      ' A robust and tailored webpage to showcase your short-term course details, catering to the unique needs of your audience.',
      'Admin panel will be provided to the organisers for dynamic content updation and to add participant details for generating digital certificate',
      'Expand the reach of your short-term courses by providing a platform that appeals to a diverse audience.',
      'A Certificate Module to design digital certificates for participants, adding a professional touch to their achievements.',
      "Enhance the credibility of the certificates by including a verification link, allowing third parties to easily verify the authenticity of the participants' achievements.",
      'Assistance in designing digital certificates, ensuring they meet industry standards and leave a lasting impression.',
    ],
  },
  {
    id: 3,
    icon: <AcademicCapIcon />,
    type: 'premium',
    title: 'Portfolio Websites',
    description:
      'We specialize in crafting visually stunning and functionally robust websites that showcase your work, talents, and achievements. From captivating visuals to intuitive navigation, our portfolio websites are designed to leave a lasting impression and effectively communicate your unique story. Let us bring your achievements to life online, creating a digital showcase that captivates and engages your audience.',
    price: '₹ 5000 onwards',
    features: [
      'Personal website to showcase your achievements, skills and collaborations to wider audience',
      'Admin panel will be provided to the client for the dynamic updation',
      'Responsive design for a seamless experience on various devices.  ',
      'Domain cost and maintenance cost will be recurring in nature and it is above the design cost of 5000/-',
    ],
  },
  {
    id: 4,
    icon: <GoCodeReview />,
    type: 'premium',
    title: 'Review Module',
    description:
      'We specialize in crafting visually stunning and functionally robust websites that showcase your work, talents, and achievements. From captivating visuals to intuitive navigation, our portfolio websites are designed to leave a lasting impression and effectively communicate your unique story. Let us bring your achievements to life online, creating a digital showcase that captivates and engages your audience.',
    price: '₹ 5000 onwards',
    features: [
      'Personal website to showcase your achievements, skills and collaborations to wider audience',
      'Admin panel will be provided to the client for the dynamic updation',
      'Responsive design for a seamless experience on various devices.  ',
      'Domain cost and maintenance cost will be recurring in nature and it is above the design cost of 5000/-',
    ],
  },
  {
    id: 5,
    icon: <AcademicCapIcon />,
    type: 'institute',
    title: 'Institute Time Table Module',
    description:
      "Timetable Module is aimed at reducing the manual work to a great extent in generating time table online and to digitally view and share the time table to various stakeholders. Streamline your scheduling process with our user-friendly interface, allowing you to create student, teacher, and room timetables in one go. The Timetable Module is designed to be compatible with various devices, promoting accessibility for administrators, teachers, and students alike. Additionally, we've integrated Google location information for classrooms, enhancing convenience and accessibility.",
    team: timeTableTeam,
  },
  {
    id: 6,
    icon: <WrenchScrewdriverIcon />,
    type: 'institute',
    title: "Management of NITJ's Official Website",
    images: [
      '/services/institute-website/4_73301.webp',
      '/services/institute-website/2_8245.webp',
      '/services/institute-website/3_22930.webp',
      
      '/services/institute-website/5_59377.webp',
      '/services/institute-website/6_36624.webp',
      '/services/institute-website/7_48718.webp',
      '/services/institute-website/8_87164.webp',
      '/services/institute-website/9_24382.webp',
      '/services/institute-website/10_26049.webp',
      '/services/institute-website/11_51058.webp',
      '/services/institute-website/12_95830.webp',
      '/services/institute-website/13_72439.webp',
    ],
    description:
      "This service is under the Website Development and Management Committe (WDMC) with multiple groups mentored by different faculty members of the institute. We specialize in providing tailored solutions that streamline the maintenance of our institute's website, ensuring seamless functionality and up-to-date information. From academic program updates and event announcements to faculty profiles and student resources, we offered an intuitive interface for effortless content management. Our services extend beyond mere website maintenance; we empower you to showcase the dynamic spirit of your institute, fostering engagement and connectivity.",
    team: 'https://www.nitj.ac.in/admin/students.html',
  },
  {
    id: 7,
    icon: <Cog6ToothIcon />,
    type: 'institute',
    title: 'FE Course & Hackathons',
    description:
      'WDM Club at our esteemed institution has taken a pioneering step to offer a unique foundation elective course for first-year students. This course aims to provide an immersive and comprehensive introduction to web development, a critical technology in the field of software engineering which is the future!. The foundation elective course offered is designed to cater to students from diverse academic backgrounds. Inaddition to this, Through workshops, and hackathons, we aim to empower our members with the knowledge and practical experience necessary for success in the dynamic field of software development.',
  },
  {
    id: 8,
    icon: <GiPodiumWinner />,
    type: 'institute',
    title: 'Success Stories',
    description:
      'WDM Club at our esteemed institution has taken a pioneering step to offer a unique foundation elective course for first-year students. This course aims to provide an immersive and comprehensive introduction to web development, a critical technology in the field of software engineering which is the future!. The foundation elective course offered is designed to cater to students from diverse academic backgrounds. Inaddition to this, Through workshops, and hackathons, we aim to empower our members with the knowledge and practical experience necessary for success in the dynamic field of software development.',
  },
];
