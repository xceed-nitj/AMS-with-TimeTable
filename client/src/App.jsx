import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timetable from './timetableadmin/timetable';
import FacultyTable from './timetableadmin/facultytable';
import CreateTimetable from './timetableadmin/creatett';

function App() {
  return (
    <Router>
      <div className="app">
        <h1>Timetable</h1>

        <ul>
          <li>
            <Link to="/timetable">Timetable</Link>
          </li>
          <li>
            <Link to="/facultytable">Faculty Table</Link>
          </li>
          <li>
            <Link to="/create-timetable">Create Timetable</Link>
          </li>
        </ul>

        <Routes>
          {/* <Route path="/timetable" element={<Timetable />} /> */}
          <Route path="/facultytable" element={<FacultyTable />} />
          <Route path="/create-timetable" element={<CreateTimetable />} />
          <Route path="/tt/:generatedLink" element={<Timetable />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
