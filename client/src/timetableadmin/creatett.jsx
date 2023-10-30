import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

function CreateTimetable() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    session: '',
    code: '',
  });
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [apiUrl] = useState(getEnvironment());
  const [sessions, setSessions] = useState([]); 
  const [departments, setDepartments] = useState([]); 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/allotment/session`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error('Failed to fetch sessions');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          console.error('Failed to fetch departments');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchSessions();
    fetchDepartments();
  }, [apiUrl]);

  const fetchTimetables = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTable(data);
      } else {
        console.error('Failed to fetch timetables');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const generatedLink = data.code;
        setGeneratedLink(generatedLink);
        setSubmitted(true);

        const redirectTo = `/tt/${generatedLink}`;
        navigate(redirectTo);
      } else {
        console.error('Error submitting the form');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const currentUrl = window.location.href;
  const urlParts = currentUrl.split('/');
  const domainName = urlParts[2];

  return (
    <div>
      <h1>Create Time Table</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Name"
        />
        <select name="dept" value={formData.dept} onChange={handleInputChange}>
        <option value="">Select a Department</option>
        {departments.map((department, index) => (
          <option key={index} value={department}>
            {department}
          </option>
        ))}
      </select>
      <select name="session" value={formData.session} onChange={handleInputChange}>
      <option value="">Select a Session</option>
      {sessions.map((session, index) => (
        <option key={index} value={session}>
          {session}
        </option>
      ))}
    </select>
        <button type="submit">Submit</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Timetable Name</th>
            <th>Session</th>
            <th>Department</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {table.map((timetable) => (
            <tr key={timetable._id}>
              <td>{timetable.name}</td>
              <td>{timetable.session}</td>
              <td>{timetable.dept}</td>
              <td>
                <a href={`http://${domainName}/tt/${timetable.code}`}>{timetable.code}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p>Loading...</p>}
    </div>
  );
}

export default CreateTimetable;