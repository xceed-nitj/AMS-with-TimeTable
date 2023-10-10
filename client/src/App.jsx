import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Timetable from './timetableadmin/timetable';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
<div className="app">
      <h1>Timetable</h1>
      <Timetable />
    </div>
    </>
  )
}

export default App
