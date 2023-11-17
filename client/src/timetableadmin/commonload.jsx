import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

function CommonLoadComponent() {
  const toast = useToast();
  const [faculty, setFaculty] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subFullName, setSubFullName] = useState("");
  const [subName, setSubName] = useState("");
  const [hrs, setHrs] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [commonLoadData, setCommonLoadData] = useState([]);
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });
  const [selectedCommonLoad, setSelectedCommonLoad] = useState(null);

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchCommonLoadData();
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        setSelectedDepartment(data[0].dept);
      })
      .catch(handleError);
  }, [currentCode]);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`, { credentials: 'include' })
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/subject/code/${currentCode}`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        setSubjectOptions(data);
      })
      .catch(handleError);
  }, [currentCode]);

  const handleFacultyCheckboxChange = (facultyName) => {
    setSelectedFaculties((prevSelectedFaculties) => {
      const updatedFaculties = prevSelectedFaculties.includes(facultyName)
        ? prevSelectedFaculties.filter((name) => name !== facultyName)
        : [...prevSelectedFaculties, facultyName];

      return updatedFaculties;
    });
  };

  const fetchCommonLoadData = () => {
    fetch(`${apiUrl}/timetablemodule/commonLoad`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        setCommonLoadData(data);
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

  const handleSubmit = () => {
    const dataToSaveArray = selectedFaculties.map((facultyName) => ({
      faculty: facultyName,
      subCode: subCode,
      subFullName: subFullName,
      subName: subName,
      hrs: hrs,
      code: currentCode,
    }));

    Promise.all(
      dataToSaveArray.map((dataToSave) =>
        fetch(`${apiUrl}/timetablemodule/commonLoad`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
          credentials: "include",
        })
          .then(handleResponse)
          .catch(handleError)
      )
    )
      .then(() => {
        toast({
          title: "CommonLoad Added",
          description: "CommonLoad data added successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchCommonLoadData();
      })
      .catch(handleError);
  };

  const handleDelete = (commonLoadId) => {
    setIsLoading({
      state: true,
      id: commonLoadId,
    });

    fetch(`${apiUrl}/timetablemodule/commonLoad/${commonLoadId}`, {
      method: "DELETE",
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        fetchCommonLoadData();
      })
      .catch(handleError)
      .finally(() => {
        setIsLoading({
          ...isLoading,
          state: false,
        });
      });
  };

  const handleChange = (e) => {
    const selectedSubCode = e.target.value;
    setSubCode(selectedSubCode);

    const selectedSubject = subjectOptions.find(option => option.subCode === selectedSubCode);

    if (selectedSubject) {
      setSubFullName(selectedSubject.subjectFullName);
      setSubName(selectedSubject.subName);
    }
  };

  const handleEdit = (commonLoadId) => {
    const selectedCommonLoad = commonLoadData.find(
      (commonLoad) => commonLoad._id === commonLoadId
    );

    setSelectedCommonLoad(selectedCommonLoad);
    setFaculty(selectedCommonLoad.faculty);
    setSubCode(selectedCommonLoad.subCode);
    setSubFullName(selectedCommonLoad.subFullName);
    setSubName(selectedCommonLoad.subName);
    setHrs(selectedCommonLoad.hrs);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setSelectedCommonLoad(null);
    setFaculty("");
    setSubCode("");
    setSubFullName("");
    setSubName("");
    setHrs("");
  };

  const handleUpdate = () => {
    const dataToUpdate = {
      faculty: faculty,
      subCode: subCode,
      subFullName: subFullName,
      subName: subName,
      hrs: hrs,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/commonLoad/${selectedCommonLoad._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToUpdate),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        toast({
          title: "CommonLoad Updated",
          description: "CommonLoad data updated successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchCommonLoadData();
      })
      .catch(handleError);

    setSelectedCommonLoad(null);
    setFaculty("");
    setSubCode("");
    setSubFullName("");
    setSubName("");
    setHrs("");
  };

  return (
    <Container maxW="5xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        CommonLoad
      </Heading>
      <chakra.form
        mt="1"
        onSubmit={(e) => {
          e.preventDefault();
          selectedCommonLoad ? handleUpdate() : handleSubmit();
        }}
      >
        <FormControl isRequired mb="2.5">
          <FormLabel>Subject Code:</FormLabel>
          <Select
            value={subCode}
            onChange={handleChange}
            placeholder="Select Subject Code"
            isRequired
          >
            {subjectOptions.map((option) => (
              <option key={option._id} value={option.subCode}>
                {option.subCode}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>SubName:</FormLabel>
          <Input
            type="text"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="Enter SubName"
            isRequired
          />
        </FormControl>
        <FormControl>
          <FormLabel>SubFullName:</FormLabel>
          <Input
            type="text"
            value={subFullName}
            onChange={(e) => setSubFullName(e.target.value)}
            placeholder="Enter SubFullName"
            isRequired
          />
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
          <FormLabel>Hrs:</FormLabel>
          <Input
            type="text"
            value={hrs}
            onChange={(e) => setHrs(e.target.value)}
            placeholder="Enter Hrs"
            isRequired
          />
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
          <Text as="b">CommonLoad Data</Text>
          <Table variant={"striped"} mt="1">
            <Thead>
              <Tr>
                <Th>
                  <Center>Faculty</Center>
                </Th>
                <Th>
                  <Center>SubCode</Center>
                </Th>
                <Th>
                  <Center>SubFullName</Center>
                </Th>
                <Th>
                  <Center>SubName</Center>
                </Th>
                <Th>
                  <Center>Hrs</Center>
                </Th>
                <Th>
                  <Center>Actions</Center>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {commonLoadData.map((commonLoad) => (
                <Tr key={commonLoad._id}>
                  <Td>
                    <Center>{commonLoad.faculty}</Center>
                  </Td>
                  <Td>
                    <Center>{commonLoad.subCode}</Center>
                  </Td>
                  <Td>
                    <Center>{commonLoad.subFullName}</Center>
                  </Td>
                  <Td>
                    <Center>{commonLoad.subName}</Center>
                  </Td>
                  <Td>
                    <Center>{commonLoad.hrs}</Center>
                  </Td>
                  <Td>
                    <Center>
                      <Button
                        mr="2"
                        bg="teal"
                        color="white"
                        onClick={() => handleEdit(commonLoad._id)}
                      >
                        Edit
                      </Button>
                      <Button
                        isLoading={isLoading.state && isLoading.id === commonLoad._id}
                        bg="red"
                        color="white"
                        onClick={() => handleDelete(commonLoad._id)}
                      >
                        Delete
                      </Button>
                    </Center>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}

export default CommonLoadComponent;
