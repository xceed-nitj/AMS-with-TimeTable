import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import getEnvironment from '../getenvironment'
import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  Text,
  chakra,
  Link,
  FormHelperText,
  FormErrorMessage,
} from '@chakra-ui/react'

function CreateTimetable() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    session: '',
    code: '',
  })
  const [table, setTable] = useState([])
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const apiUrl = getEnvironment()
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  useEffect(() => {
    // Define a function to fetch timetables
    const fetchTimetables = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }) // Adjust the URL as needed
        if (response.ok) {
          const data = await response.json()
          setTable(data)
          console.log(data)
        } else {
          console.error('Failed to fetch timetables')
        }
      } catch (error) {}
    }

    // Call the fetchTimetables function when the component mounts and when userId changes
    fetchTimetables()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()

        // Access the necessary details from the updated allquiz array
        const generatedLink = data.code

        // Set the generated link and submitted state in the component state
        setGeneratedLink(generatedLink)
        setSubmitted(true)

        // Redirect to the  page
        const redirectTo = `/tt/${generatedLink}`
        navigate(redirectTo)
      } else {
        // Handle errors
        console.error('Error submitting the form')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleGetSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data)
        setLoading(false)
      } else {
        // Handle errors
        console.error('Error fetching sessions')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const currentUrl = window.location.href
  const urlParts = currentUrl.split('/')
  const domainName = urlParts[2] // This will give you the domain name with port, e.g., 'localhost:5173'

  return (
    <Container maxW={'container.md'} mt={10}>
      <Text fontSize={'4xl'} fontWeight={'medium'} color={'gray.700'}>
        Create Time Table
      </Text>
      <chakra.form
        display='flex'
        flexDirection='column'
        alignItems='flex-start'
        gap={3}
        mt={5}
        p={5}
        border={'1px solid'}
        borderColor={'gray.200'}
        borderRadius={'lg'}
        onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel>Name</FormLabel>

          <Input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            placeholder='Enter Name'
          />
        </FormControl>
        <FormControl>
          <FormLabel>Department</FormLabel>

          <Input
            type='text'
            name='dept'
            value={formData.dept}
            onChange={handleInputChange}
            placeholder='Enter Department'
          />
        </FormControl>
        <FormControl>
          <FormLabel>Session</FormLabel>
          <Input
            type='text'
            name='session'
            value={formData.session}
            onChange={handleInputChange}
            placeholder='Session'
          />

          <FormErrorMessage>This is a sample error message</FormErrorMessage>
        </FormControl>
        <Button variant={'solid'} type='submit'>
          Submit
        </Button>
      </chakra.form>

      <Table mt={10}>
        <Thead>
          <Tr>
            <Th>Timetable Name</Th>
            <Th>Session</Th>
            <Th>Department</Th>
            <Th>Link</Th>
          </Tr>
        </Thead>
        <Tbody>
          {table.map((timetable) => (
            <Tr key={timetable._id}>
              <Td>{timetable.name}</Td>
              <Td>{timetable.session}</Td>
              <Td>{timetable.dept}</Td>
              <Td>
                <Link
                  color={'blue.400'}
                  href={`http://${domainName}/tt/${timetable.code}`}>
                  {timetable.code}
                </Link>
              </Td>
              {/* Add more table data cells as needed */}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {loading && <p>Loading...</p>}
    </Container>
  )
}

export default CreateTimetable
