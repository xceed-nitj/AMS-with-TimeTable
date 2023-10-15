import React, { Component } from 'react';

class Timetable extends Component {
  constructor() {
    super();
    this.state = {
      timetableData: {},
      availableSubjects: ['Eng', 'Mat', 'Che', 'Phy', 'Other'],
      availableRooms: ['Room1', 'Room2', 'Room3', 'Room4', 'Room5'],
      availableFaculties: ['Faculty1', 'Faculty2', 'Faculty3', 'Faculty4', 'Faculty5'],
      showSavedData: false, // Add a state to toggle showing saved data
      savedData: {}, // Store the fetched saved data
    };
    this.state.timetableData = this.generateInitialTimetableData();
  }

  generateInitialTimetableData() {
    const initialData = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        initialData[day][`period${period}`] = {
          subject: this.state.availableSubjects[0], // Set to the first subject in the list
          room: this.state.availableRooms[0], // Set to the first room in the list
          faculty: this.state.availableFaculties[0], // Set to the first faculty in the list
        };
      }
    }

    return initialData;
  }

  handleCellChange = (day, period, type, event) => {
    const newValue = event.target.value;
    const updatedData = { ...this.state.timetableData };
    updatedData[day][`period${period}`][type] = newValue;
    this.setState({ timetableData: updatedData });
  };

  handleSubmit = () => {

    const apiUrl = 'http://127.0.0.1:8000/timetablemodule/timetable';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({ timetableData: this.state.timetableData }),

    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Data sent to the backend:', data);
        // Set the saved data in the state
        this.setState({
          showSavedData: true,
          savedData: data,
        });
      })
      .catch((error) => {
        console.error('Error sending data to the backend:', error);
      });
  };

  fetchSavedData = () => {
    const apiUrl = 'http://127.0.0.1:8000/timetablemodule/timetable'; // Replace with the actual URL of your backend route

    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched saved data:', data);
        this.setState({
          showSavedData: true,
          savedData: data,
        });
      })
      .catch((error) => {
        console.error('Error fetching saved data:', error);
      });
  };

  render() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
      <div>
        <h1>TIME TABLE</h1>
        <button onClick={this.fetchSavedData}>Fetch Saved Data</button>
        {this.state.showSavedData ? (
          <table border="5" cellSpacing="0" align="center">
           <tr>
            <td align="center" height="50" width="100">
              <b>Day/Period</b>
            </td>
            <td align="center" height="50" width="100">
              <b>8:30-9:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>9:30-10:30</b>
            </td>
            {/* Add headers for other time slots here */}
          </tr>
          {days.map((day) => (
            <tr key={day}>
              <td align="center" height="50">
                <b>{day}</b>
              </td>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <td key={period} align="center" height="50">
                  <select
                    value={this.state.timetableData[day][`period${period}`].subject}
                    onChange={(event) => this.handleCellChange(day, period, 'subject', event)}
                  >
                    {this.state.availableSubjects.map((subjectOption) => (
                      <option key={subjectOption} value={subjectOption}>
                        {subjectOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={this.state.timetableData[day][`period${period}`].room}
                    onChange={(event) => this.handleCellChange(day, period, 'room', event)}
                  >
                    {this.state.availableRooms.map((roomOption) => (
                      <option key={roomOption} value={roomOption}>
                        {roomOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={this.state.timetableData[day][`period${period}`].faculty}
                    onChange={(event) => this.handleCellChange(day, period, 'faculty', event)}
                  >
                    {this.state.availableFaculties.map((facultyOption) => (
                      <option key={facultyOption} value={facultyOption}>
                        {facultyOption}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
          </table>
        ) : (
          <table border="5" cellSpacing="0" align="center">
          <tr>
            <td align="center" height="50" width="100">
              <b>Day/Period</b>
            </td>
            <td align="center" height="50" width="100">
              <b>8:30-9:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>9:30-10:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>10:30-11:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>11:30-12:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>1:30-2:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>2:30-3:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>3:30-4:30</b>
            </td>
            <td align="center" height="50" width="100">
              <b>4:30-5:30</b>
            </td>
            
          </tr>
          {days.map((day) => (
            <tr key={day}>
              <td align="center" height="50">
                <b>{day}</b>
              </td>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <td key={period} align="center" height="50">
                  <select
                    value={this.state.timetableData[day][`period${period}`].subject}
                    onChange={(event) => this.handleCellChange(day, period, 'subject', event)}
                  >
                    {/* <option value="">Select a Subject</option> */}
                    {this.state.availableSubjects.map((subjectOption) => (
                      <option key={subjectOption} value={subjectOption}>
                        {subjectOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={this.state.timetableData[day][`period${period}`].room}
                    onChange={(event) => this.handleCellChange(day, period, 'room', event)}
                  >
                    {/* <option value="">Select a Room</option> */}
                    {this.state.availableRooms.map((roomOption) => (
                      <option key={roomOption} value={roomOption}>
                        {roomOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={this.state.timetableData[day][`period${period}`].faculty}
                    onChange={(event) => this.handleCellChange(day, period, 'faculty', event)}
                  >
                    {/* <option value="">Select a Faculty</option> */}
                    {this.state.availableFaculties.map((facultyOption) => (
                      <option key={facultyOption} value={facultyOption}>
                        {facultyOption}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
          </table>
        )}
        <button onClick={this.handleSubmit}>Save Timetable</button>
      </div>
    );
  }
}

export default Timetable;
