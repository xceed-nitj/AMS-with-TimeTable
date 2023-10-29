import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';
import MasterRoom from './timetableadmin/masterroom';
import AddSem from './timetableadmin/addsemester';
import AddRoom from './timetableadmin/addroom';
import LockedSummary from './timetableadmin/lockedsummary';
import Login from './dashboard/login';
import Subjects from './timetableadmin/addsubjects';
import LockedView from './timetableviewer/viewer';


function App() {
  return (
    <Router>

      {/* <div className="app"> */}
   
        {/* <h1>XCEED-Timetable Module</h1>  */}
         
        <Routes>
        <Route path="/" element={<Login/>} />

          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/dashboard" element={<CreateTimetable />} />
          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/:generatedLink/addroom" element={<AddRoom />} />
          <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
          <Route path="/tt/:generatedLink/addsem" element={<AddSem />} />
          <Route path="/tt/masterroom" element={<MasterRoom />} />
          <Route path="/tt/:generatedLink/addsubjects" element={<Subjects />} />
          <Route path="/tt/:generatedLink/lockedsummary" element={<LockedSummary />} />
          <Route path="/tt/viewtimetable" element={<LockedView/>} />
        </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;