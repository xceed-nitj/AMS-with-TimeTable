import clsx from 'clsx';
const SectionHeader = ({ title, centered }) => {
  return (
    <h1
      className={clsx(
        'tw-text-4xl tw-font-extrabold tw-text-gray-900 md:tw-text-4xl lg:tw-text-4xl dark:tw-text-white tw-mb-5',
        centered ? 'tw-text-center' : 'md:tw-text-left'
      )}
    >
      {title.split(' ')[0]}{' '}
      <span className="tw-underline tw-underline-offset-4 tw-decoration-4 tw-decoration-cyan-600 dark:tw-decoration-cyan-300">
        {title.split(' ').slice(1).join(' ')}
      </span>
    </h1>
  );
};

export default SectionHeader;
