import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';

const AllotmentForm = () => {
  // State to hold form data
  const [formData, setFormData] = useState({
    session: '',
    dept: '',
    room: '',
    morningSlot: false,
    afternoonSlot: false,
  });

  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);

  const apiUrl = getEnvironment();

  // Fetch departments and rooms on component mount
  useEffect(() => {
    fetchDepartments();
    fetchRooms();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  // Handler for input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/mastersem/dept`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

  const fetchRooms = async () => {
    try {
      const type = 'Centralised Classroom';
      const response = await fetch(`${apiUrl}/timetablemodule/masterroom/getroom/${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        console.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make a POST request using fetch
      const response = await fetch(`${apiUrl}/timetablemodule/allotment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Handle the response, you might want to redirect or show a success message
      console.log('Allotment created successfully');

      // Optionally, reset the form
      setFormData({
        session: '',
        dept: '',
        room: '',
        morningSlot: false,
        afternoonSlot: false,
      });
    } catch (error) {
      // Handle errors, show an error message, etc.
      console.error('Error creating allotment:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Session:
        <input type="text" name="session" value={formData.session} onChange={handleChange} />
      </label>

      <label>
        Department:
        <select name="dept" value={formData.dept} onChange={handleChange}>
          <option value="">Select Department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Room:
        {rooms.map((room) => (
          <div key={room.id}>
            <input
              type="checkbox"
              name="room"
              value={room.name}
              checked={formData.room === room.name}
              onChange={handleChange}
            />
            {room.name}
          </div>
        ))}
      </label>

      <label>
        Morning Slot:
        <input
          type="checkbox"
          name="morningSlot"
          checked={formData.morningSlot}
          onChange={handleChange}
        />
      </label>

      <label>
        Afternoon Slot:
        <input
          type="checkbox"
          name="afternoonSlot"
          checked={formData.afternoonSlot}
          onChange={handleChange}
        />
      </label>

      <button type="submit">Submit</button>
    </form>
  );
};

export default AllotmentForm;
