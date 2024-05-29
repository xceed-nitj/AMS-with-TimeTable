import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {CustomTh, CustomLink,CustomBlueButton, CustomTealButton, CustomDeleteButton} from '../styles/customStyles';
import {
  Container,
  FormLabel,
  Heading,
  Select,
  Input,
  Button,
  Checkbox,
  Box,
  Text,
} from '@chakra-ui/react';
import { Link } from "react-router-dom";
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
      messaage:'',
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
          // console.log('Data from backend:', data);
  
          // Assuming you have only one item in the array (as per your example)
          const [allotmentData] = data;
  
          setFormData({
            session: allotmentData.session,
            centralisedAllotments: allotmentData.centralisedAllotments ||[],
            openElectiveAllotments: allotmentData.openElectiveAllotments || [],
            message:allotmentData.message||"No message",  
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

      // console.log('Allotment created successfully');
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
      <Header title="Allotment"></Header>
      <Link to="/tt/allotment/import">
          <CustomTealButton>Import allotment from previous session</CustomTealButton>
                </Link>

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
 <Heading>Message to timetable coordinators</Heading>
 {!formData.session && (
  <Text color="green.500" fontSize="sm">
    Send a note to coordinators. This will be displayed in centrally alloted room page.
  </Text>
)}

{/* Add the new input field here */}
<Input
  mt={4} // Add some top margin for spacing
  placeholder="Enter your message"
  value={formData.message}
  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
/>
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
      <CustomTealButton
        type="Button"
        onClick={() => handleAddRoom(deptIndex, 'centralisedAllotments')}
      >
        Add Room
      </CustomTealButton>
      <CustomDeleteButton
        type="Button"
        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'centralisedAllotments')}
      >
        Remove Room
      </CustomDeleteButton>
      </div>       
                  </div>
                ))}
               
              </td>
              <td>
              <CustomDeleteButton
                type="button"
                onClick={() => handleRemoveAllotment(deptIndex, 'centralisedAllotments')}
              >
                Remove Allotment
              </CustomDeleteButton>
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
      <CustomTealButton
        type="Button"
        onClick={() => handleAddRoomOpenElective(deptIndex)}
      >
        Add Room
      </CustomTealButton>
      <CustomDeleteButton
        type="Button"
        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'openElectiveAllotments')}
      >
        Remove Room
      </CustomDeleteButton>
    </div>

))}
</td>
<td>
  <CustomDeleteButton
    type="button"
    onClick={() => handleRemoveAllotment(deptIndex, 'openElectiveAllotments')}
  >
    Remove Allotment
  </CustomDeleteButton>
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
