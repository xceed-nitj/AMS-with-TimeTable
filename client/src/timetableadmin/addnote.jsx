import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import {
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Button,
} from '@chakra-ui/react';
import Header from "../components/header";


function Note() {
  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const [sem, setSem] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const [dept, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [semestersFromMasterSem, setSemestersFromMasterSem] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchDepartmentData();
    fetchFacultyOptions();
    fetchRoomOptions();
    fetchNotes();
  }, []);

  // useEffect(() => {
  //   if (dept) {
  //     fetchSemestersFromMasterSem();
  //   }
  // }, [dept]);

  const fetchDepartmentData = () => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setDepartment(data[0].dept);
      })
      .catch(handleError);
  };

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`, {
      credentials: "include",
    })
      .then(handleResponse)
      .then((data) => {
        setSemestersFromMasterSem(data);
      })
      .catch(handleError);
  }, [currentCode]);

  const fetchFacultyOptions = () => {
    fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const options = data.map((faculty) => faculty);
        setFacultyOptions(options);
      })
      .catch(handleError);
  };

  const fetchRoomOptions = () => {
    fetch(`${apiUrl}/timetablemodule/addroom/code/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const options = data;
        setRoomOptions(options);
      })
      .catch(handleError);
  };

  const fetchNotes = () => {
    fetch(`${apiUrl}/timetablemodule/note/code/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setNotes(data);
      })
      .catch(handleError);
  };

  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  const handleSubmit = () => {
    setIsLoading(true);

    const dataToSave = {
      sem: sem,
      room: room,
      note: note,
      faculty: faculty,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        fetchNotes(); // Refetch notes after adding a new one
        setIsLoading(false);
        setSem('');
        setRoom('');
        setNote('');
        setFaculty('');
      })
      .catch((error) => {
        console.error('Error:', error);
        setIsLoading(false);
      });
  };

  const handleEdit = (id) => {
    setIsEditing(true);
    setEditId(id);

    const noteToEdit = notes.find((note) => note._id === id);

    setSem(noteToEdit.sem);
    setRoom(noteToEdit.room);
    setNote(noteToEdit.note);
    setFaculty(noteToEdit.faculty);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setSem('');
    setRoom('');
    setNote('');
    setFaculty('');
  };

  const handleUpdate = () => {
    setIsLoading(true);
  
    const dataToUpdate = {
      sem: sem,
      room: room,
      note: note,
      faculty: faculty,
    };
  
    fetch(`${apiUrl}/timetablemodule/note/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToUpdate),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        fetchNotes();
        setIsEditing(false);
        setEditId(null);
        setSem('');
        setRoom('');
        setNote('');
        setFaculty('');
      })
      .catch((error) => {
        console.error('Error:', error);
      })
      .finally(() => {
        setIsLoading(false); // Reset loading state
      });
  };
  

  const handleDelete = (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this note?');
  
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/note/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          fetchNotes();
        })
        .catch(handleError);
    }
  };
  

  return (
    <Container maxW="5xl">
     <Header title="Add Note"></Header>
     
      <form
        onSubmit={(e) => {
          e.preventDefault();
          isEditing ? handleUpdate() : handleSubmit();
        }}
      >
        <FormControl mb="2.5">
          <FormLabel>Semester:</FormLabel>
          <Select value={sem} onChange={(e) => setSem(e.target.value)}>
            <option value="" disabled>
              Select Semester
            </option>
            {semestersFromMasterSem.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl mb="2.5">
          <FormLabel>Faculty:</FormLabel>
          <Select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          >
            <option value="" disabled>
              Select Faculty
            </option>
            {facultyOptions.map((facultyOption) => (
              <option key={facultyOption} value={facultyOption}>
                {facultyOption}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl mb="2.5">
          <FormLabel>Room:</FormLabel>
          <Select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          >
            <option value="" disabled>
              Select Room
            </option>
            {roomOptions &&
              roomOptions.length > 0 &&
              roomOptions.map((roomOption) => (
                <option key={roomOption} value={roomOption}>
                  {roomOption}
                </option>
              ))}
          </Select>
        </FormControl>
        <FormControl mb="2.5">
          <FormLabel>Note:</FormLabel>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormControl>
        <Button
          type="button"
          ml="2"
          mb="3"
          colorScheme="teal"
          onClick={handleCancelEdit}
          display={isEditing ? 'inline-block' : 'none'}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          ml="2"
          mb="3"
          colorScheme="teal"
          isLoading={isLoading}
        >
          {isEditing ? 'Update' : 'Submit'}
        </Button>
      </form>

      <Heading as="h2" size="lg" mt="8" mb="4">
        Notes
      </Heading>
      <p>Total Entries: {notes.length}</p>
      <table>
        <thead>
          <tr>
            <th>Semester</th>
            <th>Room</th>
            <th>Faculty</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note._id}>
              <td>{note.sem}</td>
              <td>{note.room}</td>
              <td>{note.faculty}</td>
              <td>{note.note}</td>
              <td>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={() => handleEdit(note._id)}
                >
                  Edit
                </Button>
                <Button
                  colorScheme="red"
                  size="sm"
                  ml="2"
                  onClick={() => handleDelete(note._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}

export default Note;
