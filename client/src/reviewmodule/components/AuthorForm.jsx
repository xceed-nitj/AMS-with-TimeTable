import React, { useState, useEffect } from 'react';
import { Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

export default function AuthorForm(props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [paper, setPaper] = useRecoilState(paperState);
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

  function handleSubmit(e) {
    e.preventDefault();
    function dupliCheck(entry) {
      for(let l = 0; l < paper.authors.length; l++){
        if(entry == paper.authors[l].order) return true
      }
      return false
    }

    function PrevPaperFunc(prevPaper) { //it removes the entry that you are trying to edit
      if(!props.edit) return prevPaper
      else {
        let prevPaperEdited = JSON.parse(JSON.stringify(prevPaper)) // a method to make a deep copy
        for(let ii = 0; ii < prevPaperEdited.authors.length; ii++)//remove the occurence of the object from the prevPapers 
          if(prevPaperEdited.authors[ii].order == props.edit.order) { //so that we can add it again
            prevPaperEdited.authors.splice(ii,1)
            ii--}
        return prevPaperEdited
      }
    }
    if(dupliCheck(author.order)&&(!props.edit)){
      alert('The order '+ author.order+ ' has already been filled...')
    }
    else {
      console.log('no obstacle encounterd')
      if (!isFormValid) return;
      setPaper(prevPaper => ({
        ...PrevPaperFunc(prevPaper),
        authors: [...PrevPaperFunc(prevPaper).authors, author],
      }));
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
