import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';


function CreateTimetable() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    session: "",
    code: "",
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/timetablemodule/timetable', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data= await response.json();
        console.log(data);
        console.log(data.code);

        // Access the necessary details from the updated allquiz array
        const generatedLink = data.code;

        // Set the generated link and submitted state in the component state
        setGeneratedLink(generatedLink);
        setSubmitted(true);

        // Redirect to the  page
        const redirectTo = `/tt/${generatedLink}`;
        navigate(redirectTo);
      } else {
        // Handle errors
        console.error("Error submitting the form");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGetSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/timetablemodule/timetable", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        setLoading(false);
      } else {
        // Handle errors
        console.error("Error fetching sessions");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Name"
        />
        <input
          type="text"
          name="dept"
          value={formData.dept}
          onChange={handleInputChange}
          placeholder="Department"
        />
        <input
          type="text"
          name="session"
          value={formData.session}
          onChange={handleInputChange}
          placeholder="Session"
        />
        <button type="submit">Submit</button>
      </form>
      <button onClick={handleGetSessions}>Get Sessions</button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Session</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{session.name}</td>
              <td>{session.dept}</td>
              <td>{session.session}</td>
              <td>{session.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p>Loading...</p>}
    </div>
  );

}

export default CreateTimetable;
