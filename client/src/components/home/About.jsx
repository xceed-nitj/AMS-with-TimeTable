import SectionHeader from '../ui/home/SectionHeader';

const About = () => {
  return (
    <section id="about" className="tw-bg-white dark:tw-bg-gray-900">
      <div className="tw-gap-16 tw-items-center tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl lg:tw-grid lg:tw-grid-cols-2 lg:tw-py-16 lg:tw-px-6">
        <div>
          <SectionHeader title="About XCEED" />
          <div className="tw-prose tw-prose-lg tw-text-gray-400 ">
            <p className="tw-text-justify">
              XCEED is the premier technical group of NIT Jalandhar works under
              Website Development and Management Club, driven by a passion for
              technology and a commitment to excellence. Established with the
              aim of fostering a culture of innovation and skill development in
              coding, Xceed has been at the forefront of transforming ideas into
              impactful projects that benefit the entire institute community.
            </p>
            <p className="tw-text-justify">
              XCEED envisions a future where technology serves as a catalyst for
              positive change. Our mission is to cultivate a spirit of
              innovation, collaboration, and continuous learning among our
              members, leading to the development of cutting-edge projects that
              make a lasting impact.
            </p>
          </div>
          <section className="tw-bg-white dark:tw-bg-gray-900">
            <div className="tw-max-w-screen-xl tw-py-8 tw-mx-auto tw-text-center lg:tw-py-8">
              <div className="tw-grid tw-grid-cols-1 tw-text-center sm:tw-grid-cols-3 tw-text-white">
                <dl className="tw-space-y-1 tw-py-8">
                  <dt className="tw-text-4xl tw-font-extrabold">30+</dt>
                  <dd className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-400">
                    Developers
                  </dd>
                </dl>
                <dl className="tw-space-y-1 tw-py-8">
                  <dt className="tw-text-4xl tw-font-extrabold">50+</dt>
                  <dd className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-600 dark:tw-text-gray-400">
                    Contributors
                  </dd>
                </dl>
                <dl className="tw-space-y-1 tw-py-8">
                  <dt className="tw-text-4xl tw-font-extrabold">10+</dt>
                  <dd className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-600 dark:tw-text-gray-400">
                    Projects
                  </dd>
                </dl>
              </div>
            </div>
          </section>
        </div>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-8 ">
          <img
            className="tw-w-full tw-rounded-lg tw-object-cover tw-h-[400px]"
            src="https://v1.nitj.ac.in/images/slider/13_79706.JPG"
            alt="office content 1"
          />
          <img
            className="tw-hidden md:tw-block tw-mt-4 tw-w-full lg:tw-mt-10 tw-rounded-lg tw-object-cover tw-h-[400px]"
            src="/home/classroom-01.webp"
            alt="office content 2"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
