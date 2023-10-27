import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';
import MasterRoom from './timetableadmin/masterroom';
import LockedSummary from './timetableadmin/lockedsummary';
import Login from './dashboard/login';
import Subjects from './timetableadmin/addsubjects';


function App() {
  return (
    <Router>
      {/* <div className="app">
        <h1>XCEED-Timetable Module</h1> */}
            {/* <Link to="/create-timetable">Create Timetable</Link> */}
          
        <Routes>
        <Route path="/" element={<Login/>} />

          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/dashboard" element={<CreateTimetable />} />
          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
          <Route path="/tt/masterroom" element={<MasterRoom />} />
          <Route path="/tt/addsubjects" element={<Subjects />} />
          <Route path="/tt/:generatedLink/lockedsummary" element={<LockedSummary />} />
        </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;