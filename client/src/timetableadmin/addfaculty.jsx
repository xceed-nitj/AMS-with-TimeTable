import React, { useState, useEffect } from "react";
import {
  Container,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Checkbox,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import Header from "../components/header";
import { CustomDeleteButton } from "../styles/customStyles";

function Component() {
  const toast = useToast();
  const [sem, setSem] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`, {
      credentials: "include",
    })
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
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`, {
        credentials: "include",
      })
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const fetchFacultyData = () => {
    fetch(`${apiUrl}/timetablemodule/addFaculty`, {
      credentials: "include",
    })
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
    fetch(`${apiUrl}/timetablemodule/faculty/dept`, {
      credentials: "include",
    })
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

  const handleCheckboxChange = (facultyName) => {
    if (selectedFaculties.includes(facultyName)) {
      setSelectedFaculties((prevSelected) =>
        prevSelected.filter((faculty) => faculty !== facultyName)
      );
    } else {
      setSelectedFaculties((prevSelected) => [...prevSelected, facultyName]);
    }
  };

  const handleSubmit = () => {
    const dataToSave = selectedFaculties.map((faculty) => ({
      sem: sem,
      code: currentCode,
      faculty: faculty,
    }));
  
    Promise.all(
      dataToSave.map((data) =>
        fetch(`${apiUrl}/timetablemodule/addFaculty`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        }).then(handleResponse)
      )
    )
      .then(() => {
        toast({
          position: "top",
          title: "Faculty Added",
          description: "We've created your account for you.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchFacultyData();
        setSelectedFaculties([]); // Clear the selected faculties array
      })
      .catch(handleError);
  };
  
  

  const handleDelete = (facultyId, facultyName) => {
    const facultyToDelete = facultyData.find(
      (faculty) => faculty._id === facultyId
    );

    if (facultyToDelete) {
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
        credentials: "include",
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
  };

  return (
    <Container maxW="5xl">
      <Header title="Add Faculty" />
      <form
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
            mb="2.5"
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

        <FormControl mb="2.5">
          <FormLabel>Department:</FormLabel>
          <Select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            mb="2.5"
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
          {faculties.map((faculty) => (
            <Checkbox
              key={faculty.id}
              isChecked={selectedFaculties.includes(faculty.name)}
              onChange={() => handleCheckboxChange(faculty.name)}
            >
              {faculty.name}
            </Checkbox>
          ))}
        </FormControl>

        <Button
          type="submit"
          ml="0"
          mb="3"
          width="200px"
          sx={{
            bgColor: "teal !important",
          }}
        >
          Submit
        </Button>
      </form>

      <div>
        <Table>
          <Text as="b">Faculty Data</Text>
          <Thead>
            <Tr>
              <Th>Semester</Th>
              <Th>Faculty</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {facultyData.map((faculty) =>
              faculty.faculty.map((individualFaculty, index) => (
                <Tr key={`${faculty._id}-${index}`}>
                  <Td>{faculty.sem}</Td>
                  <Td>{individualFaculty}</Td>
                  <Td>
                    <CustomDeleteButton
                      isLoading={isLoading.state && isLoading.id == faculty._id}
                      onClick={() =>
                        handleDelete(faculty._id, individualFaculty)
                      }
                    >
                      Delete
                    </CustomDeleteButton>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>
    </Container>
  );
}

export default Component;
