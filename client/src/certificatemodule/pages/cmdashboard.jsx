import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import {
  Container,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Center,
  useToast,
} from '@chakra-ui/react';
import { Tooltip, IconButton, Text } from '@chakra-ui/react';
import { FiEdit, FiUsers, FiLock } from 'react-icons/fi';
import Header from '../../components/header';
import { useDisclosure } from '@chakra-ui/hooks';
import {
  CustomTh,
  CustomLink,
  CustomTealButton,
} from '../../styles/customStyles';

function CMDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  // const [isEventLocked, setEventLocked] = useState(false);
  // const [areAllEventsLocked, setAllEventsLocked] = useState(false); // New state to track if all events are locked

  const { isOpen, onOpen, onClose } = useDisclosure();
  const apiUrl = getEnvironment();

  const areAllEventsLocked =
    table.length === 0 || table.every((event) => event.lock);

  //ORIGINAL
  // const fetchEvents = async () => {
  //   try {
  //     const response = await fetch(
  //       `${apiUrl}/certificatemodule/addevent/getevents`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         credentials: 'include',
  //       }
  //     );

  //     if (response.ok) {
  //       const data = await response.json();
  //       setTable(data);
  //       try {
  //         for (let i = 0; i < data.length; i++) {
  //           const response = await fetch(
  //             `${apiUrl}/certificatemodule/addevent/getCertificateCount/${data[i]._id}`,
  //             {
  //               method: 'GET',
  //               headers: {
  //                 'Content-Type': 'application/json',
  //               },
  //               credentials: 'include',
  //             }
  //           );
  //           const { issuedCount, totalCount } = await response.json();
  //           data[i].totalCertificates = totalCount;
  //           data[i].certificatesIssued = issuedCount;
  //           setTable(data);
  //         }
  //       } catch (error) {
  //         /* empty */
  //       }

  //       if (data.length > 0) {
  //         const lastEventLocked = data[data.length - 1].lock;
  //         setEventLocked(lastEventLocked);

  //         // Check if all events are locked
  //         const allLocked = data.every((event) => event.lock);
  //         setAllEventsLocked(allLocked);
  //       } else {
  //         // If no events, allow adding a new one
  //         setAllEventsLocked(true);
  //       }
  //     } else {
  //       console.error('Failed to fetch events');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };


  
  {
    /*testing to solve lock event problem */
  }
  const fetchEvents = async () => {
    setEventsLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/certificatemodule/addevent/getevents`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed');

      const events = await response.json();

      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const res = await fetch(
            `${apiUrl}/certificatemodule/addevent/getCertificateCount/${event._id}`,
            { credentials: 'include' }
          );
          const { issuedCount, totalCount } = await res.json();

          return {
            ...event,
            totalCertificates: totalCount,
            certificatesIssued: issuedCount,
          };
        })
      );

      setTable(enrichedEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setEventsLoading(false);
    }
  };

  //ORIGINAL
  // const lockEvent = async (id) => {
  //   try {
  //     const confirmed = window.confirm(
  //       'Sure? You wont be able to edit any content once locked!'
  //     );

  //     if (!confirmed) {
  //       // If the user cancels, do nothing
  //       return;
  //     }

  //     const response = await fetch(
  //       `${apiUrl}/certificatemodule/addevent/lock/${id}`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         credentials: 'include',
  //         body: JSON.stringify({ lock: true }),
  //       }
  //     );

  //     if (response.ok) {
  //       // Find the index of the event to lock
  //       const eventIndex = table.findIndex((event) => event._id === id);
  //       if (eventIndex !== -1) {
  //         const updatedTable = [...table];
  //         updatedTable[eventIndex].lock = true;
  //         setTable(updatedTable);

  //         // Update the state for whether all events are locked
  //         const allLocked = updatedTable.every((event) => event.lock);
  //         setAllEventsLocked(allLocked);

  //         toast({
  //           title: 'Event Locked',
  //           description: 'The event has been locked successfully.',
  //           status: 'success',
  //           duration: 3000,
  //           isClosable: true,
  //           position: 'middle',
  //         });
  //       }
  //     } else {
  //       console.error('Failed to lock the event');
  //     }
  //   } catch (error) {
  //     console.error('Error locking the event:', error);
  //   }
  // };

  {
    /*testing to solve lock event problem */
  }
  const lockEvent = async (id) => {
    const confirmed = window.confirm(
      'Sure? You wont be able to edit any content once locked!'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${apiUrl}/certificatemodule/addevent/lock/${id}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error('Lock failed');

      setTable((prev) =>
        prev.map((e) => (e._id === id ? { ...e, lock: true } : e))
      );

      toast({
        title: 'Event Locked',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'middle',
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [apiUrl]);

  const handleAddEvent = () => {
    if (areAllEventsLocked) {
      navigate('/cm/useraddevent');
    } else {
      toast({
        title: 'Action Required',
        description: 'Please lock all previous events before adding a new one.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const currentUrl = window.location.href;
  const urlParts = currentUrl.split('/');
  const domainName = urlParts[2];

  return (
    // <Container maxW="7xl">
    //   <Button
    //     colorScheme="teal"
    //     onClick={handleAddEvent}
    //     mb={4}
    //     isDisabled={!(table.length === 0 || areAllEventsLocked)} // Button is enabled when there are no events or all events are locked
    //     float="right"
    //   >
    //     Add New Event
    //   </Button>

    //   <Header title="List of Events"></Header>

    //   <TableContainer>
    //     <Table variant="striped" size="md" mt="1">
    //       <Thead>
    //         <Tr>
    //           <CustomTh>Event Name</CustomTh>
    //           <CustomTh>Event Date</CustomTh>
    //           <CustomTh>Edit certificate details</CustomTh>
    //           <CustomTh>Edit participant details</CustomTh>
    //           <CustomTh>Total Certificates</CustomTh>
    //           <CustomTh>Certificates Issued</CustomTh>
    //           <CustomTh>Lock Status</CustomTh>
    //         </Tr>
    //       </Thead>
    //       <Tbody>
    //         {table.map((event) => (
    //           <Tr key={event._id}>
    //             <Td>
    //               <Center>{event.name}</Center>
    //             </Td>
    //             <Td>
    //               <Center>
    //                 {new Date(event.ExpiryDate).toLocaleDateString('en-GB')}
    //               </Center>
    //             </Td>
    //             {!event.lock ? (
    //               <Td>
    //                 <Center>
    //                   <CustomLink href={`http://${domainName}/cm/${event._id}`}>
    //                     {event.name} Certificates
    //                   </CustomLink>
    //                 </Center>
    //               </Td>
    //             ) : (
    //               <Td>
    //                 <Center>Certificates Locked</Center>
    //               </Td>
    //             )}
    //             <Td>
    //               {!event.lock ? (
    //                 <Center>
    //                   <CustomLink
    //                     href={`http://${domainName}/cm/${event._id}/addparticipant`}
    //                   >
    //                     {event.name} participants
    //                   </CustomLink>
    //                 </Center>
    //               ) : (
    //                 <Center>Participants Locked</Center>
    //               )}
    //             </Td>
    //             <Td>
    //               <Center>{event.totalCertificates}</Center>
    //             </Td>
    //             <Td>
    //               <Center>{event.certificatesIssued}</Center>
    //             </Td>
    //             <Td>
    //               <Center>
    //                 {!event.lock ? (
    //                   <CustomTealButton
    //                     onClick={() => lockEvent(event._id)}
    //                     disabled={isEventLocked}
    //                   >
    //                     Lock The Event
    //                   </CustomTealButton>
    //                 ) : (
    //                   <span>
    //                     Locked on{' '}
    //                     {new Date(event.updated_at).toLocaleDateString('en-GB')}
    //                   </span>
    //                 )}
    //               </Center>
    //             </Td>
    //           </Tr>
    //         ))}
    //       </Tbody>
    //     </Table>
    //   </TableContainer>
    //   {loading && <p>Loading...</p>}
    // </Container>

    //CHANGED UI
    <Container maxW="7xl">
      {/* <Button
        colorScheme="teal"
        onClick={handleAddEvent}
        mb={4}
        isDisabled={!(table.length === 0 || areAllEventsLocked)}
        float="right"
      >
        Add New Event
      </Button> */}

      {/*experimental for lock event issue */}
      <Button
        colorScheme="teal"
        onClick={handleAddEvent}
        mb={4}
        isDisabled={!areAllEventsLocked}
        float="right"
      >
        Add New Event
      </Button>

      <Header title="List of Events" />

      {eventsLoading ? (
        <Center py={10}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.600">
            Wait, the events are loading…
          </Text>
        </Center>
      ) : (
        <TableContainer>
          <Table variant="striped" size="md" mt="1" >
            <Thead>
              <Tr>
                <CustomTh>Event Name</CustomTh>
                <CustomTh>Event Date</CustomTh>
                <CustomTh>Certificates</CustomTh>
                <CustomTh>Participants</CustomTh>
                <CustomTh>Total</CustomTh>
                <CustomTh>Issued</CustomTh>
                <CustomTh>Status</CustomTh>
              </Tr>
            </Thead>

            <Tbody>
              {table.map((event) => (
                <Tr key={event._id}>
                  <Td>
                    <Center>{event.name}</Center>
                  </Td>

                  <Td>
                    <Center>
                      {new Date(event.ExpiryDate).toLocaleDateString('en-GB')}
                    </Center>
                  </Td>

                  {/* Certificates */}
                  <Td>
                    <Center>
                      {!event.lock ? (
                        <Tooltip label="Edit certificate details" hasArrow>
                          <IconButton
                            icon={<FiEdit />}
                            variant="ghost"
                            colorScheme="teal"
                            size={'lg'}
                            aria-label="Edit certificates"
                            as="a"
                            href={`http://${domainName}/cm/${event._id}`}
                          />
                        </Tooltip>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Locked
                        </Text>
                      )}
                    </Center>
                  </Td>

                  {/* Participants */}
                  <Td>
                    <Center>
                      {!event.lock ? (
                        <Tooltip label="Edit participant details" hasArrow>
                          <IconButton
                            icon={<FiUsers />}
                            variant="ghost"
                            colorScheme="teal"
                            aria-label="Edit participants"
                            size={'lg'}
                            as="a"
                            href={`http://${domainName}/cm/${event._id}/addparticipant`}
                          />
                        </Tooltip>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Locked
                        </Text>
                      )}
                    </Center>
                  </Td>

                  <Td>
                    <Center>{event.totalCertificates}</Center>
                  </Td>
                  <Td>
                    <Center>{event.certificatesIssued}</Center>
                  </Td>

                  {/* Lock Status */}
                  <Td>
                    <Center>
                      {!event.lock ? (
                        <Tooltip label="Lock this event" hasArrow>
                          <IconButton
                            icon={<FiLock />}
                            colorScheme="red"
                            variant="outline"
                            aria-label="Lock event"
                            onClick={() => lockEvent(event._id)}
                            isDisabled={event.lock} // ADDED EVENT.LOCK INSTEAD OF ISEVENTLOCKED (EXPERIMENTAL FOR LOCK EVENT ISSUE)
                          />
                        </Tooltip>
                      ) : (
                        <Text fontSize="sm" color="gray.600">
                          Locked on{' '}
                          {new Date(event.updated_at).toLocaleDateString(
                            'en-GB'
                          )}
                        </Text>
                      )}
                    </Center>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {loading && <p>Loading...</p>}
    </Container>
  );
}

export default CMDashboard;
