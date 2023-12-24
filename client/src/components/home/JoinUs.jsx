import SectionHeader from "../ui/home/SectionHeader";

const JoinUs = () => {
  return (
    <section id="join" className="tw-bg-white dark:tw-bg-gray-900">
      <div className=" tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl  lg:tw-py-16 lg:tw-px-6">
        <SectionHeader title="Join Us" />
        <div className="tw-gap-16 tw-items-center lg:tw-grid lg:tw-grid-cols-2">
          <div className="tw-font-light tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
            <p className="tw-mb-4">
            Embark on an exciting journey of growth and camaraderie by joining our student club! As a member, you'll have the opportunity to actively participate in a vibrant community that not only promotes academic excellence but also provides invaluable early services. Whether you're seeking mentorship, exclusive resources, or a platform to collaborate on innovative projects, our club is the ideal space for students eager to make the most of their educational experience. Join us in fostering a supportive environment where knowledge is shared, skills are honed, and lifelong connections are formed. Together, we're shaping the future and creating a dynamic community that empowers students to thrive in their academic pursuits and beyond. Join us and be a part of something extraordinary.
            </p>
          </div>
          <div className="">
            <h4 className="tw-mb-4 tw-text-2xl tw-font-extrabold tw-leading-none tw-tracking-tight tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-2xl lg:tw-text-2xl">
              Technologies we work with
            </h4>
            <ul className="tw-mb-4 tw-max-w-md tw-space-y-1 tw-text-gray-500 tw-list-disc tw-list-inside dark:tw-text-gray-400">
              <li>Node.Js</li>
              <li>React.Js</li>
              <li>Tailwind CSS</li>
              <li>Chakra UI</li>
              <li>Mongo DB</li>
            </ul>
            <p className="tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
              We expect students to have intermediate to advance experience in
              above technologies who are available between 6pm to 11pm on
              working days.
            </p>
            <p>
              If you want to be part of XCEED Community where you get built
              exciting applications, learn by doing and get support from other
              developers mail us your resume at{" "}
              <span className="tw-text-cyan-600  dark:tw-text-cyan-300">
                xceed@nitj.ac.in
              </span>
            </p>

          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinUs;
