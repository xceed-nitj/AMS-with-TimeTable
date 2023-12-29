import React from 'react'
import { classNames } from '../utils/tailwindUtils'
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, Outlet, useHref, useParams } from 'react-router-dom';
import { useNavigate, useLocation } from "react-router-dom";

const navigation = [
  { name: 'Home', href: 'home' },
  { name: 'Speakers', href: 'speakers' },
  { name: 'Committees', href: 'committee' },
  { name: 'Sponsorship', href: 'sponsorship' },
  { name: 'Awards', href: 'awards' },
  { name: 'Announcements', href: 'announcement' },
  { name: 'Contacts', href: 'contact' },
  { name: 'Images', href: 'images' },
  { name: 'Event Dates', href: 'eventdates' },
  { name: 'Locations', href: 'locations' },
  { name: 'Participants', href: 'participants' },
  { name: 'Navbar', href: 'navbar' },
  { name: 'Generate Certificate', href: 'certificate' },
];

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation();
  const navigate = useNavigate();
  const [currentNavigation, setCurrentNavigation] = useState(navigation);
  const Href = useHref();
  const isCerttificate = Href.slice(-11) === "certificate";


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
      {!isCerttificate && <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as='div'
            className='relative z-50 lg:hidden'
            onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter='transition-opacity ease-linear duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='transition-opacity ease-linear duration-300'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'>
              <div className='fixed inset-0 bg-gray-900/80' />
            </Transition.Child>

            <div className='fixed inset-0 flex'>
              <Transition.Child
                as={Fragment}
                enter='transition ease-in-out duration-300 transform'
                enterFrom='-translate-x-full'
                enterTo='translate-x-0'
                leave='transition ease-in-out duration-300 transform'
                leaveFrom='translate-x-0'
                leaveTo='-translate-x-full'>
                <Dialog.Panel className='relative mr-16 flex w-full max-w-xs flex-1'>
                  <Transition.Child
                    as={Fragment}
                    enter='ease-in-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in-out duration-300'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'>
                    <div className='absolute left-full top-0 flex w-16 justify-center pt-5'>
                      <button
                        type='button'
                        className='-m-2.5 p-2.5'
                        onClick={() => setSidebarOpen(false)}>
                        <span className='sr-only'>Close sidebar</span>
                        <XMarkIcon
                          className='h-6 w-6 text-white'
                          aria-hidden='true'
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2'>
                    <Link to={"/"}>
                      <div className='flex h-16 shrink-0 items-center'>
                        <img
                          className='h-8 w-auto'
                          src='https://tailwindui.com/img/logos/mark.svg?color=emerald&shade=600'
                          alt='Your Company'
                        />
                      </div>
                    </Link>
                    <nav className='flex flex-1 flex-col'>
                      <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                        <li>
                          <ul role='list' className='-mx-2 space-y-1'>
                            {currentNavigation.map((item) => (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className={classNames(
                                    item.current
                                      ? 'bg-gray-50 text-emerald-600'
                                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50',
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
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
        <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col'>
          <div className='flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-5'>
            <div className='flex h-16 shrink-0 items-center'>
              <img
                className='h-8 w-auto'
                src='https://tailwindui.com/img/logos/mark.svg?color=emerald&shade=600'
                alt='Your Company'
              />
            </div>
            <nav className='flex flex-1 flex-col'>
              <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                <li>
                  <ul role='list' className='-mx-2 space-y-1'>
                    {currentNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-gray-50 text-emerald-600'
                              : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
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

        <div className='sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden'>
          <button
            type='button'
            className='-m-2.5 p-2.5 text-gray-700 lg:hidden'
            onClick={() => setSidebarOpen(true)}>
            <span className='sr-only'>Open sidebar</span>
            <Bars3Icon className='h-6 w-6' aria-hidden='true' />
          </button>
          <div className='  flex-1 text-sm font-semibold leading-6 text-gray-900'>
            <div><Link to={"/"}>Dashboard</Link></div>

          </div>
        </div>

      </div>}
      <Outlet />
    </>
  )
}

export default Sidebar
