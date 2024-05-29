import React from 'react'
import { classNames } from '../utils/tailwindUtils'
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from "react-router-dom";
const navigation = [
  { name: 'Home', href: 'home' },
  { name: 'Speakers', href: 'speakers' },
  { name: 'Committees', href: 'committee' },
  { name: 'Sponsors', href: 'sponsors' },
  { name: 'Awards', href: 'awards' },
  { name: 'Announcements', href: 'announcement' },
  { name: 'Contacts', href: 'contact' },
  { name: 'Images', href: 'images' },
  { name: 'Event Dates', href: 'eventdates' },
  { name: 'Events', href: 'events' },
  { name: 'Locations', href: 'locations' },
  { name: 'Participants', href: 'participants' },
  { name: 'Navbar', href: 'navbar' },
  { name: 'Sponsorship Rates', href: 'sponsorship-rates' },
  { name: 'Souvenir', href: 'souvenir' },
  { name: 'Accomodation', href: 'accomodation' },
  { name: 'Common Template', href: 'commontemplate' },

];

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation();
  const navigate = useNavigate();
  const [currentNavigation, setCurrentNavigation] = useState(navigation);

  useEffect(() => {
    // Update the "current" property of navigation items based on the current route
    const updatedNavigation = navigation.map((item) => ({
      ...item,
      current: location.pathname.endsWith(item.href),
    }));

    setCurrentNavigation(updatedNavigation);
  }, [location.pathname]);

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as='div'
            className='tw-relative tw-top-10  tw-z-20 lg:tw-hidden'
            onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter='transition-opacity ease-linear duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='transition-opacity ease-linear duration-300'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'>
              <div className='tw-fixed tw-inset-0 tw-bg-gray-900/80' />
            </Transition.Child>

            <div className='tw-fixed tw-inset-0 tw-mt-32 md:tw-mt-28 tw-flex'>
              <Transition.Child
                as={Fragment}
                enter='transition ease-in-out duration-300 transform'
                enterFrom='-translate-x-full'
                enterTo='translate-x-0'
                leave='transition ease-in-out duration-300 transform'
                leaveFrom='translate-x-0'
                leaveTo='-translate-x-full'>
                <Dialog.Panel className='tw-relative tw-mr-16 tw-flex tw-w-full tw-max-w-xs tw-flex-1'>
                  <Transition.Child
                    as={Fragment}
                    enter='ease-in-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in-out duration-300'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'>
                    <div className='tw-absolute   tw-left-full tw-top-0 tw-flex  tw-justify-center tw-pt-5'>
                      <button
                        type='button'
                        className='tw--m-2.5 tw-p-2.5'
                        onClick={() => setSidebarOpen(false)}>
                        <span className='tw-sr-only'>Close sidebar</span>
                        <XMarkIcon
                          className='tw-h-6 tw-w-6 tw-text-white'
                          aria-hidden='true'
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className='tw-flex tw-grow  tw-flex-col tw-gap-y-5 tw-overflow-y-auto tw-bg-white tw-px-6 tw-pb-2'>
                    <Link to={"/"}>
                      <div className='tw-flex tw-h-16 tw-shrink-0 tw-items-center'>
                        <img
                          className='tw-h-8 tw-w-auto'
                          src='/confSidebarLogo.png'
                          alt='XCEED '
                        />
                      </div>
                    </Link>
                    <nav className='tw-flex tw-flex-1 tw-flex-col'>
                      <ul role='list' className='tw-flex tw-flex-1 tw-flex-col tw-list-none tw-gap-y-7'>
                        <li>
                          <ul role='list' className='tw--mx-2 tw-list-none tw-space-y-1'>
                            {currentNavigation.map((item) => (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className={classNames(
                                    item.current
                                      ? 'tw-bg-gray-50 tw-text-blue-600'
                                      : 'tw-text-gray-700 tw-hover:text-blue-600 tw-hover:bg-gray-50',
                                    'tw-group tw-flex tw-gap-x-3 tw-rounded-md tw-p-2 tw-text-sm tw-leading-6 tw-font-semibold'
                                  )}>
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className='tw-hidden lg:tw-fixed lg:tw-inset-y-0  lg:tw-z-50 lg:tw-mt-14  lg:tw-flex lg:tw-flex-col tw-w-72 '>
          <div className='tw-flex tw-grow tw-flex-col tw-gap-y-5  tw-overflow-y-auto tw-border-r tw-border-gray-200 tw-bg-white tw-px-6 tw-py-5'>
            <div className='tw-flex tw-h-16 tw-shrink-0 tw-items-center'>
              <img
                className='tw-h-8 tw-w-auto'
                src='/confSidebarLogo.png'
                alt='Xceed'
              />
            </div>
            <nav className='tw-flex tw-flex-1 tw-flex-col'>
              <ul role='list' className='tw-flex tw-flex-1 tw-flex-col tw-list-none tw-gap-y-7'>
                <li>
                  <ul role='list' className='tw--mx-2 tw-list-none tw-space-y-1'>
                    {currentNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            item.current
                              ? 'tw-bg-gray-50 tw-text-blue-600'
                              : 'tw-text-gray-700 tw-hover:text-blue-600 tw-hover:bg-gray-50 tw-group tw-flex tw-gap-x-3 tw-rounded-md tw-p-2 tw-text-sm tw-leading-6 tw-font-semibold',
                            'group tw-flex tw-gap-x-3 tw-rounded-md tw-p-2 tw-text-sm tw-leading-6 tw-font-semibold'
                          )}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className='tw-sticky tw-top-0 tw-z-40 tw-flex tw-items-center tw-gap-x-6 tw-bg-white tw-px-4 tw-py-4 tw-shadow-sm sm:tw-px-6 lg:tw-hidden'>
          <button
            type='button'
            className='tw--m-2.5 tw-p-2.5 tw-text-gray-700 lg:tw-hidden'
            onClick={() => setSidebarOpen(true)}>
            <span className='tw-sr-only'>Open sidebar</span>
            <Bars3Icon className='tw-h-6 tw-w-6' aria-hidden='true' />
          </button>
        </div>
      </div>

      {/* <div className='tw-float-right '>
        <button type="button" onClick={() => navigate("/cf")} className="tw-text-white tw-bg-gradient-to-r tw-from-blue-500 tw-via-blue-600 tw-to-blue-700 tw-hover:bg-gradient-to-br tw-focus:ring-4 tw-focus:outline-none tw-focus:ring-blue-300 tw-dark:focus:ring-blue-800 tw-shadow-lg tw-shadow-blue-500/50 tw-dark:shadow-lg tw-dark:shadow-blue-800/80 tw-font-medium tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center  tw-m-5 mr-5 md:tw-mr-20 ">All Conferences</button>
      </div> */}

      <Outlet />
    </>
  )
}

export default Sidebar;
