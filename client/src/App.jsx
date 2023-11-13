import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import Subjects from './timetableadmin/addsubjects';
import ViewMRooms from './timetableadmin/viewmrooms';
import LockedView from './timetableviewer/viewer';
import Note from './timetableadmin/addnote';
import PrintButton from './filedownload/printButton';
import Navbar from './components/navbar';
import Footer from './components/footer'
import PrintSummary from './timetableadmin/printSummary'
import LoadDistribution from './timetableadmin/loaddistribution';
import RegistrationForm from './dashboard/register';
import AllotmentForm from './timetableadmin/allotment';
import MasterDelete from './timetableadmin/masterdelete';

function App() {
  return (
    <Router>

      {/* <div className="app"> */}
   
        {/* <h1>XCEED-Timetable Module</h1>  */}
        <Navbar/>
         
        <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/register" element={<RegistrationForm/>} />
          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/dashboard" element={<CreateTimetable />} />
          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/:generatedLink/addroom" element={<AddRoom />} />
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
          <Route path="/tt/viewmrooms" element={<ViewMRooms/>} />
          <Route path="/tt/viewtimetable" element={<LockedView/>} />
          <Route path="/tt/print" element={<PrintButton/>} />
          <Route path="/tt/allotment" element={<AllotmentForm/>}/>
        </Routes>
        {/* <Footer/> */}
      {/* </div> */}
    </Router>

 );
}

export default App;