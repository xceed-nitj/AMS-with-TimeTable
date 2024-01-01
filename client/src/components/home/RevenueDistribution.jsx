import SectionHeader from '../ui/home/SectionHeader';

export default function RevenueDistribution() {
  return (
    <>
      {/* Statistics Section: Simple with Title */}
      <div className="tw-bg-white dark:tw-bg-gray-900 dark:tw-text-gray-100">
        <div className="container tw-mx-auto tw-space-y-12 tw-px-4 tw-py-16 lg:tw-px-8 lg:tw-py-32 xl:tw-max-w-7xl">
          {/* Heading */}
          <div className="tw-text-center">
            <SectionHeader title="Revenue Distribution" centered />
            <h3 className="tw-mx-auto tw-text-xl tw-font-medium tw-leading-relaxed tw-text-gray-700 lg:tw-w-2/3 dark:tw-text-gray-300">
              The revenue generated from the projects is distributed among the
              students, club and institute. We believe in giving back to the
              community.
            </h3>
          </div>
          {/* END Heading */}

          {/* Stats */}
          <div className="tw-grid tw-grid-cols-1 tw-divide-y tw-text-center sm:tw-grid-cols-3 sm:tw-divide-x sm:tw-divide-y-0 dark:divide-gray-700/75">
            <dl className="tw-space-y-1 tw-px-5 tw-py-8">
              <dt className="tw-text-4xl tw-text-cyan-400 tw-font-extrabold">
                35%
              </dt>
              <dd className="tw-text-2xl tw-font-semibold tw-uppercase tw-tracking-wide tw-text-white">
                Students
              </dd>
              (Students involved in the projects will get 35% of amount
              generated)
            </dl>

            <dl className="tw-space-y-1 tw-px-5 tw-py-8">
              <dt className="tw-text-4xl tw-font-extrabold">35%</dt>
              <dd className="tw-text-2xl tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-600 dark:tw-text-gray-400">
                WDM Club
              </dd>
              (This amount will go back to the students in terms of competition
              prize money)
            </dl>
            <dl className="tw-space-y-1 tw-px-5 tw-py-8">
              <dt className="tw-text-4xl tw-font-extrabold">30%</dt>
              <dd className="tw-text-2xl tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-600 dark:tw-text-gray-400">
                Institute
              </dd>
              (As we are using institute server for various works, this
              percentage has been contributed to the institute.)
            </dl>
          </div>

          <h3 className="tw-mx-auto tw-text-xl tw-font-medium tw-leading-relaxed tw-text-gray-700 lg:tw-w-2/3 dark:tw-text-gray-300">
            The revenue generated will be shared with students at the end of the
            academic year
          </h3>

          {/* END Stats */}
        </div>
      </div>
      {/* END Statistics Section: Simple with Title */}
    </>
  );
}
