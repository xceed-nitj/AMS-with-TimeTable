import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
  Container,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Center,
  Heading,
  Box
} from "@chakra-ui/react";

const Images = () => {
  const params = useParams();
  const IdConf = params.confid;
  const apiUrl = getEnvironment();

  const initialData = {
    confId: IdConf,
    name: "",
    imgLink: "",
    feature: true,
    sequence: "",
  };

  const [formData, setFormData] = useState(initialData);
  const [editID, setEditID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const { name, imgLink, sequence } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "sequence" ? parseInt(value) :
        name === "feature" ? value === "true" :
        value
    }));
  };

  const handleSubmit = () => {
    if (editID) {
      axios
        .put(`${apiUrl}/conferencemodule/images/${editID}`, formData, {
          withCredentials: true,
        })
        .then(() => {
          alert("Updated successfully");
        })
        .catch((err) => console.log(err));
    } else {
      axios
        .post(`${apiUrl}/conferencemodule/images`, formData, {
          withCredentials: true,
        })
        .then(() => {
          alert("Added successfully");
          setFormData(initialData);
        })
        .catch((err) => console.log(err));
    }
  };

  const handleDelete = (id) => {
    setDeleteItemId(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`${apiUrl}/conferencemodule/images/${deleteItemId}`, {
        withCredentials: true,
      })
      .then(() => {
        alert("Deleted");
        setFormData(initialData);
        setEditID(null);
        setShowDeleteConfirmation(false);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${apiUrl}/conferencemodule/images/conference/${IdConf}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.length > 0) {
          const firstImage = res.data[0];
          setFormData(firstImage);
          setEditID(firstImage._id);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [IdConf]);

  if (loading) {
    return (
      <main className="tw-py-10 tw-min-h-screen tw-flex tw-justify-center tw-items-center">
        <LoadingIcon />
      </main>
    );
  }

  return (
    <main className="tw-py-10 tw-min-h-screen tw-flex tw-justify-center">
      <Box className="tw-w-full tw-max-w-2xl tw-px-4">
        <Container maxW="full">
          <Center mb="6">
            <Heading as="h1" size="xl" mt="6" mb="6" style={{
                                color: "#14B8A6", 
                                textDecoration: "underline"
                            }}>
              Add a New Image
            </Heading>
          </Center>

          <FormControl isRequired mb="4">
            <FormLabel>Name:</FormLabel>
            <Input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              placeholder="Name"
            />
          </FormControl>

          <FormControl isRequired mb="4">
            <FormLabel>Image Link:</FormLabel>
            <Input
              type="text"
              name="imgLink"
              value={imgLink}
              onChange={handleChange}
              placeholder="Image Link"
            />
          </FormControl>

          <FormControl isRequired mb="4">
            <FormLabel>Sequence:</FormLabel>
            <Input
              type="number"
              name="sequence"
              value={sequence}
              onChange={handleChange}
              placeholder="Sequence"
            />
          </FormControl>

          <FormControl isRequired mb="6">
            <FormLabel>Feature:</FormLabel>
            <Select name="feature" value={formData.feature} onChange={handleChange}>
              <option value={true}>Yes</option>
              <option value={false}>No</option>
            </Select>
          </FormControl>

          <Center>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {editID ? "Update" : "Add"}
            </Button>
          </Center>
        </Container>
      </Box>

      {showDeleteConfirmation && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
            <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
              Are you sure you want to delete?
            </p>
            <div className="tw-flex tw-justify-center">
              <Button colorScheme="red" onClick={confirmDelete} mr={4}>
                Yes, Delete
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Images;
