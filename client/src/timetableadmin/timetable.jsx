import React, { Component } from 'react';
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  integrity="sha384-pzjw2HEZBrnHL2hZCBK7W6bzXNEquXpDfXSt8zytUGhSfwmkDr/jwGAqR6u6I0rt"
  crossorigin="anonymous"
/>

class Timetable extends Component {

  constructor() {
    super();
    this.state = {
      timetableData: {},
      availableSubjects: ['Eng', 'Mat', 'Che', 'Phy', 'Other'],
      availableRooms: ['Room1', 'Room2', 'Room3', 'Room4', 'Room5'],
      availableFaculties: ['Faculty1', 'Faculty2', 'Faculty3', 'Faculty4', 'Faculty5'],
      selectedCell: null,
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
        initialData[day][`period${period}`] = [
          {
            subject: this.state.availableSubjects[0],
            room: this.state.availableRooms[0],
            faculty: this.state.availableFaculties[0],
          },
        ];
      }
    }

    return initialData;
  }

 async getbackendData() {
  try {
    const response = await fetch('http://127.0.0.1:8000/timetablemodule/tt/viewclasstt/abc-def-hij/3');
    const data = await response.json();

    if (data) {
      this.setState({ timetableData: data });
    } else {
      // Handle the case where data is not available
      console.error('No data available.');
    }
  } catch (error) {
    console.error('Error fetching existing timetable data:', error);
  }
}


  handleCellChange = (day, period, index, type, event) => {
    const newValue = event.target.value;
    const updatedData = { ...this.state.timetableData };
    updatedData[day][`period${period}`][index][type] = newValue;
    this.setState({ timetableData: updatedData });
  };

  handleSplitCell = (day, period) => {
    const { timetableData } = this.state;

    // Create a new cell with the same data as the original cell
    const newCell = {
      subject: this.state.availableSubjects[0],
      room: this.state.availableRooms[0],
      faculty: this.state.availableFaculties[0],
    };

    // Add the new cell to the current period
    timetableData[day][`period${period}`].push(newCell);

    // Update the state with the new timetable data
    this.setState({ timetableData });
  };  

  handleDeleteCell = (day, period, index) => {
    const { timetableData } = this.state;
  
    // Find the cell to delete
    const cellToDelete = timetableData[day][`period${period}`][index];
  
    // Remove the cell at the specified index
    timetableData[day][`period${period}`] = timetableData[day][`period${period}`].filter(
      (_, i) => i !== index
    );
  
    // Update the state with the modified timetable data
    this.setState({ timetableData });
  
    // If needed, you can also handle further actions, such as saving the updated data to the backend.
  };
  
  
  handleSubmit = () => {
    const apiUrl = 'http://127.0.0.1:8000/timetablemodule/tt/savett'; // Replace with the actual URL of your backend route
    const { timetableData } = this.state;
    const code='abc-def-hij';
    const sem='3';
      // Convert the data to JSON
      const dataToSend = JSON.stringify({ timetableData,code });

      // Log the JSON data to the console
      console.log('JSON Data to Send:', dataToSend);

    fetch(apiUrl, {
      method: 'POST', // or 'PUT' or 'PATCH' if needed
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timetableData,code,sem }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Data sent to the backend:', data);
        // You can handle the response from the backend here
      })
      .catch(error => {
        console.error('Error sending data to the backend:', error);
        // Handle any errors here
      });
  };


  render() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
      <div>
        <h1>TIME TABLE</h1>
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
                  {this.state.timetableData[day][`period${period}`].map((subjectData, index) => (
                    <div key={index} className="cell-container">
                      <div className="cell-slot">
                        <select
                          value={subjectData.subject}
                          onChange={(event) => this.handleCellChange(day, period, index, 'subject', event)}
                        >
                          {this.state.availableSubjects.map((subjectOption) => (
                            <option key={subjectOption} value={subjectOption}>
                              {subjectOption}
                            </option>
                          ))}
                        </select>
                        <select
                          value={subjectData.room}
                          onChange={(event) => this.handleCellChange(day, period, index, 'room', event)}
                        >
                          {this.state.availableRooms.map((roomOption) => (
                            <option key={roomOption} value={roomOption}>
                              {roomOption}
                            </option>
                          ))}
                        </select>
                        <select
                          value={subjectData.faculty}
                          onChange={(event) => this.handleCellChange(day, period, index, 'faculty', event)}
                        >
                          {this.state.availableFaculties.map((facultyOption) => (
                            <option key={facultyOption} value={facultyOption}>
                              {facultyOption}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="cell-split-button"
                        onClick={() => this.handleSplitCell(day, period)}
                      >
                        +
                      </button>
                      {index > 0 && (
                    <button
                      className="cell-delete-button"
                      onClick={() => this.handleDeleteCell(day, period, index)}
                    >
                      Delete
                    </button>
                  )}
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </table>
        <button onClick={this.handleSubmit}>Save Timetable</button>
      </div>
    );
    
  }
}

export default Timetable;
