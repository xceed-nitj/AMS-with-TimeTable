import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Timetable from './timetableadmin/timetable';
import FacultyTable from './timetableadmin/facultytable'
import CreateTimetable from './timetableadmin/creatett'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
<div className="app">
      <h1>Timetable</h1>
      {/* <Timetable /> */}
      {/* <FacultyTable /> */}
      <CreateTimetable/>

    </div>
    </>
  )
}

export default App
