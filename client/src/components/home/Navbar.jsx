import { Bars3Icon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import { Text, Button, Flex } from '@chakra-ui/react';
import NavBar from '../../reviewmodule/components/NavBar';

export default function Navbar() {
  const [navbarOpen, setNavbarOpen] = useState(false);

  const apiUrl = getEnvironment();

  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const userdetail = await response.json();
        return userdetail;
      } catch (error) {
        console.error('Error fetching user details:', error.message);
        throw error;
      }
    };

    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setUserDetails(userDetails);
        setIsAuthenticated(true);
      } catch (error) {
        // Handle error (e.g., display an error message or redirect to an error page)
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [apiUrl]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/getuser/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };


const publicPaths = ['/', '/login', '/classrooms', '/timetable','/tt/masterdata','/prm/register','/prm/emailverification'  ];

useEffect(() => {
  const isPublicPath = publicPaths.includes(location.pathname) || location.pathname.startsWith('/services/') || location.pathname.startsWith('/cm/c/')

  if (!isLoading && !isAuthenticated && !isPublicPath) {
    navigate('/login');
  }
}, [isLoading, isAuthenticated, navigate, location.pathname]);


  const excludedRoutes = ['/login', '/cm/c'];

  const isExcluded = excludedRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (isLoading || isExcluded) {
    return null;
  }

  const isPRMPath = location.pathname.startsWith('/prm');

  if (isPRMPath) return <NavBar />;

  return (
    <nav
      className={`tw-bg-gray-900 tw-sticky tw-h-15 tw-top-0  tw-border-gray-700 ${
        navbarOpen ? 'tw-h-screen' : ''
      }`}
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
          onClick={() => setNavbarOpen(!navbarOpen)}
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
          className={clsx(
            'tw-w-full md:tw-block md:tw-w-auto',
            navbarOpen ? 'tw-block' : 'tw-hidden'
          )}
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

            {isAuthenticated ? (
              <li>
                <a
                  href="/userroles"
                  className="tw-block tw-py-2 tw-px-3 tw-text-cyan-300 tw-rounded md:tw-bg-transparent md:tw-text-cyan-300 md:tw-p-0 hover:tw-text-cyan-500"
                  aria-current="page"
                >
                  Dashboard
                </a>
              </li>
            ) : null}
            <li>
              <a
                href="/#services"
                className="tw-block tw-py-2 tw-px-3 tw-text-white tw-rounded hover:tw-text-cyan-300 md:hover:tw-bg-transparent md:tw-border-0 md:hover:tw-text-cyan-600 md:tw-p-0 dark:tw-text-white md:dark:hover:tw-text-cyan-600 dark:hover:tw-bg-gray-700 md:dark:hover:tw-bg-transparent"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="/#about"
                className="tw-block tw-py-2 tw-px-3 tw-text-white tw-rounded hover:tw-text-cyan-300 md:hover:tw-bg-transparent md:tw-border-0 md:hover:tw-text-cyan-600 md:tw-p-0 dark:tw-text-white md:dark:hover:tw-text-cyan-600 dark:hover:tw-bg-gray-700 md:dark:hover:tw-bg-transparent"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/#team"
                className="tw-block tw-py-2 tw-px-3 tw-text-white tw-rounded hover:tw-text-cyan-300 md:hover:tw-bg-transparent md:tw-border-0 md:hover:tw-text-cyan-600 md:tw-p-0 dark:tw-text-white md:dark:hover:tw-text-cyan-600 dark:hover:tw-bg-gray-700 md:dark:hover:tw-bg-transparent"
              >
                Team
              </a>
            </li>
            <li>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
                >
                  Login
                </Link>
              ) : null}
              {isAuthenticated && (
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
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
