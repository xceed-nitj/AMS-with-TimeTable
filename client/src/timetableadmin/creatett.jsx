import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import getEnvironment from "../getenvironment";
import './creatett.css';

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
  const apiUrl=getEnvironment();
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
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
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
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
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
    <div class="createttbody">
    <div className="createttcontainer">
      <div class="createttsignin-content">
        <div class="createttsignin-form">
          <form className="createttregister-form" onSubmit={handleSubmit}>
            <div class="createttform-group">
              <div class="labelandin">
                <label>
                Name:
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  // placeholder="Name"
                  className="createttform-input" 
                  />
              </div>

              <div class="labelandin">
                <label>
                Department:
                </label>
                <input
                  type="text"
                  name="dept"
                  value={formData.dept}
                  onChange={handleInputChange}
                  // placeholder="Department"
                  className="createttform-input"
                  />
              </div>

              <div class="labelandin">
                <label>
                Session:
                </label>
                <input
                  type="text"
                  name="session"
                  value={formData.session}
                  onChange={handleInputChange}
                  // placeholder="Session"
                  className="createttform-input"
                  />
              </div>
              
              <div class="createttform-button">
                <input class="createttbtn" type="submit" value="submit"/>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* <button onClick={handleGetSessions}>Get Sessions</button>
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
        </table> */}
      {loading && <p>Loading...</p>}
    </div>
    </div>
  );

}

export default CreateTimetable;
