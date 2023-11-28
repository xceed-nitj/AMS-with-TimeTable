import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
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
} from "@chakra-ui/react";import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from "../styles/customStyles";
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
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

// function SuccessMessage({ message }) {
//   return (
//     <div className="success-message">
//       {message}
//     </div>
//   );
// }

// ... (existing imports)

function FirstYearLoad() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });
  const [currentDepartment, setCurrentDepartment] = useState("");
  const [currentSession, setCurrentSession] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const location = useLocation();
  const currentPathname = location.pathname;

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchTTData(currentCode);
  }, []);

  useEffect(() => {
    fetchFirstYearSubjects(currentCode, currentDepartment);
  }, [currentDepartment]);

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCurrentDepartment(data[0].dept);
        setCurrentSession(data[0].session);
      }

      console.log("tt", data);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };

  const fetchFirstYearSubjects = async (currentCode, currentDepartment) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/subject/firstyearsubject/${currentCode}/${currentDepartment}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("subdata", data);

      setAvailableSubjects(data);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };


  return (
    <Container maxW="5xl">
      <Header title="First Year Faculty Allotment"></Header>

      <Box>
        <Box mb="1">
          <Text as="b">First Year Subjects that are being offered in the current semester</Text>
        </Box>

        <Table variant="striped" size="md" mt="1">
          <Thead>
            <Tr>
              <Th>Subject Name</Th>
              <Th>Type</Th>
              <Th>Subject Code</Th>
              <Th>Sub Name</Th>
              <Th>Semester</Th>

              {/* Add more columns as needed */}
            </Tr>
          </Thead>
          <Tbody>
            {availableSubjects.map((subject) => (
              <Tr key={subject._id}>
                <Td>{subject.subjectFullName}</Td>
                <Td>{subject.type}</Td>
                <Td>{subject.subCode}</Td>
                <Td>{subject.subName}</Td>
                <Td>{subject.sem}</Td>

                {/* Add more cells for additional properties */}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      {/* ... (rest of the code) */}
    </Container>
  );
}



export default FirstYearLoad;
