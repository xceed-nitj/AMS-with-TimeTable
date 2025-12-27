import React from 'react';

const Footer = () => {
  return (
    <footer className="tw-bg-white tw-shadow dark:tw-bg-gray-900 tw-p-4 tw-mt-10">
      <div className="tw-w-full tw-max-w-screen-xl tw-mx-auto tw-p-4">
        <div className="tw-flex tw-justify-center tw-mb-8">
            
            <div className="tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl tw-p-6 tw-shadow-md tw-flex tw-flex-col tw-items-center tw-justify-center">
                <h3 className="tw-text-xl tw-font-bold tw-text-center tw-mb-4 tw-text-gray-800 dark:tw-text-white">
                    Global Visitors
                </h3>
                <a href="https://info.flagcounter.com/aWAg" target="_blank" rel="noopener noreferrer">
                    <img 
                        src="https://s05.flagcounter.com/count2/aWAg/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_1/flags_0/percent_0/" 
                        alt="Flag Counter" 
                        className="tw-rounded-lg"
                    />
                </a>
            </div>

        </div>
        <div className="tw-border-t tw-border-gray-200 dark:tw-border-gray-700 tw-pt-4">
            <span className="tw-block tw-text-sm tw-text-gray-500 tw-text-center dark:tw-text-gray-400">
            &copy; 2023 - 24{' '}
            <a href="https://xceed.nitj.ac.in/" className="hover:tw-underline">
                XCEED-NITJ &trade;
            </a>
            . All Rights Reserved.
            </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;