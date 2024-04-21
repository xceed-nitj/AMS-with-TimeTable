import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';
import MasterRoom from './timetableadmin/masterroom';
import MasterSem from './timetableadmin/mastersem';
import AddSem from './timetableadmin/addsemester';
import AddRoom from './timetableadmin/addroom';
import LockedSummary from './timetableadmin/lockedsummary';
import Login from './dashboard/login';
import ForgotPassword from './dashboard/ForgotPassword';

import Subjects from './timetableadmin/addsubjects';
import ViewMRooms from './timetableadmin/viewmrooms';
// import LockedView from './timetableviewer/viewer';
import Note from './timetableadmin/addnote';
import Navbar from './components/home/Navbar';
import PrintSummary from './timetableadmin/printSummary';
import LoadDistribution from './timetableadmin/loaddistribution';
import RegistrationForm from './dashboard/register';
import AllotmentForm from './timetableadmin/allotment';
import MasterDelete from './timetableadmin/masterdelete';
import AdminPage from './timetableadmin/admin';
import ViewAllotmentPage from './timetableadmin/viewroomallotment';
import CommonLoad from './timetableadmin/addcommonload';
import MasterView from './timetableadmin/mastersearch';
import View from './timetableadmin/masterview';
import AllocatedRolesPage from './dashboard/allotedroles';
import FirstYearLoad from './timetableadmin/firstyearload';
import FirstYearFaculty from './timetableadmin/addfirstyearfaculty';
import LunchLoad from './timetableadmin/addlunchload';
import InstituteLoad from './timetableadmin/instituteload';
import ViewInstituteLoad from './timetableadmin/viewinstituteload';
import EditMasterFaculty from './timetableadmin/editmasterfaculty';

import MergePDFComponent from './filedownload/mergepdfdocuments';

import Home from './pages/Home';
import EventRegistration from './certificatemodule/pages/eventregistration';
import CMDashboard from './certificatemodule/pages/cmdashboard';
import CertificateForm from './certificatemodule/pages/certificatedesign';
// import Certificate from './certificatemodule/pages/certificatetemplates/Certificate';
import ServicePage from './pages/Service';
import Participant from './certificatemodule/pages/participantdataupload';


import EODashboard from './conferencemodule/layout/eodashboard';
import HomeConf from './conferencemodule/Tabs/HomeConf';
import Sidebar from './conferencemodule/components/Sidebar';
import Speaker from './conferencemodule/Tabs/Speaker';
import Committees from './conferencemodule/Tabs/Committees';
import Sponsors from './conferencemodule/Tabs/Sponsors';
import Awards from './conferencemodule/Tabs/Awards';
import Announcement from './conferencemodule/Tabs/Annoumcement';
import Contacts from './conferencemodule/Tabs/Contacts';
import Images from './conferencemodule/Tabs/Images';
import EventDates from './conferencemodule/Tabs/EventDates';
import Participants from './conferencemodule/Tabs/Participants';
import NavbarConf from './conferencemodule/Tabs/NavbarConf';
import Location from './conferencemodule/Tabs/Location';
import CommonTemplate from './conferencemodule/Tabs/CommonTemplate';
import ConferencePage from './conferencemodule/Tabs/ConferencePage';
import Template01 from './certificatemodule/pages/certificatetemplates/akleem';
// import ViewCertificate from './certificatemodule/pages/participantCerti';
import Template03 from './certificatemodule/pages/certificatetemplates/03_sarthak';

import PRMEventRegistration from './reviewmodule/pages/eventregistration';
import PRMDashboard from './reviewmodule/pages/prmdashboard';
import ReviewLogin from './reviewmodule/pages/ReviewLogin';
import CreateUser from './reviewmodule/pages/CreateUser';

import SponsorshipRate from './conferencemodule/Tabs/SponsorshipRates';
import Accomodation from './conferencemodule/Tabs/Accomodation';
import Event from './conferencemodule/Tabs/Events';
import Souvenir from './conferencemodule/Tabs/Souvenir';
import EditorDashboard from './reviewmodule/pages/EditorDashboard';

