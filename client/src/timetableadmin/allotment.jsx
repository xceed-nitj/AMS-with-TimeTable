import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import {
  Container,
  FormLabel,
  Heading,
  Select,
  Button,
  Checkbox,
  Box,
  Text
} from '@chakra-ui/react';
import { useToast } from "@chakra-ui/react";


const AllotmentForm = () => {
    const [formData, setFormData] = useState({
      session: '',
      centralisedAllotments: [
        { dept: '', rooms: [{ room: '', morningSlot: false, afternoonSlot: false }] },
      ],
      openElectiveAllotments: [
        { dept: '', rooms: [{ room: '', morningSlot: false, afternoonSlot: false }] },
      ],
    });

  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const apiUrl = getEnvironment();
  const [session,setSession]=useState();
  const toast = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastersem/dept`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          console.error("Failed to fetch departments");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchMasterRooms = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/masterroom?type=Centralised Classroom`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const roomNames = data.map(room => room.room);
          setRooms(roomNames);
        } else {
          console.error("Failed to fetch departments");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/allotment/session`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include'
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error("Failed to fetch sessions");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSessions();
    fetchDepartments();
    fetchMasterRooms();

  }, []);

    const fetchExistingData = async (session) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/allotment?session=${session}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Data from backend:', data);
  
          // Assuming you have only one item in the array (as per your example)
          const [allotmentData] = data;
  
          setFormData({
            session: allotmentData.session,
            centralisedAllotments: allotmentData.centralisedAllotments ||[],
            openElectiveAllotments: allotmentData.openElectiveAllotments || [],
          });
        } else {
          console.error('Failed to fetch existing data');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // fetchExistingData(sessions[0]);

  const handleChange = (e, deptIndex, roomIndex, type) => {
    const { name, value, type: inputType, checked } = e.target;

    setFormData((prevData) => {
      const updatedAllotments = [...prevData[type]];

      if (name === 'dept') {
        updatedAllotments[deptIndex][name] = value;
      } else if (name === 'room') {
        if (roomIndex !== null) {
          updatedAllotments[deptIndex].rooms[roomIndex][name] = value;
        } else {
          updatedAllotments[deptIndex][name] = value;
        }
      } else {
        updatedAllotments[deptIndex].rooms[roomIndex] = {
          ...updatedAllotments[deptIndex].rooms[roomIndex],
          [name]: inputType === 'checkbox' ? checked : value,
        };
      }

      return {
        ...prevData,
        [type]: updatedAllotments,
      };
    });
  };

  const handleAddRoom = (deptIndex, type) => {
    const updatedAllotments = [...formData[type]];
    updatedAllotments[deptIndex].rooms.push({ room: '', morningSlot: false, afternoonSlot: false });

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));
  };

  const handleRemoveRoom = (deptIndex, roomIndex, type) => {
    const updatedAllotments = [...formData[type]];
    updatedAllotments[deptIndex].rooms.splice(roomIndex, 1);

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));
  };

  const handleAddAllotment = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: [
        ...prevData[type],
        { dept: '', rooms: [{ room: '', morningSlot: false, afternoonSlot: false }] },
      ],
    }));
  };

  const handleAddRoomOpenElective = (deptIndex) => {
    const updatedAllotments = [...formData.openElectiveAllotments];
    updatedAllotments[deptIndex].rooms.push({ room: '', morningSlot: false, afternoonSlot: false });

    setFormData((prevData) => ({
      ...prevData,
      openElectiveAllotments: updatedAllotments,
    }));
  };

  const handleRemoveAllotment = (deptIndex, type) => {
    const updatedAllotments = [...formData[type]];
    updatedAllotments.splice(deptIndex, 1);
  
    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));
  };
  


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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

      console.log('Allotment created successfully');
      toast({
        position: 'top',
        title: "Allotment Updated Successfully",
        // description: "",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error creating allotment:', error.message);
    }
  };

  return (
    <Container maxW="5xl">
    <Box>

    <form onSubmit={handleSubmit}>
      <Heading>Allotment</Heading>
      <FormLabel>Session:</FormLabel>
      <Select
  name="session"
  value={formData.session}
  isInvalid={!formData.session}  // Highlight the field if it's empty
  errorBorderColor="red.300"      // Customize the border color for the error state
  onChange={(e) => {
    const selectedSession = e.target.value;
    setSession(selectedSession);
    setFormData({ ...formData, session: selectedSession });
    fetchExistingData(selectedSession);
  }}
>
  <option value="">Select a Session</option>
  {sessions.length > 0 &&
    sessions.map((session, index) => (
      <option key={index} value={session}>
        {session}
      </option>
    ))}
</Select>
{!formData.session && (
  <Text color="red.500" fontSize="sm">
    {/* Display an error message */}
    Session is required.
  </Text>
)}


      <Heading>Centralised Room Allotment</Heading>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Room</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.centralisedAllotments.map((allotment, deptIndex) => (
            <tr key={`centralisedDeptRow-${deptIndex}`}>
              <td>
                <Select
                  name="dept"
                  value={allotment.dept}
                  onChange={(e) => handleChange(e, deptIndex, null, 'centralisedAllotments')}
                >
                  <option key={`centralisedDefaultDept-${deptIndex}`} value="">
                    Select Department
                  </option>
                  {departments.map((department, index) => (
                    <option key={`centralisedDept-${index}`} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </td>
              <td>
  {allotment.rooms.map((room, roomIndex) => (
    <div key={`centralisedRoom-${deptIndex}-${roomIndex}`}>
      <Select
        name="room"
        value={room.room}
        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
      >
        <option key={`centralisedDefaultRoom-${deptIndex}-${roomIndex}`} value="">
          Select Room
        </option>
        {rooms.map((room, index) => (
          <option key={`centralisedRoom-${index}`} value={room}>
            {room}
          </option>
        ))}
      </Select>
      <Checkbox
        name="morningSlot"
        isChecked={room.morningSlot}
        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
      >
        Morning Slot
      </Checkbox>
      <Checkbox
        name="afternoonSlot"
        isChecked={room.afternoonSlot}
        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
      >
        Afternoon Slot
      </Checkbox>
      <div>
      <Button
        type="Button"
        onClick={() => handleAddRoom(deptIndex, 'centralisedAllotments')}
      >
        Add Room
      </Button>
      <Button
        type="Button"
        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'centralisedAllotments')}
      >
        Remove Room
      </Button>
      </div>       
                  </div>
                ))}
               
              </td>
              <td>
              <Button
                type="button"
                onClick={() => handleRemoveAllotment(deptIndex, 'centralisedAllotments')}
              >
                Remove Allotment
              </Button>
            </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        type="Button"
        onClick={() => handleAddAllotment('centralisedAllotments')}
      >
        Add Allotment
      </Button>
      <Button type="submit">Submit</Button>

      <Heading>Open Elective Room Allotment</Heading>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Room</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.openElectiveAllotments.map((allotment, deptIndex) => (
            <tr key={`openElectiveDeptRow-${deptIndex}`}>
              <td>
                <Select
                  name="dept"
                  value={allotment.dept}
                  onChange={(e) => handleChange(e, deptIndex, null, 'openElectiveAllotments')}
                >
                  <option key={`openElectiveDefaultDept-${deptIndex}`} value="">
                    Select Department
                  </option>
                  {departments.map((department, index) => (
                    <option key={`openElectiveDept-${index}`} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </td>
              <td>
  {allotment.rooms.map((room, roomIndex) => (
    <div key={`openElectiveRoom-${deptIndex}-${roomIndex}`}>
      <Select
        name="room"
        value={room.room}
        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'openElectiveAllotments')}
      >
        <option key={`openElectiveDefaultRoom-${deptIndex}-${roomIndex}`} value="">
          Select Room
        </option>
        {rooms.map((room, index) => (
          <option key={`openElectiveRoom-${index}`} value={room}>
            {room}
          </option>
        ))}
      </Select>
      {/* Other controls (e.g., checkboxes) here */}
      <Button
        type="Button"
        onClick={() => handleAddRoomOpenElective(deptIndex)}
      >
        Add Room
      </Button>
      <Button
        type="Button"
        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'openElectiveAllotments')}
      >
        Remove Room
      </Button>
    </div>

))}
</td>
<td>
  <Button
    type="button"
    onClick={() => handleRemoveAllotment(deptIndex, 'openElectiveAllotments')}
  >
    Remove Allotment
  </Button>
  </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        type="Button"
        onClick={() => handleAddAllotment('openElectiveAllotments')}
      >
        Add Allotment
      </Button>

      <Button type="submit">Submit</Button>
    </form>
</Box>
    </Container>

  );
};

export default AllotmentForm;
