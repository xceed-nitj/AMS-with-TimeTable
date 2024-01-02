import clsx from 'clsx';
// import useMousePosition from '../../../hooks/useMousePosition';
import { useMouse } from '@uidotdev/usehooks';

const TeamCard = ({ name, designation, image, github, linkedin, variant }) => {
  const [mouse, ref] = useMouse();
  const xIntersecting = mouse.elementX > 0;
  const yIntersecting = mouse.elementY > 0;
  const isIntersecting = xIntersecting && yIntersecting;

  return (
    <div
      ref={ref}
      className={clsx(
        'tw-relative tw-flex tw-flex-col tw-items-center tw-border tw-rounded-lg tw-shadow sm:tw-flex-row md:tw-max-w-xl tw-border-gray-700 tw-bg-gray-800 tw-gap-3 tw-overflow-hidden',
        variant === 'faculty' && 'tw-border-cyan-400 tw-bg-transparent'
      )}
    >
      {/* Hover element */}
      <div
        className={clsx(
          'tw-h-14 tw-w-14 tw-rounded-full tw-absolute tw-bg-cyan-400 tw-mix-blend-screen tw-blur-xl tw-top-1 tw-right-1 tw-opacity-0 tw-transition-transform tw-pointer-events-none',
          isIntersecting && 'tw-scale-[2] tw-opacity-100'
        )}
        style={{
          left: `${mouse.elementX}px`,
          top: `${mouse.elementY}px`,
        }}
      ></div>
      <img
        className="tw-object-cover tw-w-full lg:tw-w-[40%] tw-rounded-t-lg tw-h-full  md:tw-w-[40%] md:tw-rounded-none md:tw-rounded-s-lg"
        src={image}
        alt=""
      />
      <div className="tw-flex tw-flex-col tw-text-center md:tw-text-left tw-mt-2">
        <h5 className="tw-mb-1 tw-text-xl xl:tw-text-2xl tw-font-medium tw-text-gray-900 dark:tw-text-white">
          {name}
        </h5>
        <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400">
          {designation}
        </p>
        <div className="tw-flex tw-items-center md:tw-justify-start tw-justify-center tw-mt-3 tw-mb-5 tw-space-x-5">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-block tw-text-gray-400"
          >
            <span className="tw-sr-only">GitHub</span>
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth={0}
              viewBox="0 0 496 512"
              className="tw-w-6 tw-h-6 tw-text-gray-400 hover:tw-text-white tw-transition-all"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
            </svg>
          </a>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-block tw-text-gray-400"
          >
            <span className="tw-sr-only">Linkedin</span>
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth={0}
              viewBox="0 0 448 512"
              className="tw-w-6 tw-h-6 tw-text-gray-400 hover:tw-text-sky-400 tw-transition-all"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