function App() {
  return (
    <Router>
      {/* <div className="app"> */}

      {/* <h1>XCEED-Timetable Module</h1>  */}
      <Navbar />

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />
        <Route path="/services/:serviceId" element={<ServicePage />} />
        {/* ********* */}

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/register" element={<RegistrationForm/>} />
          <Route path="/userroles" element={<AllocatedRolesPage />} />


        <Route path="/tt">
              <Route path="dashboard" element={<CreateTimetable />} />
              <Route path="masterview" element={<MasterView />} />
              <Route path="masterfaculty" element={<MasterFaculty />} />
              <Route path="masterroom" element={<MasterRoom />} />
              <Route path="mastersem" element={<MasterSem />} />
              <Route path="masterdelete" element={<MasterDelete />} />
              <Route path="viewmrooms" element={<ViewMRooms/>} />
        </Route>
          
        <Route path="/tt/:generatedLink">
             <Route index element={<Timetable />}></Route>  

              <Route path="addfaculty" element={<AddFaculty />} />
              <Route path="addroom" element={<AddRoom />} />
              <Route path="addcommonload" element={<CommonLoad/>} />
              <Route path="addlunchload" element={<LunchLoad/>} />
              <Route path="addsubjects" element={<Subjects />} />
              <Route path="addsem" element={<AddSem />} />
              <Route path="addnote" element={<Note/>} />
              <Route path="firstyearload" element={<FirstYearLoad />} />
              <Route path="firstyearfaculty" element={<FirstYearFaculty />} />
              <Route path="lockedsummary" element={<LockedSummary />} />
              <Route path="generatepdf" element={<PrintSummary />} />
              <Route path="loaddistribution" element={<LoadDistribution />} />
              <Route path="roomallotment" element={<ViewAllotmentPage/>} />
              <Route path="editmasterfaculty" element={<EditMasterFaculty/>} />
        </Route>
          
          {/* Same link */}
          <Route path="classrooms" element={<ViewMRooms/>} />
          {/* Same link */}

          {/* <Route path="/tt/viewtimetable" element={<LockedView/>} /> */}
          <Route path="/tt/allotment" element={<AllotmentForm/>}/>
          <Route path="/tt/admin" element={<AdminPage/>}/>

        {/* Same link */}
        <Route path="timetable" element={<MasterView />} />
        {/* Same link */}

        <Route path="/tt/admin/view" element={<View />} />
        <Route path="/tt/admin/instituteload" element={<InstituteLoad />} />
        <Route path="/tt/viewinstituteload" element={<ViewInstituteLoad />} />

        <Route
          path="/tt/:generatedLink/generatepdf/mergepdf"
          element={<MergePDFComponent />}
        />

          <Route path="/cm/addevent" element={<EventRegistration />} />
          <Route path="/cm/dashboard" element={<CMDashboard />} />
          <Route path="/cm/:eventid" element={<CertificateForm/>}/>
          <Route path="/cm/:eventid/addparticipant" element={<Participant/>}/>
          <Route path="/cm/c/:eventid/:participantid" element={<Template01/>}/>
          <Route path="/cm/c/:eventid/:participantid/sarthak" element={<Template03/>}/>

    {/* Review management routes*/}
    <Route path="/prm/login" element={<ReviewLogin/>} />
    <Route path="/prm/signup" element={<CreateUser/>} />
    <Route path="/prm/assigneditor" element={<PRMEventRegistration/>} />
    <Route path="/prm/dashboard" element={<PRMDashboard/>} />
    <Route path="/prm/editor/dashboard" element={<EditorDashboard/>} />


          {/* Conference Module Admin-Panel */}
          <Route path="/cf/dashboard" element={<EODashboard/>} />
          <Route path="/cf" element={<ConferencePage />} />
          <Route path="/cf/:confid" element={<Sidebar  />}>
          <Route index element={<HomeConf />} />
          <Route path="home" element={<HomeConf />} />
          <Route path="speakers" element={<Speaker />} />
          <Route path="committee" element={<Committees />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="awards" element={<Awards />} />
          <Route path="announcement" element={<Announcement />} />
          <Route path="contact" element={<Contacts />} />
          <Route path="images" element={<Images />} />
          <Route path="eventdates" element={<EventDates />} />
          <Route path="locations" element={<Location />} />
          <Route path="participants" element={<Participants />} />
          <Route path="navbar" element={<NavbarConf />} />
          <Route path="template" element={<CommonTemplate/>} />
          <Route path="sponsorship-rates" element={<SponsorshipRate />} />
          <Route path="accomodation" element={<Accomodation />} />
          <Route path="events" element={<Event />} />
          <Route path="souvenir" element={<Souvenir />} />




          </Route>
        </Routes>
        {/* <Footer/> */}
      {/* </div> */}
    </Router>
  );
}

export default App;