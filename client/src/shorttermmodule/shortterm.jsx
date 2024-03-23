import React, { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  chakra,
  Checkbox,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import Header from "../components/header";
import getEnvironment from "../getenvironment";

function ShortTerm() {
  const toast = useToast();
  const [GuestOfHonour, setGuestOfHonour] = useState({
    name: "",
    designation: "",
    affiliation: "",
  });
  const [ResourcePerson, setResourcePerson] = useState({
    name: "",
    designation: "",
    affiliation: "",
  });
  const [Patron, setPatron] = useState({
    name: "",
    designation: "",
    affiliation: "",
  });
  const [CourseConveners, setCourseConveners] = useState({
    name: "",
    designation: "",
    affiliation: "",
  });
  const [CourseCoordinators, setCourseCoordinators] = useState({
    name: "",
    designation: "",
    affiliation: "",
  });
  const [Contact, setContact] = useState({
    name: "",
    contactType: "",
    
  });
  const [AboutCollege, setAboutCollege] = useState([]);
  const [AboutDepartment, setAboutDepartment] = useState();
  const [Objective, setObjective] = useState();
  const [Eligibility, setEligibility] = useState();
  const [NoteForParticipant, setNoteForParticipant] = useState();
  const [Registration, setRegistration] = useState();
  const [Confirmation, setConfirmation] = useState();
  const [StartingDate, setStartingDate] = useState();
  const [title1, settitle1] = useState();
  const [title2, settitle2] = useState();
  const [banner, setbanner] = useState();
  const [eventId, seteventId] = useState();


  // Add other necessary state variables as needed

  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = getEnvironment();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from the server
        const response = await fetch(`${apiUrl}/someEndpoint`);
        const result = await response.json();

        // Update the state with the fetched data
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Call the fetchData function when the component mounts
    fetchData();
  }, []); 
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
    const dataToSave = {
      GuestOfHonour: [GuestOfHonour],
      // Add other form data as needed
    };

    setIsLoading(true);

    fetch(`${apiUrl}/coursemodule/shortterm`, {
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
          title: "Data Saved",
          description: "Your success message here.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        // Additional actions on successful data submission
      })
      .catch(handleError)
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Container maxW="5xl">
      <Header title="Short Term Course" />
      <chakra.form
        mt="1"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}>
          {/*Guest Of Honour*/}
        <FormControl  mb="2.5">
        
        <FormLabel>Guest Of Honour:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name'
            value={GuestOfHonour.name}
            onChange={(e) => setGuestOfHonour({ ...GuestOfHonour, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Designation:</FormLabel>
          <Input placeholder='Enter Designation'
            value={GuestOfHonour.designation}
            onChange={(e) => setGuestOfHonour({ ...GuestOfHonour, designation: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Affiliation:</FormLabel>
          <Input placeholder='Enter Affiliation'
            value={GuestOfHonour.affiliation}
            onChange={(e) => setGuestOfHonour({ ...GuestOfHonour, affiliation: e.target.value })}
      
          />
        </FormControl>

        {/*Resource Person*/}

        <FormControl  mb="2.5">
        <FormLabel>Resource Person:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name' 
            value={ResourcePerson.name}
            onChange={(e) => setResourcePerson({ ...ResourcePerson, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Designation:</FormLabel>
          <Input placeholder='Enter Designation'
            value={ResourcePerson.designation}
            onChange={(e) => setResourcePerson({ ...ResourcePerson, designation: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Affiliation:</FormLabel>
          <Input placeholder='Enter Affiliation'
            value={ResourcePerson.affiliation}
            onChange={(e) => setResourcePerson({ ...ResourcePerson, affiliation: e.target.value })}
      
          />
        </FormControl>

        {/*Patron*/}

        <FormControl  mb="2.5">
        <FormLabel>Patron:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name'
            value={Patron.name}
            onChange={(e) => setPatron({ ...Patron, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Designation:</FormLabel>
          <Input placeholder='Enter Designation'
            value={Patron.designation}
            onChange={(e) => setPatron({ ...Patron, designation: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Affiliation:</FormLabel>
          <Input placeholder='Enter Affiliation'
            value={Patron.affiliation}
            onChange={(e) => setPatron({ ...Patron, affiliation: e.target.value })}
      
          />
        </FormControl>

        {/*Course Conveners*/}

        <FormControl  mb="2.5">
        <FormLabel>Course Conveners:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name'
            value={CourseConveners.name}
            onChange={(e) => setCourseConveners({ ...CourseConveners, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Designation:</FormLabel>
          <Input placeholder='Enter Designation'
            value={CourseConveners.designation}
            onChange={(e) => setCourseConveners({ ...CourseConveners, designation: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Affiliation:</FormLabel>
          <Input placeholder='Enter Affiliation'
            value={CourseConveners.affiliation}
            onChange={(e) => setCourseConveners({ ...CourseConveners, affiliation: e.target.value })}
      
          />
        </FormControl>

{/*CourseCoordinators*/}

        <FormControl  mb="2.5">
        <FormLabel>Course Coordinators:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name'
            value={CourseCoordinators.name}
            onChange={(e) => setCourseCoordinators({ ...CourseCoordinators, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Designation:</FormLabel>
          <Input placeholder='Enter Designation'
            value={CourseCoordinators.designation}
            onChange={(e) => setCourseCoordinators({ ...CourseCoordinators, designation: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Affiliation:</FormLabel>
          <Input placeholder='Enter Affiliation'
            value={CourseCoordinators.affiliation}
            onChange={(e) => setCourseCoordinators({ ...CourseCoordinators, affiliation: e.target.value })}
      
          />
        </FormControl>

 {/*Contact*/}

 <FormControl  mb="2.5">
        <FormLabel>Contact:</FormLabel>
          <FormLabel>Name:</FormLabel>
          <Input placeholder='Enter Name'
            value={Contact.name}
            onChange={(e) => setContact({ ...Contact, name: e.target.value })}
            
          />
        </FormControl>
        <FormControl  mb="2.5">
          <FormLabel>Contact Type:</FormLabel>
          <Input placeholder='Enter Contact Type'
            value={Contact.contactType}
            onChange={(e) => setContact({ ...Contact, contactType: e.target.value })}
            
          />
        </FormControl>
        

{/*AboutCollege*/}

<FormControl  mb="2.5">
        
          <FormLabel>About College:</FormLabel>
          <Input placeholder='Enter description about college'
          type="text"
            value={AboutCollege}
            onChange={(e) => setAboutCollege(e.target.value )}
            
          />
        </FormControl>
        {/*AboutDepartment*/}

<FormControl  mb="2.5">
        
          <FormLabel>About Department:</FormLabel>
          <Input placeholder='Enter description About Department'
          type="text"
            value={AboutDepartment}
            onChange={(e) => setAboutDepartment(e.target.value )}
            
          />
        </FormControl>
                {/*Objective*/}

<FormControl  mb="2.5">
        
        <FormLabel>Objective:</FormLabel>
        <Input placeholder='Enter description About Objective'
        type="text"
          value={Objective}
          onChange={(e) => setObjective(e.target.value )}
          
        />
      </FormControl>
              {/*Eligibility*/}

<FormControl  mb="2.5">
        
        <FormLabel>Eligibility:</FormLabel>
        <Input placeholder='Enter the Eligibility Criteria'
        type="text"
          value={Eligibility}
          onChange={(e) => setEligibility(e.target.value )}
          
        />
      </FormControl>
              {/*NoteForParticipant*/}

<FormControl  mb="2.5">
        
        <FormLabel>NoteForParticipant:</FormLabel>
        <Input placeholder='Enter Note For Participant'
        type="text"
          value={NoteForParticipant}
          onChange={(e) => setNoteForParticipant(e.target.value )}
          
        />
      </FormControl>
              {/*Registration*/}

<FormControl  mb="2.5">
        
        <FormLabel>Registration:</FormLabel>
        <Input placeholder='Enter Registration details'
        type="text"
          value={Registration}
          onChange={(e) => setRegistration(e.target.value )}
          
        />
      </FormControl>
              {/*Confirmation*/}

<FormControl  mb="2.5">
        
        <FormLabel>Confirmation:</FormLabel>
        <Input placeholder='Enter description About Confirmation details'
        type="text"
          value={Confirmation}
          onChange={(e) => setConfirmation(e.target.value )}
          
        />
      </FormControl>
              {/*StartingDate*/}

<FormControl  mb="2.5">
        
        <FormLabel>Starting Date:</FormLabel>
        <Input placeholder='Enter Starting Date'
        type="date"
          value={StartingDate}
          onChange={(e) => setStartingDate(e.target.value )}
          
        />
      </FormControl>
              {/*title1*/}

<FormControl  mb="2.5">
        
        <FormLabel>Title1:</FormLabel>
        <Input placeholder='Enter description About title1'
        type="text"
          value={title1}
          onChange={(e) => settitle1(e.target.value )}
          
        />
      </FormControl>        
      {/*title2*/}

<FormControl  mb="2.5">
        
          <FormLabel>Title2:</FormLabel>
          <Input placeholder='Enter description About title2'
          type="text"
            value={title2}
            onChange={(e) => settitle2(e.target.value )}
            
          />
        </FormControl>
        {/*banner*/}

        <FormControl  mb="2.5">
        
        <FormLabel>Banner:</FormLabel>
        <Input placeholder='Enter banner details'
        type="text"
          value={banner}
          onChange={(e) => setbanner(e.target.value )}
          
        />
      </FormControl>
              {/*eventId*/}

<FormControl  mb="2.5">
        
        <FormLabel>EventId:</FormLabel>
        <Input placeholder='Enter eventId'
        type="text"
          value={eventId}
          onChange={(e) => seteventId(e.target.value )}
          
        />
      </FormControl>
        

        <FormControl>
          <Button
            type="submit"
            ml="0"
            mb="3"
            isLoading={isLoading}
            colorScheme='teal'
            color="white"
          >
            Submit
          </Button>
        </FormControl>
      </chakra.form>
    </Container>
  );
 
}

export default ShortTerm;