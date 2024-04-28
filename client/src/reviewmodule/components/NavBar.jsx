import { Button, Flex } from '@chakra-ui/react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
function NavBar() {
  return (
    // <header className="bg-slate-200 shadow-md">
    //   <div className="flex justify-between p-3 items-center mx-auto max-w-6xl">
    //     <Link to="/">
    //       <h1 className="text-sm font-bold sm:text-xl flex flex-wrap">
    //         <span className="font-semibold text-[#10152b]">NITJ</span>
    //         <span className="text-[#10152b]font-semibold">Conference</span>
    //       </h1>
    //     </Link>

    //     <ul className=" items-center gap-4 hidden sm:flex">
    //       <Link to="/">
    //         <li className="text-[#10152b]hover:underline">Home</li>
    //       </Link>
    //       <Link to="/author">
    //         <li className="text-[#10152b]hover:underline">Author</li>
    //       </Link>
    //       <Link to="/editor">
    //         <li className="text-[#10152b]hover:underline">Editor</li>
    //       </Link>
    //     </ul>
    //   </div>
    // </header>
    <nav
      className={`tw-bg-gray-900 tw-sticky tw-h-15 tw-top-0  tw-border-gray-700`}
      style={{ zIndex: 9999 }}
    >
      <div className="tw-max-w-screen-xl tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-mx-auto tw-p-4">
        <Link
          to="/"
          className="tw-flex tw-items-center tw-space-x-3 rtl:tw-space-x-reverse"
        >
          <img src="/clublogo.png" className="tw-h-8" alt="Xceed Logo" />
          {/* <span class="tw-self-center tw-text-2xl tw-font-semibold tw-whitespace-nowrap dark:tw-text-white">Xceed</span> */}
        </Link>
        <button
          data-collapse-toggle="navbar-default"
          type="button"
          className="tw-inline-flex tw-items-center tw-p-2 tw-w-10 tw-h-10 tw-justify-center tw-text-sm tw-text-gray-500 tw-rounded-lg md:tw-hidden hover:tw-bg-gray-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gray-200 dark:tw-text-gray-400 dark:hover:tw-bg-gray-700 dark:focus:tw-ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded="false"
        >
          <span className="tw-sr-only">Open main menu</span>
          <Bars3Icon className="tw-w-6 tw-h-6" />
        </button>
        <div
          className={clsx('tw-w-full md:tw-block md:tw-w-auto')}
          id="navbar-default"
        >
          <ul className="tw-font-medium tw-flex tw-flex-col tw-items-center tw-p-4 md:tw-p-0 tw-mt-4 tw-border tw-rounded-lg tw-space-y-5 md:tw-space-y-0 md:tw-flex-row md:tw-space-x-8 rtl:tw-space-x-reverse md:tw-mt-0 md:tw-border-0 tw-bg-gray-900 tw-border-gray-700 tw-list-none">
            <li>
              <a
                href="/"
                className="tw-block tw-py-2 tw-px-3 tw-text-cyan-300 tw-rounded md:tw-bg-transparent md:tw-text-cyan-300 md:tw-p-0 hover:tw-text-cyan-500"
                aria-current="page"
              >
                Home
              </a>
            </li>

            {/* {isAuthenticated ? (
              <li>
                <a
                  href="/userroles"
                  className="tw-block tw-py-2 tw-px-3 tw-text-cyan-300 tw-rounded md:tw-bg-transparent md:tw-text-cyan-300 md:tw-p-0 hover:tw-text-cyan-500"
                  aria-current="page"
                >
                  Dashboard
                </a>
              </li>
            ) : null} */}
            <li>
              <a
                href="/prm/editor"
                className="tw-block tw-py-2 tw-px-3 tw-text-white tw-rounded hover:tw-text-cyan-300 md:hover:tw-bg-transparent md:tw-border-0 md:hover:tw-text-cyan-600 md:tw-p-0 dark:tw-text-white md:dark:hover:tw-text-cyan-600 dark:hover:tw-bg-gray-700 md:dark:hover:tw-bg-transparent"
              >
                Editor
              </a>
            </li>
            <li>
              <a
                href="/prm/author"
                className="tw-block tw-py-2 tw-px-3 tw-text-white tw-rounded hover:tw-text-cyan-300 md:hover:tw-bg-transparent md:tw-border-0 md:hover:tw-text-cyan-600 md:tw-p-0 dark:tw-text-white md:dark:hover:tw-text-cyan-600 dark:hover:tw-bg-gray-700 md:dark:hover:tw-bg-transparent"
              >
                Author
              </a>
            </li>
            <li>
              <Link
                to="/prm/login"
                className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
              >
                Login
              </Link>
              {/* {isAuthenticated && (
                <>
                  {userDetails && (
                    <Flex align={'center'} gap={2}>
                      <Text fontSize="sm" color="orange">
                        {userDetails.user.email}
                      </Text>

                      <Button
                        colorScheme="white"
                        variant={'outline'}
                        size="sm"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </Flex>
                  )}
                </>
              )} */}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
