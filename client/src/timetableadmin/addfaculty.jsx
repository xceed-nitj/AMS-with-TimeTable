import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getEnvironment from "../getenvironment";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Text,
  chakra,
  Checkbox,
} from "@chakra-ui/react";
import { CustomTh, CustomLink, CustomBlueButton } from "../styles/customStyles";
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";


// function SuccessMessage({ message }) {
//   return <div className="success-message">{message}</div>;
// }


function Component() {
  const toast = useToast();
  const [sem, setSem] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  // const [successMessage, setSuccessMessage] = useState("");
  const [facultyData, setFacultyData] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  // ...
const [selectedFaculties, setSelectedFaculties] = useState([]);
// ...

  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });

  const [editFacultyData] = useState({
    facultyId: null,
    facultyName: "",
  });

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        setAvailableSemesters(data);
      })
      .catch(handleError);
  }, [currentCode]);

  useEffect(() => {
    fetchFacultyData();
    fetchAvailableDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`,{credentials: 'include',})
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const fetchFacultyData = () => {
    fetch(`${apiUrl}/timetablemodule/addFaculty`,{credentials: 'include',})
      .then(handleResponse)
      .then((data) => {
        const filteredFacultyData = data.filter(
          (faculty) => faculty.code === currentCode
        );
        setFacultyData(filteredFacultyData);
      })
      .catch(handleError);
  };

  const fetchAvailableDepartments = () => {
    fetch(`${apiUrl}/timetablemodule/faculty/dept`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        const formattedDepartments = data.map((department) => ({
          value: department,
          label: department,
        }));
        setAvailableDepartments(formattedDepartments);
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
    console.error("Error:", error);
  };

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setSelectedDepartment(selectedDepartment);
  };

  const handleSubmit = () => {
    const dataToSave = {
      sem: sem,
      code: currentCode,
      faculty: selectedFaculties,
    };

    fetch(`${apiUrl}/timetablemodule/addFaculty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        toast({
          title: "Faculty Added",
          description: "Selected faculty added to the sem",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        // setSuccessMessage('Data saved successfully!');
        fetchFacultyData();
      })
      .catch(handleError);
  };

  const handleDelete = (facultyId, facultyName) => {
    const facultyToDelete = facultyData.find(
      (faculty) => faculty._id === facultyId
    );
  
    if (facultyToDelete) {
      const isConfirmed = window.confirm(
        `Are you sure you want to delete ${facultyName}?`
      );
  
      if (isConfirmed) {
        setIsLoading({
          state: true,
          id: facultyId,
        });
        const updatedFaculty = facultyToDelete.faculty.filter(
          (name) => name !== facultyName
        );
        facultyToDelete.faculty = updatedFaculty;
  
        fetch(`${apiUrl}/timetablemodule/addFaculty/${facultyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(facultyToDelete),
          credentials: 'include',
        })
          .then(handleResponse)
          .then(() => {
            fetchFacultyData();
          })
          .catch(handleError)
          .finally(() => {
            setIsLoading({
              ...isLoading,
              state: false,
            });
          });
      }
    }
  };
  

  const handleFacultyCheckboxChange = (facultyName) => {
    setSelectedFaculties((prevSelectedFaculties) => {
      if (prevSelectedFaculties.includes(facultyName)) {
        return prevSelectedFaculties.filter((name) => name !== facultyName);
      } else {
        return [...prevSelectedFaculties, facultyName];
      }
    });
  };
  

  return (
    <Container maxW="5xl">
      <Header title="Add Faculty"></Header>
      {/* <Heading as="h1" size="xl" mt="6" mb="6">
        Add Faculty
      </Heading> */}
      {/* <SuccessMessage message={successMessage} /> */}
      <chakra.form
        mt="1"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <FormControl isRequired mb="2.5">
          <FormLabel>Semester:</FormLabel>
          <Select
            value={sem}
            onChange={(e) => setSem(e.target.value)}
            isRequired
          >
            <option value="" disabled>
              Select Semester
            </option>
            {availableSemesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired mb="2.5">
          <FormLabel>Department:</FormLabel>
          <Select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            isRequired
          >
            <option value="">Select a Department</option>
            {availableDepartments.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl mb="2.5">
  <FormLabel>Faculty:</FormLabel>
  {faculties.map((faculty, index) => (
  <Checkbox
    key={index}
    value={faculty.name}
    isChecked={selectedFaculties.includes(faculty.name)}
    onChange={() => handleFacultyCheckboxChange(faculty.name)}
    ml="2"
    mb="2"
  >
    {faculty.name}
  </Checkbox>
))}
</FormControl>

        <FormControl>
          <Button
            type="submit"
            ml="0"
            mb="3"
            sx={{
              bgColor: "teal !important",
            }}
          >
            Submit
          </Button>
        </FormControl>
      </chakra.form>
      <div>
        <TableContainer>
          <Text as="b">Faculty Data(Total Entries: {facultyData.length}):</Text>
          <Table variant={"striped"} mt="1">
            <Thead>
              <Tr>
                <Th>
                  <Center>Semester</Center>
                </Th>
                <Th>
                  <Center>Faculty</Center>
                </Th>
                <Th>
                  <Center>Actions</Center>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {facultyData.map((faculty) =>
                faculty.faculty.map((individualFaculty, index) => (
                  <Tr key={`${faculty._id}-${index}`}>
                    <Td>
                      <Center>{faculty.sem}</Center>
                    </Td>
                    <Td>
                      <Center>{individualFaculty}</Center>
                    </Td>
                    <Td>
                      <Center>
                        <Button
                          isLoading={
                            isLoading.state && isLoading.id == faculty._id
                          }
                          bg="teal"
                          color="white"
                          onClick={() =>
                            handleDelete(faculty._id, individualFaculty)
                          }
                        >
                          Delete
                        </Button>
                      </Center>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}

export default Component;