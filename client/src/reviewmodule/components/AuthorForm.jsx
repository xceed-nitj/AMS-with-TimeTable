import React, { useState, useEffect } from 'react';
import { Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

export default function AuthorForm() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [paper, setPaper] = useRecoilState(paperState);
  const [author, setAuthor] = useState({
    order: '',
    name: '',
    email: '',
    designation: '',
    institute: '',
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid = Object.values(author).every(value => value.trim() !== '');
    setIsFormValid(isValid);
  }, [author]);

  function handleChange(e) {
    setAuthor({ ...author, [e.target.id]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;
    setPaper(prevPaper => ({
      ...prevPaper,
      authors: [...prevPaper.authors, author],
    }));
    onClose();
  }

  return (
    <>
      <Button onClick={onOpen}>Add Author +</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Author</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mt={4}>
              <FormLabel>Order</FormLabel>
              <Input
                placeholder="1"
                id="order"
                type="number"
                value={author.order}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="Anna Jones"
                id="name"
                value={author.name}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Email</FormLabel>
              <Input
                placeholder="annajones@buzzle.com"
                id="email"
                value={author.email}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Designation</FormLabel>
              <Input
                placeholder="Professor"
                id="designation"
                value={author.designation}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Institute</FormLabel>
              <Input
                placeholder="University of Texas"
                type="text"
                id="institute"
                value={author.institute}
                onChange={handleChange}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit} disabled={!isFormValid}>
              Add
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
