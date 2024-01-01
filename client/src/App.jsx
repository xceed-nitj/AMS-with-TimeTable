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
import LockedView from './timetableviewer/viewer';
import Note from './timetableadmin/addnote';
import Navbar from './components/navbar';
import PrintSummary from './timetableadmin/printSummary'
import LoadDistribution from './timetableadmin/loaddistribution';
import RegistrationForm from './dashboard/register';
import AllotmentForm from './timetableadmin/allotment';
import MasterDelete from './timetableadmin/masterdelete';
import AdminPage from './timetableadmin/admin';
import ViewAllotmentPage from './timetableadmin/viewroomallotment';
import CommonLoad from './timetableadmin/addcommonload';
import MasterView from './timetableadmin/mastersearch';
import AllocatedRolesPage from './dashboard/allotedroles';
import FirstYearLoad from './timetableadmin/firstyearload';
import FirstYearFaculty from './timetableadmin/addfirstyearfaculty';
import LunchLoad from './timetableadmin/addlunchload';
import InstituteLoad from './timetableadmin/instituteload';
import ViewInstituteLoad from './timetableadmin/viewinstituteload';

import MergePDFComponent from './filedownload/mergepdfdocuments';
import Home from './pages/Home'
import EventRegistration from './certificatemodule/pages/eventregistration';
import CMDashboard from './certificatemodule/pages/cmdashboard';
import CertificateForm from './certificatemodule/pages/certificatedesign';
import Certificate from './certificatemodule/pages/certificatetemplates/Certificate';
import ServicePage from './pages/Service';

function App() {
  return (
    <Router>

      {/* <div className="app"> */}
   
        {/* <h1>XCEED-Timetable Module</h1>  */}
        <Navbar/>
         
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />
          <Route path='/services/:serviceId' element={<ServicePage/>} />
        {/* ********* */}

        <Route path="/login" element={<Login/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />

        <Route path="/register" element={<RegistrationForm/>} />
          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/tt/dashboard" element={<CreateTimetable />} />
          <Route path="/userroles" element={<AllocatedRolesPage />} />

          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/:generatedLink/addroom" element={<AddRoom />} />
          <Route path="/tt/:generatedLink/firstyearload" element={<FirstYearLoad />} />
          <Route path="/tt/:generatedLink/firstyearfaculty" element={<FirstYearFaculty />} />

          <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
          <Route path="/tt/:generatedLink/addsem" element={<AddSem />} />
          <Route path="/tt/masterroom" element={<MasterRoom />} />
          <Route path="/tt/mastersem" element={<MasterSem />} />
          <Route path="/tt/masterdelete" element={<MasterDelete />} />
          <Route path="/tt/:generatedLink/addsubjects" element={<Subjects />} />
          <Route path="/tt/:generatedLink/lockedsummary" element={<LockedSummary />} />
          <Route path="/tt/:generatedLink/generatepdf" element={<PrintSummary />} />
          <Route path="/tt/:generatedLink/loaddistribution" element={<LoadDistribution />} />
          <Route path="/tt/:generatedLink/addnote" element={<Note/>} />
          <Route path="/tt/:generatedLink/roomallotment" element={<ViewAllotmentPage/>} />
          <Route path="/tt/:generatedLink/addcommonload" element={<CommonLoad/>} />
          <Route path="/tt/:generatedLink/addlunchload" element={<LunchLoad/>} />

          <Route path="/tt/viewmrooms" element={<ViewMRooms/>} />
          <Route path="/tt/viewtimetable" element={<LockedView/>} />
          <Route path="/tt/allotment" element={<AllotmentForm/>}/>
          <Route path="/tt/admin" element={<AdminPage/>}/>
          <Route path="/tt/masterview" element={<MasterView/>}/>
          <Route path="/tt/admin/instituteload" element={<InstituteLoad/>}/>
          <Route path="/tt/viewinstituteload" element={<ViewInstituteLoad/>}/>
         
          <Route path="/tt/:generatedLink/generatepdf/mergepdf" element={<MergePDFComponent />} />

          <Route path="/cm/addevent" element={<EventRegistration />} />
          <Route path="/cm/dashboard" element={<CMDashboard />} />
          <Route path="/cm/:eventid" element={<CertificateForm/>}/>
          <Route path="/cm/participant" element={<Certificate/>}/>

        </Routes>
        {/* <Footer/> */}
      {/* </div> */}
    </Router>

 );
}

export default App;