import React from 'react';
import { classNames } from '../utils/tailwindUtils';
import { Link, Outlet } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const navigation = [
  { name: 'Home', href: 'home', color: 'tw-bg-blue-100' },
  { name: 'Speakers', href: 'speakers', color: 'tw-bg-purple-100' },
  { name: 'Committees', href: 'committee', color: 'tw-bg-green-100' },
  { name: 'Sponsors', href: 'sponsors', color: 'tw-bg-yellow-100' },
  { name: 'Awards', href: 'awards', color: 'tw-bg-red-100' },
  { name: 'Announcements', href: 'announcement', color: 'tw-bg-indigo-100' },
  { name: 'Contacts', href: 'contact', color: 'tw-bg-pink-100' },
  { name: 'Images', href: 'images', color: 'tw-bg-teal-100' },
  { name: 'Event Dates', href: 'eventdates', color: 'tw-bg-orange-100' },
  { name: 'Events', href: 'events', color: 'tw-bg-cyan-100' },
  { name: 'Locations', href: 'locations', color: 'tw-bg-emerald-100' },
  { name: 'Participants', href: 'participants', color: 'tw-bg-violet-100' },
  { name: 'Navbar', href: 'navbar', color: 'tw-bg-rose-100' },
  { name: 'Sponsorship Rates', href: 'sponsorship-rates', color: 'tw-bg-amber-100' },
  { name: 'Souvenir', href: 'souvenir', color: 'tw-bg-lime-100' },
  { name: 'Accommodation', href: 'accomodation', color: 'tw-bg-sky-100' },
  { name: 'Common Template', href: 'commontemplate', color: 'tw-bg-slate-100' },
];

const Sidebar = () => {
  const location = useLocation();

  const getCurrentTab = () => {
    const currentPath = location.pathname.split('/').pop();
    return currentPath || 'home';
  };

  const currentTab = getCurrentTab();

  return (
    <>
    {/* Header Section with Conference Name */}
      <div className="tw-bg-gray-50 tw-border-b tw-border-gray-200 tw-sticky tw-top-0 tw-z-50">
        <div className="tw-w-full tw-px-4 sm:tw-px-6 lg:tw-px-8">
          <div className="tw-py-6 tw-flex tw-justify-center tw-items-center">
            <div className="tw-text-2xl lg:tw-text-3xl tw-font-extrabold tw-text-gray-800">
              Conference Name
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs Navigation */}
      <div className="tw-bg-gray-50 tw-border-b tw-border-gray-200 tw-sticky tw-top-[64px] tw-z-40">
        <div className="tw-w-full tw-px-4 sm:tw-px-6 lg:tw-px-8">
          <div className="tw-py-4 tw-relative lg:tw-flex lg:tw-items-center">
            {/* X Logo */}
            <div className="tw-flex tw-justify-center lg:tw-justify-start">
              <Link
                to="/"
                className="tw-flex tw-items-center"
                style={{ minWidth: 48 }}
              >
                <img
                  className="tw-h-8 tw-w-auto"
                  src="/confSidebarLogo.png"
                  alt="XCEED"
                />
              </Link>
            </div>
            {/* Tabs */}
            <div className="tw-flex tw-flex-wrap tw-gap-0 tw-justify-center lg:tw-justify-start tw-mt-4 lg:tw-mt-0 lg:tw-ml-4">
              {navigation.map((item, idx) => {
                const isActive = currentTab === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      `${item.color} tw-text-gray-800`,
                      // Tab shape: only round top corners, no full rounding
                      'tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition-all tw-duration-200 tw-cursor-pointer tw-whitespace-nowrap',
                      'tw-border-t tw-border-l tw-border-r tw-border-b-0 tw-border-gray-300',
                      'tw-rounded-t-md',
                      // Active tab: bold border and shadow
                      isActive
                        ? 'tw-border-b-4 tw-border-b-blue-400 tw-shadow-sm tw-z-10'
                        : 'tw-border-b tw-border-b-gray-300 tw-z-0 tw-hover:tw-bg-gray-200'
                    )}
                    style={{
                      // Connect tabs visually by removing left border on the first tab
                      marginLeft: idx === 0 ? 0 : '-1px'
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="tw-w-full tw-px-0 tw-py-6">
        <Outlet />
      </div>
    </>
  );
};

export default Sidebar;
