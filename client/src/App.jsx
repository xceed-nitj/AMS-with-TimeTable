import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';
import Subject from './timetableadmin/addsubjects';


function App() {
  return (
    <Router>
      <div className="app">
        <h1>XCEED-Timetable Module</h1>
            {/* <Link to="/create-timetable">Create Timetable</Link> */}
          
        <Routes>
          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/facultytable" element={<FacultyTable />} />
          <Route path="/tt/addsubject" element={<Subject />} />
          <Route path="/create-timetable" element={<CreateTimetable />} />

          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
          <Route path="/tt/:generatedLink/lockedsummary" element={<LockedSummary />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;