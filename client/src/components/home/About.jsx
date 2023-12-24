import SectionHeader from "../ui/home/SectionHeader";

const About = () => {
  return (
    <section id="about" className="tw-bg-white dark:tw-bg-gray-900">
      <div className="tw-gap-16 tw-items-center tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl lg:tw-grid lg:tw-grid-cols-2 lg:tw-py-16 lg:tw-px-6">
        <div className="tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400">
          <SectionHeader title="About Xceed" />
          <p className="tw-mb-4">
            Xceed is the premier technical group of NIT Jalandhar under Website Development and Management Club, driven by a
            passion for technology and a commitment to excellence. Established
            with the aim of fostering a culture of innovation and skill
            development in coding, Xceed has been at the forefront of transforming
            ideas into impactful projects that benefit the entire college
            community.
          </p>
          <p>
            Xceed envisions a future where technology serves as a catalyst for
            positive change. Our mission is to cultivate a spirit of innovation,
            collaboration, and continuous learning among our members, leading to
            the development of cutting-edge projects that make a lasting impact.
          </p>
          <section className="tw-bg-white dark:tw-bg-gray-900">
            <div className="tw-max-w-screen-xl tw-py-8 tw-mx-auto tw-text-center lg:tw-py-8">
              <dl className="tw-grid tw-justify-items-start tw-max-w-screen-md tw-gap-8 tw-mx-auto tw-text-gray-900 sm:tw-grid-cols-3 dark:tw-text-white">
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
                  <dt className="tw-mb-2 tw-text-3xl md:tw-text-4xl tw-font-extrabold">
                    30+
                  </dt>
                  <dd className="tw-font-light tw-text-gray-500 dark:tw-text-gray-400">
                    developers
                  </dd>
                </div>
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
                  <dt className="tw-mb-2 tw-text-3xl md:tw-text-4xl tw-font-extrabold">
                    50+
                  </dt>
                  <dd className="tw-font-light tw-text-gray-500 dark:tw-text-gray-400">
                    contributors
                  </dd>
                </div>
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
                  <dt className="tw-mb-2 tw-text-3xl md:tw-text-4xl tw-font-extrabold">
                    10+
                  </dt>
                  <dd className="tw-font-light tw-text-gray-500 dark:tw-text-gray-400">
                    projects
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-8">
          <img
            className="tw-w-full tw-rounded-lg"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-2.png"
            alt="office content 1"
          />
          <img
            className="tw-mt-4 tw-w-full lg:tw-mt-10 tw-rounded-lg"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-1.png"
            alt="office content 2"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
