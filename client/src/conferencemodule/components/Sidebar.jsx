import React, { useEffect, useState } from 'react';
import { classNames } from '../utils/tailwindUtils';
import { Link, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from "../../getenvironment";
import {
  FaHome, FaBars, FaFileAlt, FaBullhorn, FaImages,
  FaCalendarAlt, FaMicrophone, FaUpload, FaTimes, FaCreditCard, FaQuestionCircle,
  FaChevronLeft, FaChevronRight, FaThLarge, FaPalette,
} from 'react-icons/fa';

// Height of the global app navbar (sticky, z-index 9999) rendered above all routes.
const GLOBAL_NAV_HEIGHT = 64;

// Grouped navigation for the admin panel.
const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Home', href: 'home', icon: FaHome, iconColor: 'tw-text-sky-400' },
    ],
  },
  {
    title: 'Site & Content',
    items: [
      { name: 'Nav Menu', href: 'navmenu', icon: FaBars, iconColor: 'tw-text-indigo-400' },
      { name: 'Common Template', href: 'commontemplate', icon: FaFileAlt, iconColor: 'tw-text-cyan-400' },
      { name: 'Announcements', href: 'announcement', icon: FaBullhorn, iconColor: 'tw-text-violet-400' },
      { name: 'Images', href: 'images', icon: FaImages, iconColor: 'tw-text-teal-400' },
      { name: 'Event Dates', href: 'eventdates', icon: FaCalendarAlt, iconColor: 'tw-text-orange-400' },
      { name: 'Home Layout', href: 'homelayout', icon: FaThLarge, iconColor: 'tw-text-pink-400' },
      { name: 'Customisation', href: 'customisation', icon: FaPalette, iconColor: 'tw-text-fuchsia-400' },
    ],
  },
  {
    title: 'People',
    items: [
      { name: 'Speakers', href: 'speakers', icon: FaMicrophone, iconColor: 'tw-text-emerald-400' },
      { name: 'Speaker Layout', href: 'speakerlayout', icon: FaThLarge, iconColor: 'tw-text-teal-400' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { name: 'File Upload', href: '/fileupload', icon: FaUpload, iconColor: 'tw-text-slate-400' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const params = useParams();
  const IdConf = params.confid;
  const apiUrl = getEnvironment();
  const navigate = useNavigate();

  const [conferenceName, setConferenceName] = useState('Conference Name');
  const [timeLeft, setTimeLeft] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('confSidebarCollapsed') === 'true'
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('confSidebarCollapsed', String(!prev));
      return !prev;
    });
  };

  useEffect(() => {
    if (!startDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(startDate);
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  useEffect(() => {
    if (!IdConf) return;

    axios
      .get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, { withCredentials: true })
      .then(res => {
        setConferenceName(res.data?.confName || 'Conference Name');
        setStartDate(res.data?.confStartDate || null);
      })
      .catch(err => {
        setConferenceName('Conference Name');
        console.error('Failed to fetch conference:', err);
      });
  }, [IdConf, apiUrl]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentTab = location.pathname.split('/').pop() || 'home';

  // isCompact: icon-only rail on desktop. The mobile drawer is always full width.
  // The outer overflow-y-auto is a fallback: if header + footer alone exceed a
  // short viewport, the whole sidebar scrolls so nothing is unreachable.
  const renderSidebarInner = (isCompact) => (
    <div className="tw-flex tw-flex-col tw-overflow-y-auto"
      style={{ height: '100%', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)' }}>

      {/* Conference title + collapse toggle */}
      <div className={classNames('tw-flex-shrink-0 tw-border-b tw-border-white/10', isCompact ? 'tw-px-2 tw-py-4' : 'tw-px-4 tw-pt-4 tw-pb-4')}>
        <div className={classNames('tw-flex tw-items-center', isCompact ? 'tw-justify-center' : 'tw-justify-between tw-gap-2')}>
          {!isCompact && (
            <p className="tw-flex-1 tw-text-base tw-font-bold tw-text-white tw-leading-snug">{conferenceName}</p>
          )}
          <button
            className="lg:tw-hidden tw-flex-shrink-0 tw-text-slate-300 hover:tw-text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes className="tw-h-5 tw-w-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            className="tw-hidden lg:tw-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-h-7 tw-w-7 tw-rounded-md tw-bg-white/10 hover:tw-bg-white/20 tw-text-slate-200 tw-transition-colors"
            onClick={toggleCollapsed}
            title={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCompact ? <FaChevronRight className="tw-h-3.5 tw-w-3.5" /> : <FaChevronLeft className="tw-h-3.5 tw-w-3.5" />}
          </button>
        </div>

        {!isCompact && (
          <>
            {startDate && (
              <p className="tw-mt-1 tw-text-xs tw-text-slate-400">
                Starts {new Date(startDate).toLocaleString('en-US', {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}

            <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-indigo-500/30 tw-border tw-border-indigo-400/40 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-indigo-100">
              {timeLeft.days !== undefined ? (
                <span>⏳ {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
              ) : (
                <span>⏳ Loading…</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nav — minHeight 0 lets this flex child actually shrink and scroll */}
      <nav
        className={classNames('tw-flex-1 tw-overflow-y-auto tw-py-4', isCompact ? 'tw-px-2 tw-space-y-4' : 'tw-px-3 tw-space-y-5')}
        style={{ minHeight: 0 }}
      >
        {navGroups.map((group) => (
          <div key={group.title}>
            {!isCompact && (
              <p className="tw-px-3 tw-mb-1.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-400">
                {group.title}
              </p>
            )}
            <div className="tw-space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentTab === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={item.name}
                    className={classNames(
                      'tw-flex tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-duration-150',
                      isCompact ? 'tw-justify-center tw-px-0 tw-py-2.5' : 'tw-gap-3 tw-px-3 tw-py-2',
                      isActive
                        ? 'tw-bg-white/15 tw-text-white tw-shadow-inner'
                        : 'tw-text-slate-300 hover:tw-bg-white/10 hover:tw-text-white'
                    )}
                  >
                    <Icon className={classNames('tw-h-4 tw-w-4 tw-flex-shrink-0', item.iconColor)} />
                    {!isCompact && <span className="tw-truncate">{item.name}</span>}
                    {!isCompact && isActive && <span className="tw-ml-auto tw-h-2 tw-w-2 tw-rounded-full tw-bg-emerald-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={classNames('tw-flex-shrink-0 tw-border-t tw-border-white/10 tw-space-y-2', isCompact ? 'tw-p-2' : 'tw-p-3')}>
        <button
          type="button"
          title="Make Payment"
          className={classNames(
            'tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-emerald-500 hover:tw-bg-emerald-600 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors',
            isCompact ? 'tw-px-0 tw-py-2.5' : 'tw-px-4 tw-py-2'
          )}
          onClick={() => navigate("/payment-portal")}
        >
          <FaCreditCard />{!isCompact && ' Make Payment'}
        </button>
        <button
          type="button"
          title="Help & Manual"
          className={classNames(
            'tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/20 tw-text-slate-200 tw-text-sm tw-font-semibold tw-transition-colors',
            isCompact ? 'tw-px-0 tw-py-2.5' : 'tw-px-4 tw-py-2'
          )}
          onClick={() => window.open('/conference-manual', '_blank', 'noopener,noreferrer')}
        >
          <FaQuestionCircle />{!isCompact && ' Help & Manual'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar — sits just below the global app navbar */}
      <div
        className="lg:tw-hidden tw-sticky tw-z-40 tw-flex tw-items-center tw-justify-between tw-bg-slate-900 tw-px-4 tw-py-3 tw-shadow-md"
        style={{ top: GLOBAL_NAV_HEIGHT }}
      >
        <button
          className="tw-text-slate-200 hover:tw-text-white"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <FaBars className="tw-h-5 tw-w-5" />
        </button>
        <span className="tw-text-sm tw-font-bold tw-text-white tw-truncate tw-px-3">{conferenceName}</span>
        <img className="tw-h-7 tw-w-auto tw-brightness-0 tw-invert" src="/confSidebarLogo.png" alt="XCEED" />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:tw-hidden tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50" style={{ top: GLOBAL_NAV_HEIGHT }}>
          <div className="tw-absolute tw-inset-0 tw-bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-72 tw-shadow-2xl">
            {renderSidebarInner(false)}
          </div>
        </div>
      )}

      {/* Desktop fixed sidebar — starts below the global navbar so the header stays visible */}
      <aside
        className={classNames(
          'tw-hidden lg:tw-block tw-fixed tw-left-0 tw-z-40 tw-shadow-xl tw-transition-all tw-duration-300',
          collapsed ? 'tw-w-20' : 'tw-w-72'
        )}
        style={{ top: GLOBAL_NAV_HEIGHT, height: `calc(100vh - ${GLOBAL_NAV_HEIGHT}px)` }}
      >
        {renderSidebarInner(collapsed)}
      </aside>

      {/* Page content — padding follows the sidebar width */}
      <div
        className={classNames(
          'tw-w-full tw-bg-slate-100 tw-min-h-screen tw-transition-all tw-duration-300',
          collapsed ? 'lg:tw-pl-20' : 'lg:tw-pl-72'
        )}
      >
        <Outlet />
      </div>
    </>
  );
};

export default Sidebar;
