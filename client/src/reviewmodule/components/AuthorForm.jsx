import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'
import getEnvironment from "../../getenvironment";
import { Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, useToast } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

export default function AuthorForm(props) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [paper, setPaper] = useRecoilState(paperState);
  const authorId = [];
  const [aid, setAuthorid] = useState({
    _id: (props.edit)?props.edit._id:''
  });
  const [author, setAuthor] = useState({
    order: (props.edit)?props.edit.order:'', //it pre-fills the fields when you are trying to edit an entry
    name: (props.edit)?props.edit.name:'',
    email: (props.edit)?props.edit.email:'',
    designation: (props.edit)?props.edit.designation:'',
    institute: (props.edit)?props.edit.institute:'',
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid = Object.values(author).every(value => value.trim() !== '');
    setIsFormValid(isValid);
  }, [author]);

  function handleChange(e) {
    setAuthor({ ...author, [e.target.id]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const apiUrl = getEnvironment();
    console.log(author);
    var form_data = new FormData();
    for ( var key in author ) {
      console.log(key,":",author[key]);
      form_data.append(key, AuthorForm[key]);
    }
    try {
      const response = await axios.post(`${apiUrl}/reviewmodule/paper/addAuthor`, author,{
        name: author.name,
        email: author.email,
        designation: author.designation,
      });
      console.log("userid:",response.data.updatedId);
      setAuthorid({ ...aid, _id: response.data.updatedId});
      authorId.push(response.data.updatedId);
      toast({
        title: 'Upload successful.',
        description: response.data.message || 'Paper has been uploaded.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed.',
        description: error.response?.data?.message || 'An error occurred during upload.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    function dupliCheck(entry) {
      for(let l = 0; l < paper.authors.length; l++){
        if(entry == paper.authors[l]._id) return true
      }
      return false
    }

    function PrevPaperFunc(prevPaper) { //it removes the entry that you are trying to edit
      if(!props.edit) return prevPaper
      else {
        let prevPaperEdited = JSON.parse(JSON.stringify(prevPaper)) // a method to make a deep copy
        for(let ii = 0; ii < prevPaperEdited.authors.length; ii++)//remove the occurence of the object from the prevPapers 
          if(prevPaperEdited.authors[ii]._id == props.edit._id) { //so that we can add it again
            prevPaperEdited.authors.splice(ii,1)
            ii--}
        return prevPaperEdited
      }
    }
    if(dupliCheck(aid._id)&&(!props.edit)){
      alert('The order '+ aid._id+ ' has already been filled...')
    }
    else {
      console.log(authorId);
      console.log('no obstacle encounterd',authorId[0]);
      if (!isFormValid) return;
      setPaper(prevPaper => ({
        ...PrevPaperFunc(prevPaper),
        authors: [...PrevPaperFunc(prevPaper).authors, authorId[0]],
      }));
      onClose();
    }

    onClose();
  }

  return (
    <>
      <Button colorScheme={props.colorScheme} onClick={onOpen}>{props.txt}</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <div
            style={{backgroundColor:'#121826', borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
              display: 'flex', justifyContent:'center'
            }}
          >
            <ModalHeader style={{margin:'auto', color: 'white', textWrap:'nowrap'}}>{props.edit?'Edit Author':'Create Author'}</ModalHeader>
            <ModalCloseButton color='white' />
          </div>
          <ModalBody pb={6}>
            <FormControl mt={4}>
              <FormLabel>Order</FormLabel>
              <Input
                placeholder="1"
                id="order"
                type="number"
                isReadOnly = {(props.edit)?true:false} // u cannot change the order of author when editing author
                value={author.order}                  // removing this will break the update mechanics
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

          <ModalFooter
            style={{display:'flex', justifyContent:'space-evenly'}}
          >
            <Button 
              style={{minWidth:'40%'}}
              colorScheme='red'
              onClick={onClose}>Cancel</Button>
            <Button 
              style={{minWidth:'40%'}}
            colorScheme="green" mr={3} onClick={handleSubmit} disabled={!isFormValid}>
              {props.edit?'Update':'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
