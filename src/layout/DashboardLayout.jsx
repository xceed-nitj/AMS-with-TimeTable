import Sidebar from '../components/Sidebar'
import { Route, Routes } from "react-router-dom";
import ConferencePage from '../Tabs/ConferencePage';
import Speaker from '../Tabs/Speaker';
import Committees from '../Tabs/Committees';
import Sponsors from '../Tabs/Sponsors';
import Awards from '../Tabs/Awards';
import Announcement from '../Tabs/Announcement';
import Contacts from '../Tabs/Contacts';
import Images from '../Tabs/Images';
import Home from '../Tabs/Home'
import EventDates from '../Tabs/EventDates';
import Navbar from '../Tabs/Navbar';
import Participants from '../Tabs/Participants';
import Location from '../Tabs/Location';
import Certificate from '../certificateModule/Certificate';
export default function DashboardLayout() {
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white">
        <body class="h-full">
        ```
      */}
      {/* <div>
        <Sidebar />
        <main className='py-10 bg-gray-100 lg:pl-72'>
          <div className='px-4 sm:px-6 lg:px-8'>Your content </div >
        </main >
      </div >  */}



      < Routes >
        <Route path="/" element={<ConferencePage />} />
        <Route path="info/:confid" element={<Sidebar />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="speakers" element={<Speaker />} />
          <Route path="committee" element={<Committees />} />
          <Route path="sponsorship" element={<Sponsors />} />
          <Route path="awards" element={<Awards />} />
          <Route path="announcement" element={<Announcement />} />
          <Route path="contact" element={<Contacts />} />
          <Route path="images" element={<Images />} />
          <Route path="eventdates" element={<EventDates />} />
          <Route path="locations" element={<Location />} />
          <Route path="participants" element={<Participants />} />
          <Route path="navbar" element={<Navbar />} />
          <Route path="certificate" element={<Certificate />} />
        </Route>
      </Routes >
    </>
  )
}
