import React from 'react';

const Footer = () => {
  return (
    <footer className="tw-bg-gradient-to-br tw-from-gray-900 tw-via-gray-800 tw-to-gray-900 tw-border-t tw-border-gray-700 tw-mt-20">
      <div className="tw-w-full tw-max-w-screen-xl tw-mx-auto tw-px-6 tw-py-12">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-12 tw-mb-8">
            <div className="tw-space-y-5">
                <h3 className="tw-text-xl tw-font-bold tw-text-white tw-mb-4 tw-border-l-4 tw-border-cyan-400 tw-pl-3">
                    Contact Us
                </h3>
                <div className="tw-space-y-3">
                    <div className="tw-flex tw-items-start tw-gap-3 tw-group">
                        <svg className="tw-w-5 tw-h-5 tw-text-cyan-400 tw-mt-0.5 tw-flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <a href="mailto:xceed@nitj.ac.in" className="tw-text-gray-300 hover:tw-text-cyan-400 tw-transition-colors tw-duration-300">
                            xceed@nitj.ac.in
                        </a>
                    </div>
                </div>
            </div>
            <div className="tw-space-y-5">
                <h3 className="tw-text-xl tw-font-bold tw-text-white tw-mb-4 tw-border-l-4 tw-border-cyan-400 tw-pl-3">
                    Quick Links
                </h3>
                <ul className="tw-space-y-3">
                    <li>
                        <a href="/timetable" className="tw-text-gray-300 hover:tw-text-cyan-400 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-2 tw-group">
                            <span className="tw-w-1.5 tw-h-1.5 tw-bg-cyan-400 tw-rounded-full group-hover:tw-w-2.5 tw-transition-all"></span>
                            Institute Timetable
                        </a>
                    </li>
                    <li>
                        <a href="#" className="tw-text-gray-300 hover:tw-text-cyan-400 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-2 tw-group">
                            <span className="tw-w-1.5 tw-h-1.5 tw-bg-cyan-400 tw-rounded-full group-hover:tw-w-2.5 tw-transition-all"></span>
                            Payment Link
                        </a>
                    </li>
                    <li>
                        <a href="/conference" className="tw-text-gray-300 hover:tw-text-cyan-400 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-2 tw-group">
                            <span className="tw-w-1.5 tw-h-1.5 tw-bg-cyan-400 tw-rounded-full group-hover:tw-w-2.5 tw-transition-all"></span>
                            Conference Module
                        </a>
                    </li>
                </ul>
            </div>
            <div className="tw-space-y-5">
                <div className="tw-bg-gray-800/50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-700 hover:tw-border-cyan-400/50 tw-transition-all tw-duration-300 tw-w-fit">
                    <a href="https://info.flagcounter.com/aWAg" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="https://s05.flagcounter.com/count2/aWAg/bg_1F2937/txt_FFFFFF/border_374151/columns_2/maxflags_10/viewers_0/labels_0/pageviews_1/flags_0/percent_0/" 
                            alt="Flag Counter" 
                            className="tw-rounded tw-shadow-lg"
                        />
                    </a>
                </div>
            </div>
        </div>
        <div className="tw-pt-8 tw-border-t tw-border-gray-700">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
                <p className="tw-text-gray-400 tw-text-sm tw-text-center">
                    &copy; 2023-24 <a href="https://xceed.nitj.ac.in/" className="tw-text-cyan-400 hover:tw-underline tw-font-semibold">XCEED-NITJ</a>™. All Rights Reserved.
                </p>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;