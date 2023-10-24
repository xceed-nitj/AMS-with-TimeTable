import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';



function App() {
  return (
    <Router>
      <div className="app">
        <h1>Timetable</h1>
            <Link to="/create-timetable">Create Timetable</Link>
          
        <Routes>
          <Route path="/tt/:generatedLink" element={<Timetable />} />
          <Route path="/create-timetable" element={<CreateTimetable />} />
          <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
          <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
