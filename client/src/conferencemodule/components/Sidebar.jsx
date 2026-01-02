import React, { useEffect, useState } from 'react';
import { classNames } from '../utils/tailwindUtils';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from "../../getenvironment";
import { useNavigate } from "react-router-dom";



const navigation = [
  { name: 'Home', href: 'home', color: 'tw-bg-blue-500', lightColor: 'tw-bg-blue-100', borderColor: 'tw-border-blue-800' },
  { name: 'Images', href: 'images', color: 'tw-bg-teal-500', lightColor: 'tw-bg-teal-100', borderColor: 'tw-border-teal-800' },
  { name: 'Event Dates', href: 'eventdates', color: 'tw-bg-orange-500', lightColor: 'tw-bg-orange-100', borderColor: 'tw-border-orange-800' },
  { name: 'Speakers', href: 'speakers', color: 'tw-bg-emerald-500', lightColor: 'tw-bg-emerald-100', borderColor: 'tw-border-emerald-800' },
  { name: 'Navbar', href: 'navbar', color: 'tw-bg-rose-500', lightColor: 'tw-bg-rose-100', borderColor: 'tw-border-rose-800' },
  { name: 'File Upload', href: '/fileupload', color: 'tw-bg-sky-500', lightColor: 'tw-bg-sky-100', borderColor: 'tw-border-sky-800' },
  { name: 'Common Template', href: 'commontemplate', color: 'tw-bg-emerald-500', lightColor: 'tw-bg-slate-100', borderColor: 'tw-border-slate-800' },
  { name: 'Announcements', href: 'announcement', color: 'tw-bg-violet-500', lightColor: 'tw-bg-violet-100', borderColor: 'tw-border-violet-800' },
];

const Sidebar = () => {
  const location = useLocation();
  const params = useParams();
  const IdConf = params.confid;
  const apiUrl = getEnvironment();


  // State for conference name
  const [conferenceName, setConferenceName] = useState('Conference Name');
  const [timeLeft, setTimeLeft] = useState({});
  const [startDate, setStartDate] = useState('2025-12-31T10:00:00'); 
  
  // replace with actual date from API

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

    // try {
    //   const response = axios.post(`${apiUrl}/conferencemodule/conf`, {
    //     email: "import@testing",
    //     name: "import testing"
    //   }, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       // Add token if required for auth
    //       // Authorization: `Bearer ${token}`
    //     }
    //   });

    //   console.log('Conference added:', response.data);
    //   alert("Conference added successfully");
    // } catch (error) {
    //   console.error('Error:', error.response?.data || error.message);
    //   alert("Error adding conference: " + (error.response?.data?.error || error.message));
    // }

    axios.get(`${apiUrl}/conferencemodule/conf`, { withCredentials: true })
      .then(res => {
        console.log(res);
        console.log(res.data);
      })
      .catch(err => {
        console.log(err);
      });

    axios.get(`${apiUrl}/conferencemodule/commontemplate/conference/${IdConf}`, { withCredentials: true })
      .then(res => {
        console.log(res);
        console.log(res.data);
      })
      .catch(err => {
        console.log(err);
      });

    axios
      .get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, { withCredentials: true })
      .then(res => {
        console.log(res);
        console.log(IdConf);
        setConferenceName(res.data?.confName || 'Conference Name');
      })
      .catch(err => {
        setConferenceName('Conference Name');
        console.error('Failed to fetch conference name:', err);
      });

    {/* start date */ }
    axios
      .get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, { withCredentials: true })
      .then(res => {
        setConferenceName(res.data?.confName || 'Conference Name');
        setStartDate(res.data?.startDate || '2025-12-31T10:00:00'); // adjust key according to your API
      })
      .catch(err => {
        console.error('Failed to fetch conference:', err);
      });

  }, [IdConf, apiUrl]);



  const getCurrentTab = () => {
    const currentPath = location.pathname.split('/').pop();
    return currentPath || 'home';
  };

  const currentTab = getCurrentTab();
  const activeTab = navigation.find(item => item.href === currentTab);
  const activeTabColor = activeTab ? activeTab.color : 'tw-bg-blue-500';
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      {/* Header */}
     {/* Compact Centered Conference Header */}
<div className="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-bg-gray-50 tw-px-4 tw-pt-2 tw-pb-2">

  {/* Countdown Timer */}
  <div className="tw-text-center tw-bg-blue-50 tw-px-2 tw-py-1 tw-rounded-md tw-font-medium tw-text-blue-800 tw-shadow-sm tw-text-sm">
    {timeLeft.days !== undefined ? (
      <span>
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    ) : (
      <span>Loading...</span>
    )}
  </div>

  {/* Conference Title */}
  <div className="tw-text-center tw-text-2xl sm:tw-text-3xl tw-font-extrabold tw-text-gray-800">
    {conferenceName}
  </div>

  {/* Conference Start Date */}
  {startDate && (
    <div className="tw-text-center tw-text-sm tw-text-gray-600">
      Start Date: {new Date(startDate).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
  )}

  {/* Make Payment Button */}
  <button
    type="button"
    className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-1.5 tw-rounded-md tw-font-semibold tw-shadow-sm tw-transition-all tw-duration-300"
    onClick={() => navigate("/payment-portal")}
  >
    Make Payment
  </button>

</div>








      {/* Tab Bar */}
      <div className="tw-bg-gray-50 tw-sticky tw-top-[64px] tw-z-40">
        <div className="tw-w-full tw-px-0">
          <div className="tw-py-4 tw-flex tw-items-center tw-gap-4 sm:tw-gap-6 tw-w-full">
            {/* Logo */}
            <div className="tw-flex-shrink-0 tw-flex tw-items-center tw-pl-4 sm:tw-pl-6 lg:tw-pl-8">
              <Link to="/" className="tw-flex tw-items-center">
                <img
                  className="tw-h-8 tw-w-auto tw-max-w-[120px]"
                  src="/confSidebarLogo.png"
                  alt="XCEED"
                />
              </Link>
            </div>
            {/* Tabs Section */}
            <div className="tw-flex-1 tw-flex tw-flex-col tw-min-w-0 tw-pr-4 sm:tw-pr-6 lg:tw-pr-8">
              {/* Tabs */}
              <div className="tw-flex tw-flex-wrap tw-gap-0 tw-justify-start">
                {navigation.map((item, idx) => {
                  const isActive = currentTab === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        'tw-relative tw-px-4 lg:tw-px-6 tw-py-3 tw-text-xs sm:tw-text-sm tw-font-semibold',
                        'tw-transition-all tw-duration-300',
                        'tw-rounded-t-lg tw-border tw-border-b-0 tw-shadow-sm tw-whitespace-nowrap',
                        'tw-flex tw-items-center tw-justify-center',
                        isActive
                          ? `${item.lightColor} ${item.borderColor} tw-text-gray-800 tw-z-10`
                          : 'tw-bg-white tw-border-gray-300 tw-text-gray-600 tw-hover:tw-bg-gray-100 tw-hover:tw-text-gray-800'
                      )}
                      style={{
                        marginLeft: idx === 0 ? 0 : '-1px',
                        minWidth: 'fit-content',
                        flex: '1 1 auto',
                      }}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              {/* Colored Strip below tabs */}
              <div className={`tw-h-2 ${activeTabColor} tw-w-full tw-rounded-b-md tw-shadow-md`} />
            </div>
          </div>
        </div>
      </div>



      {/* Page Content */}
      <div className="tw-w-full tw-px-0 tw-py-6">
        <Outlet />
      </div>
    </>
  );
};

export default Sidebar;

