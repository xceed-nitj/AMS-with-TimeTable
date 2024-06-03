// import {
//   Box,
//   Button,
//   Modal,
//   Typography,
//   useScrollTrigger,
// } from "@mui/material";
// import React, { useState } from "react";
// import { useRecoilState } from "recoil";
// import { paperState } from "../state/atoms/paperState";
// function AuthorForm() {
//   const [open, setOpen] = useState(false);
//   function handleOpen() {
//     setOpen(true);
//   }
//   function handleClose() {
//     setOpen(false);
//   }

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

//   // const style = {display:"flex",backgroundColor:"white" ,flexDirection:"col",gap:"2px"}
//   return (
//     <>
//       <Button onClick={handleOpen}>Add author +</Button>
//       <Modal
//         open={open}
//         aria-labelledby="modal-modal-title"
//         aria-describedby="modal-modal-description"
//         className="w-full"
//       >
//         <Box className="bg-slate-800 flex text-xl container mx-auto gap-2  flex-col">
//           <div>
//             <button
//               onClick={handleClose}
//               className="place-items-end text-xl text-white p-5 m-5"
//             >
//               &times;
//             </button>
//             <Form handleClose={handleClose} />
//           </div>
//         </Box>
//       </Modal>
//     </>
//   );
// }

// export default AuthorForm;

// function Form({ handleClose }) {
//   const [paper, setPaper] = useRecoilState(paperState);
//   const [author, setAuthor] = useState({
//     order: "",
//     name: "",
//     email: "",
//     designation: "",
//     institute: "",
//   });
//   console.log(author);
//   console.log(paper);
//   function handleChange(e) {
//     setAuthor({ ...author, [e.target.id]: e.target.value });
//   }
//   function handleSubmit(e) {
//     e.preventDefault();
//     console.log(paper);
//     if (paper.authors) {
//       setPaper((prevPaper) => ({
//         ...prevPaper,
//         authors: [...prevPaper.authors, author],
//       }));
//     } else {
//       setPaper((prevPaper) => ({
//         ...prevPaper,
//         authors: [author],
//       }));
//     }
//     handleClose();
//     console.log(paper);
//   }
//   return (
//     <form className="flex flex-col gap-4 justify-center w-full items-center pt-10 text-[18px] p-10">
//       <div className="flex gap-2  flex-col ">
//         <label className="text-white">Order:</label>
//         <input
//           className="rounded-md px-1"
//           id="order"
//           type="text"
//           value={author.order || ""}
//           onChange={(e) => handleChange(e)}
//         />
//       </div>
//       <div className="flex gap-2  flex-col">
//         <label className="text-white">Name:</label>
//         <input
//           className=" rounded-md px-1"
//           id="name"
//           value={author.name || ""}
//           onChange={(e) => handleChange(e)}
//         />
//       </div>
//       <div className="flex gap-2  flex-col">
//         <label className="text-white">Email:</label>
//         <input
//           className=" rounded-md px-1"
//           id="email"
//           value={author.email || ""}
//           onChange={(e) => handleChange(e)}
//         />
//       </div>
//       <div className="flex gap-2 flex-col">
//         <label className="text-white">Desgination:</label>
//         <input
//           className=" rounded-md px-1"
//           id="designation"
//           value={author.designation || ""}
//           onChange={(e) => handleChange(e)}
//         />
//       </div>
//       <div className="flex gap-2  flex-col">
//         <label className="text-white">Institute:</label>
//         <input
//           className=" rounded-md px-1 cursor-text"
//           type="text"
//           id="institute"
//           value={author.institute || ""}
//           onChange={(e) => handleChange(e)}
//         />
//       </div>
//       <button
//         className="border-2  rounded-lg mx-auto justify-self-start p-1 text-white"
//         onClick={(e) => handleSubmit(e)}
//       >
//         Add It!!
//       </button>
//     </form>
//   );
// }
export default function AuthorForm() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // const initialRef = React.useRef();
  // const finalRef = React.useRef();

  const [paper, setPaper] = useRecoilState(paperState);
  const [author, setAuthor] = useState({
    order: '',
    name: '',
    email: '',
    designation: '',
    institute: '',
  });

  console.log(author);
  console.log(paper);
  function handleChange(e) {
    setAuthor({ ...author, [e.target.id]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();

    
    // console.log(paper);

    // if (paper.authors) {
    //   setPaper((prevPaper) => ({
    //     ...prevPaper,
    //     authors: [...prevPaper.authors, author],
    //   }));
    // } else {
    //   setPaper((prevPaper) => ({
    //     ...prevPaper,
    //     authors: [author],
    //   }));
    // }
    onClose();
  }
  return (
    <>
      <Button onClick={onOpen}>Add Author +</Button>

      <Modal
        // initialFocusRef={initialRef}
        // finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
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
                type="text"
                value={author.order || ''}
                onChange={(e) => handleChange(e)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="Anna Jones"
                id="name"
                value={author.name || ''}
                onChange={(e) => handleChange(e)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Email</FormLabel>
              <Input
                placeholder="annajones@buzzle.com"
                id="email"
                value={author.email || ''}
                onChange={(e) => handleChange(e)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Designation</FormLabel>
              <Input
                placeholder="Professor"
                id="designation"
                value={author.designation || ''}
                onChange={(e) => handleChange(e)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Institute</FormLabel>
              <Input
                placeholder="University of Texas"
                type="text"
                id="institute"
                value={author.institute || ''}
                onChange={(e) => handleChange(e)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
              Add
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
