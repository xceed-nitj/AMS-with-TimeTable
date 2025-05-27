import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from '../getenvironment';
import { CustomBlueButton, CustomDeleteButton } from '../styles/customStyles';
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import Header from '../components/header';

function Subject() {
  const [facultyList, setFacultyList] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [department, setDepartment] = useState('');
  const [formData, setFormData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
    order: '',
  });

  const apiUrl = getEnvironment();
  const navigate = useNavigate();

  // Extract current code
  const parts = window.location.pathname.split("/");
  const currentCode = parts[parts.length - 2];

  // Fetch timetable on mount or when currentCode changes
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch(`${apiUrl}/timetablemodule/timetable`, { credentials: 'include' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        const filtered = data.filter(row => row.code === currentCode);
        setTimetableData(filtered);
        if (filtered.length) setDepartment(filtered[0].dept);
      } catch (err) {
        console.error('Timetable fetch error:', err);
      }
    };
    fetchTimetable();
  }, [apiUrl, currentCode]);

  // Fetch faculty when department is set
  useEffect(() => {
    if (!department) return;

    const fetchFaculty = async () => {
      try {
        const res = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setFacultyList(data.reverse());
      } catch (err) {
        console.error('Faculty fetch error:', err);
      }
    };
    fetchFaculty();
  }, [apiUrl, department]);

  const startEdit = id => {
    setEditRowId(id);
    const row = facultyList.find(r => r._id === id);
    if (row) setFormData({ ...row });
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty/${editRowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setFacultyList(facultyList.map(r => r._id === editRowId ? formData : r));
      setEditRowId(null);
      setFormData({ facultyID: '', name: '', designation: '', dept: department, email: '', extension: '', type: '', order: '' });
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const deleteRow = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setFacultyList(facultyList.filter(r => r._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const startAdd = () => {
    setFormData({ facultyID: '', name: '', designation: '', dept: department, email: '', extension: '', type: '', order: '' });
    setIsAdding(true);
  };

  const saveNew = async () => {
    if (facultyList.some(r => r.name === formData.name)) {
      return alert('Duplicate name.');
    }
    if (!formData.facultyID || !formData.name || !formData.designation || !formData.email) {
      return alert('Fill required fields.');
    }
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setIsAdding(false);
      setDepartment(department); // trigger refetch
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  return (
    <Container maxW='6xl' mb='10'>
      <Header title='Edit Department Faculty Details' />

      <Box mb='4'>
        {isAdding ? (
          <Box>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="facultyID">Faculty ID:</FormLabel>
              <Input
                mb='2'
                id="facultyID"
                type="text"
                value={formData.facultyID}
                onChange={e => setFormData({ ...formData, facultyID: e.target.value })}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="name">Name:</FormLabel>
              <Input
                mb='2'
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="designation">Designation:</FormLabel>
              <Input
                mb='2'
                id="designation"
                type="text"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="dept">Dept:</FormLabel>
              <Input
                mb='2'
                id="dept"
                type="text"
                value={formData.dept}
                disabled
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="type">Type:</FormLabel>
              <Input
                mb='2'
                id="type"
                type="text"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="email">Email:</FormLabel>
              <Input
                mb='2'
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="extension">Extension:</FormLabel>
              <Input
                mb='2'
                id="extension"
                type="text"
                value={formData.extension}
                onChange={e => setFormData({ ...formData, extension: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="order">Order:</FormLabel>
              <Input
                type="number"
                id="order"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: e.target.value })}
              />
            </FormControl>
            <Box mt='2' display='flex' justifyContent='space-between'>
              <CustomBlueButton onClick={saveNew}>Save New Faculty</CustomBlueButton>
              <CustomBlueButton onClick={() => setIsAdding(false)}>Cancel</CustomBlueButton>
            </Box>
          </Box>
        ) : (
          <CustomBlueButton onClick={startAdd}>Add Faculty</CustomBlueButton>
        )}
      </Box>

      <TableContainer>
        <Text mb='2'><b>Total Entries: {facultyList.length}</b></Text>
        <Table variant='striped' size='md'>
          <Thead>
            <Tr>
              <Th>FacultyID</Th><Th>Name</Th><Th>Designation</Th><Th>Dept</Th><Th>Type</Th><Th>Email</Th><Th>Extension</Th><Th>Order</Th><Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {facultyList.map(row => (
              <Tr key={row._id}>
                {['facultyID','name','designation','dept','type','email','extension','order'].map(field => (
                  <Td key={field}>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          value={formData[field]}
                          onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                        />
                      ) : (
                        row[field]
                      )}
                    </Center>
                  </Td>
                ))}
                <Td key="actions">
                  <Center>
                    {editRowId === row._id ? (
                      <CustomBlueButton onClick={saveEdit}>Save</CustomBlueButton>
                    ) : (
                      <Box display="flex" gap={2}>
                        <CustomBlueButton onClick={() => startEdit(row._id)}>Edit</CustomBlueButton>
                        <CustomDeleteButton onClick={() => deleteRow(row._id)}>Delete</CustomDeleteButton>
                      </Box>
                    )}
                  </Center>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Subject;
