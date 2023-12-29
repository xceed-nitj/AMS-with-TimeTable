const Footer = () => {
  return (
    <footer className="tw-bg-white tw-shadow dark:tw-bg-gray-900 tw-p-4">
      <div className="tw-w-full tw-max-w-screen-xl tw-mx-auto tw-p-4 md:tw-py-8">
        <span className="tw-block tw-text-sm tw-text-gray-500 tw-text-center dark:tw-text-gray-400">
          &copy; 2023{" "}
          <a href="https://xceed.nitj.ac.in/" className="hover:tw-underline">
            XCEED-NITJ &trade;
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
