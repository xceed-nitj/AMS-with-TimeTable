// import React, { useState, useEffect, useRef } from "react";
// import Quill from "quill";
// import "quill/dist/quill.snow.css";
// import QuillBetterTable from "quill-better-table";
// import "quill-better-table/dist/quill-better-table.css";
// import axios from 'axios';
// import { useParams } from "react-router-dom";
// import LoadingIcon from "../components/LoadingIcon";
// import getEnvironment from "../../getenvironment";
// import { Container } from "@chakra-ui/layout";
// import {
//     FormControl, FormErrorMessage, FormLabel, Center, Heading,
//     Input, Button, Select, Box, Textarea
// } from '@chakra-ui/react';
// import { Copy } from 'lucide-react';

// import { CustomTh, CustomLink, CustomBlueButton } from '../utils/customStyles'

// const Speaker = () => {
//     const params = useParams();
//     const IdConf = params.confid;
//     const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
//     const [deleteItemId, setDeleteItemId] = useState(null);
//     const [showBioHTML, setShowBioHTML] = useState(false);
//     const [showAbstractHTML, setShowAbstractHTML] = useState(false);
//     const [editableBioHTML, setEditableBioHTML] = useState('');
//     const [editableAbstractHTML, setEditableAbstractHTML] = useState('');
//     const apiUrl = getEnvironment();

//     const initialData = {
//         "ConfId": IdConf,
//         "Name": "",
//         "Designation": "",
//         "Institute": "",
//         "ProfileLink": "",
//         "ImgLink": "",
//         "TalkType": "",
//         "TalkTitle": "",
//         "Abstract": "",
//         "Bio": "",
//         "sequence": "",
//         "feature": true
//     };

//     const [formData, setFormData] = useState(initialData);
//     const [editID, setEditID] = useState();
//     const [data, setData] = useState([]);
//     const [existingSpeaker, setExistingSpeaker] = useState(null);
//     const [refresh, setRefresh] = useState(0);
//     const [loading, setLoading] = useState(false);

//     const bioEditorRef = useRef(null);
//     const abstractEditorRef = useRef(null);
//     const bioQuillInstance = useRef(null);
//     const abstractQuillInstance = useRef(null);

//     const { ConfId, Name, Designation, Institute, ProfileLink, ImgLink, TalkType, TalkTitle, Abstract, Bio, sequence, feature } = formData;

//     const copyToClipboard = (text) => {
//         navigator.clipboard.writeText(text).then(() => {
//             console.log('HTML copied to clipboard');
//         }).catch(err => {
//             console.error('Failed to copy: ', err);
//         });
//     };

//     const handleBioHTMLChange = (e) => {
//         setEditableBioHTML(e.target.value);
//     };

//     const handleAbstractHTMLChange = (e) => {
//         setEditableAbstractHTML(e.target.value);
//     };

//     const applyBioChanges = () => {
//         if (bioQuillInstance.current) {
//             bioQuillInstance.current.root.innerHTML = editableBioHTML;
//             setFormData(prev => ({
//                 ...prev,
//                 Bio: editableBioHTML
//             }));
//         }
//     };

//     const applyAbstractChanges = () => {
//         if (abstractQuillInstance.current) {
//             abstractQuillInstance.current.root.innerHTML = editableAbstractHTML;
//             setFormData(prev => ({
//                 ...prev,
//                 Abstract: editableAbstractHTML
//             }));
//         }
//     };

//     const handleShowBioHTML = () => {
//         if (bioQuillInstance.current) {
//             const html = bioQuillInstance.current.root.innerHTML;
//             setEditableBioHTML(html);
//             setShowBioHTML(!showBioHTML);
//         }
//     };

//     const handleShowAbstractHTML = () => {
//         if (abstractQuillInstance.current) {
//             const html = abstractQuillInstance.current.root.innerHTML;
//             setEditableAbstractHTML(html);
//             setShowAbstractHTML(!showAbstractHTML);
//         }
//     };

//     useEffect(() => {
//         if (bioQuillInstance.current || abstractQuillInstance.current) return;

//         Quill.register({
//             "modules/better-table": QuillBetterTable,
//         });

//         const modules = {
//             toolbar: [
//                 [{ header: [1, 2, 3, false] }],
//                 ["bold", "italic", "underline", "strike"],
//                 [{ color: [] }, { background: [] }],
//                 [{ script: "sub" }, { script: "super" }],
//                 ["blockquote", "code-block"],
//                 [{ list: "ordered" }, { list: "bullet" }],
//                 [{ indent: "-1" }, { indent: "+1" }],
//                 [{ align: [] }],
//                 ["link", "image", "video"],
//                 ["clean"],
//             ],
//             clipboard: {
//                 matchVisual: false,
//             },
//             "better-table": {
//                 operationMenu: {
//                     items: {
//                         insertColumnRight: { text: "Insert Column Right" },
//                         insertColumnLeft: { text: "Insert Column Left" },
//                         insertRowUp: { text: "Insert Row Above" },
//                         insertRowDown: { text: "Insert Row Below" },
//                         mergeCells: { text: "Merge Cells" },
//                         unmergeCells: { text: "Unmerge Cells" },
//                         deleteColumn: { text: "Delete Column" },
//                         deleteRow: { text: "Delete Row" },
//                         deleteTable: { text: "Delete Table" },
//                     },
//                 },
//             },
//             keyboard: {
//                 bindings: QuillBetterTable.keyboardBindings,
//             },
//         };

//         if (bioEditorRef.current && !bioQuillInstance.current) {
//             bioQuillInstance.current = new Quill(bioEditorRef.current, {
//                 theme: "snow",
//                 modules,
//                 placeholder: "Start writing bio here...",
//             });

//             bioQuillInstance.current.on("text-change", () => {
//                 const html = bioQuillInstance.current.root.innerHTML;
//                 setFormData((prev) => ({
//                     ...prev,
//                     Bio: html
//                 }));
//                 if (showBioHTML) {
//                     setEditableBioHTML(html);
//                 }
//             });
//         }

//         if (abstractEditorRef.current && !abstractQuillInstance.current) {
//             abstractQuillInstance.current = new Quill(abstractEditorRef.current, {
//                 theme: "snow",
//                 modules,
//                 placeholder: "Start writing abstract here...",
//             });

//             abstractQuillInstance.current.on("text-change", () => {
//                 const html = abstractQuillInstance.current.root.innerHTML;
//                 setFormData((prev) => ({
//                     ...prev,
//                     Abstract: html
//                 }));
//                 if (showAbstractHTML) {
//                     setEditableAbstractHTML(html);
//                 }
//             });
//         }
//     }, []);

//     useEffect(() => {
//         setLoading(true);
//         axios.get(`${apiUrl}/conferencemodule/speakers/conference/${IdConf}`, {
//             withCredentials: true
//         })
//             .then(res => {
//                 if (res.data && res.data.length > 0) {
//                     const speaker = res.data[0];
//                     setExistingSpeaker(speaker);
//                     setFormData({
//                         ConfId: IdConf,
//                         Name: speaker.Name || "",
//                         Designation: speaker.Designation || "",
//                         Institute: speaker.Institute || "",
//                         ProfileLink: speaker.ProfileLink || "",
//                         ImgLink: speaker.ImgLink || "",
//                         TalkType: speaker.TalkType || "",
//                         TalkTitle: speaker.TalkTitle || "",
//                         Abstract: speaker.Abstract || "",
//                         Bio: speaker.Bio || "",
//                         sequence: speaker.sequence || "",
//                         feature: speaker.feature !== undefined ? speaker.feature : true
//                     });
//                     setEditID(speaker._id);
                    
//                     setTimeout(() => {
//                         if (bioQuillInstance.current) {
//                             bioQuillInstance.current.root.innerHTML = speaker.Bio || '';
//                         }
//                         if (abstractQuillInstance.current) {
//                             abstractQuillInstance.current.root.innerHTML = speaker.Abstract || '';
//                         }
//                     }, 100);
//                 }
//                 setData(res.data);
//             })
//             .catch(err => console.log(err))
//             .finally(() => setLoading(false));
//     }, [IdConf, apiUrl]);

//     useEffect(() => {
//         if (editID && bioQuillInstance.current && abstractQuillInstance.current) {
//             if (formData.Bio !== bioQuillInstance.current.root.innerHTML) {
//                 bioQuillInstance.current.root.innerHTML = formData.Bio || '';
//             }
//             if (formData.Abstract !== abstractQuillInstance.current.root.innerHTML) {
//                 abstractQuillInstance.current.root.innerHTML = formData.Abstract || '';
//             }
//         }
//     }, [editID, formData.Bio, formData.Abstract]);

//     useEffect(() => {
//         if (bioQuillInstance.current && formData.Bio !== bioQuillInstance.current.root.innerHTML) {
//             bioQuillInstance.current.root.innerHTML = formData.Bio || '';
//         }
//         if (abstractQuillInstance.current && formData.Abstract !== abstractQuillInstance.current.root.innerHTML) {
//             abstractQuillInstance.current.root.innerHTML = formData.Abstract || '';
//         }
//     }, [editID]);

//     const insertTableInBio = () => {
//         if (bioQuillInstance.current) {
//             const tableModule = bioQuillInstance.current.getModule("better-table");
//             tableModule.insertTable(3, 3);
//         }
//     };

//     const insertTableInAbstract = () => {
//         if (abstractQuillInstance.current) {
//             const tableModule = abstractQuillInstance.current.getModule("better-table");
//             tableModule.insertTable(3, 3);
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         if (name === "sequence") {
//             setFormData({
//                 ...formData,
//                 [name]: parseInt(value),
//             });
//         }
//         else if (name === "feature") {
//             setFormData({
//                 ...formData,
//                 [name]: value === "true",
//             });
//         }
//         else {
//             setFormData({
//                 ...formData,
//                 [name]: value,
//             });
//         }
//     };

//     const handleSubmit = (e) => {
//         axios.post(`${apiUrl}/conferencemodule/speakers`, formData, {
//             withCredentials: true
//         })
//             .then(res => {
//                 setData([...data, res.data]);
//                 setFormData(initialData); 
//                 setRefresh(refresh + 1);
//                 if (bioQuillInstance.current) bioQuillInstance.current.root.innerHTML = '';
//                 if (abstractQuillInstance.current) abstractQuillInstance.current.root.innerHTML = '';
//             })
//             .catch(err => {
//                 console.log(err);
//                 console.log(formData);
//             });
//     };

//     const handleUpdate = () => {
//         axios.put(`${apiUrl}/conferencemodule/speakers/${editID}`, formData, {
//             withCredentials: true
//         })
//             .then(res => {
//                 setRefresh(refresh + 1);
//                 console.log('Speaker updated successfully:', res.data);
//             })
//             .catch(err => console.log(err));
//     };

//     const handleDelete = (deleteID) => {
//         setDeleteItemId(deleteID);
//         setShowDeleteConfirmation(true);
//     };

//     const confirmDelete = () => {
//         axios.delete(`${apiUrl}/conferencemodule/speakers/${deleteItemId}`, {
//             withCredentials: true
//         })
//             .then(res => {
//                 console.log('DELETED RECORD::::', res);
//                 setShowDeleteConfirmation(false);
//                 setRefresh(refresh + 1);
//                 setFormData(initialData);
//                 setEditID(null);
//                 if (bioQuillInstance.current) bioQuillInstance.current.root.innerHTML = '';
//                 if (abstractQuillInstance.current) abstractQuillInstance.current.root.innerHTML = '';
//             })
//             .catch(err => console.log(err));
//     };

//     const handleEdit = (editIDNotState) => {
//         window.scrollTo(0, 0);
//         axios.get(`${apiUrl}/conferencemodule/speakers/${editIDNotState}`, {
//             withCredentials: true
//         })
//             .then(res => {
//                 setFormData(res.data);
//                 setEditID(editIDNotState);
//                 if (bioQuillInstance.current) {
//                     bioQuillInstance.current.root.innerHTML = res.data.Bio || '';
//                 }
//                 if (abstractQuillInstance.current) {
//                     abstractQuillInstance.current.root.innerHTML = res.data.Abstract || '';
//                 }
//             })
//             .catch(err => console.log(err));
//     };

//     const handleClearForm = () => {
//         setFormData(initialData);
//         setEditID(null);
//         if (bioQuillInstance.current) bioQuillInstance.current.root.innerHTML = '';
//         if (abstractQuillInstance.current) abstractQuillInstance.current.root.innerHTML = '';
//     };

//     return (
//         <main className='tw-py-10 tw-min-h-screen tw-flex tw-justify-center'>
//             <div className="tw-w-full tw-max-w-full tw-px-2">
//                 <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-8">
//                     {/* Left Section - Form */}
//                     <div className="tw-w-full lg:tw-w-1/2" >
//                         <Container maxW='full'>
//                             <Center mb="6">
//                                 <Heading as="h1" size="xl" mt="6" mb="6" style={{
//                                 color: "#8B5CF6", 
//                                 textDecoration: "underline"
//                             }} >
//                                     {editID ? 'Update Speaker' : 'Create a New Speaker'}
//                                 </Heading>
//                             </Center>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Name of the Speaker:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="Name"
//                                     value={Name}
//                                     onChange={handleChange}
//                                     placeholder="Name"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired mb='3'>
//                                 <FormLabel>Designation:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="Designation"
//                                     value={Designation}
//                                     onChange={handleChange}
//                                     placeholder="Designation"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Institute of the Speaker:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="Institute"
//                                     value={Institute}
//                                     onChange={handleChange}
//                                     placeholder="Institute"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Profile Link of the Speaker:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="ProfileLink"
//                                     value={ProfileLink}
//                                     onChange={handleChange}
//                                     placeholder="Profile Link"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Image Link of the Speaker:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="ImgLink"
//                                     value={ImgLink}
//                                     onChange={handleChange}
//                                     placeholder="Image Link"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Talk Type:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="TalkType"
//                                     value={TalkType}
//                                     onChange={handleChange}
//                                     placeholder="Talk Type"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Talk Title:</FormLabel>
//                                 <Input
//                                     type="text"
//                                     name="TalkTitle"
//                                     value={TalkTitle}
//                                     onChange={handleChange}
//                                     placeholder="Talk Title"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Bio of the Speaker:</FormLabel>
//                                 <div style={{ marginBottom: "10px" }}>
//                                     <Button
//                                         colorScheme="blue"
//                                         size="sm"
//                                         onClick={insertTableInBio}
//                                         mr={2}
//                                     >
//                                         Insert Table
//                                     </Button>
//                                     <Button
//                                         colorScheme="purple"
//                                         size="sm"
//                                         onClick={handleShowBioHTML}
//                                     >
//                                         {showBioHTML ? 'Hide HTML' : 'Show HTML'}
//                                     </Button>
//                                 </div>
//                                 <div
//                                     ref={bioEditorRef}
//                                     style={{
//                                         height: "200px",
//                                         width: "100%",
//                                         border: "1px solid #ccc",
//                                         borderRadius: "5px",
//                                         marginBottom: showBioHTML ? "10px" : "20px",
//                                         background: "#fff"
//                                     }}
//                                 ></div>
//                                 {showBioHTML && (
//                                     <Box
//                                         bg="gray.50"
//                                         border="1px solid"
//                                         borderColor="gray.300"
//                                         borderRadius="md"
//                                         p={4}
//                                         mb={4}
//                                     >
//                                         <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
//                                             <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700">HTML Content (Editable)</h3>
//                                             <div className="tw-flex tw-gap-2">
//                                                 <Button
//                                                     colorScheme="orange"
//                                                     size="sm"
//                                                     onClick={applyBioChanges}
//                                                 >
//                                                     Apply Changes
//                                                 </Button>
//                                                 <button
//                                                     onClick={() => copyToClipboard(editableBioHTML || '')}
//                                                     className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-lg tw-font-medium tw-hover:bg-green-600 tw-transition-colors"
//                                                 >
//                                                     <Copy size={16} />
//                                                     Copy HTML
//                                                 </button>
//                                             </div>
//                                         </div>
//                                         <Textarea
//                                             value={editableBioHTML}
//                                             onChange={handleBioHTMLChange}
//                                             placeholder="Edit HTML content here..."
//                                             minHeight="200px"
//                                             maxHeight="400px"
//                                             fontFamily="monospace"
//                                             fontSize="sm"
//                                             bg="white"
//                                             border="1px solid"
//                                             borderColor="gray.200"
//                                             borderRadius="md"
//                                             resize="vertical"
//                                         />
//                                     </Box>
//                                 )}
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Abstract:</FormLabel>
//                                 <div style={{ marginBottom: "10px" }}>
//                                     <Button
//                                         colorScheme="blue"
//                                         size="sm"
//                                         onClick={insertTableInAbstract}
//                                         mr={2}
//                                     >
//                                         Insert Table
//                                     </Button>
//                                     <Button
//                                         colorScheme="purple"
//                                         size="sm"
//                                         onClick={handleShowAbstractHTML}
//                                     >
//                                         {showAbstractHTML ? 'Hide HTML' : 'Show HTML'}
//                                     </Button>
//                                 </div>
//                                 <div
//                                     ref={abstractEditorRef}
//                                     style={{
//                                         height: "200px",
//                                         width: "100%",
//                                         border: "1px solid #ccc",
//                                         borderRadius: "5px",
//                                         marginBottom: showAbstractHTML ? "10px" : "20px",
//                                         background: "#fff"
//                                     }}
//                                 ></div>
//                                 {showAbstractHTML && (
//                                     <Box
//                                         bg="gray.50"
//                                         border="1px solid"
//                                         borderColor="gray.300"
//                                         borderRadius="md"
//                                         p={4}
//                                         mb={4}
//                                     >
//                                         <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
//                                             <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700">HTML Content (Editable)</h3>
//                                             <div className="tw-flex tw-gap-2">
//                                                 <Button
//                                                     colorScheme="orange"
//                                                     size="sm"
//                                                     onClick={applyAbstractChanges}
//                                                 >
//                                                     Apply Changes
//                                                 </Button>
//                                                 <button
//                                                     onClick={() => copyToClipboard(editableAbstractHTML || '')}
//                                                     className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-green-600 tw-text-white tw-rounded-lg tw-font-medium tw-hover:bg-green-600 tw-transition-colors"
//                                                     colorScheme="green"
//                                                     size="sm"
//                                                 >
//                                                     <Copy size={1} color="green" />
//                                                     Copy HTML
//                                                 </button>
//                                             </div>
//                                         </div>
//                                         <Textarea
//                                             value={editableAbstractHTML}
//                                             onChange={handleAbstractHTMLChange}
//                                             placeholder="Edit HTML content here..."
//                                             minHeight="200px"
//                                             maxHeight="400px"
//                                             fontFamily="monospace"
//                                             fontSize="sm"
//                                             bg="white"
//                                             border="1px solid"
//                                             borderColor="gray.200"
//                                             borderRadius="md"
//                                             resize="vertical"
//                                         />
//                                     </Box>
//                                 )}
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Sequence:</FormLabel>
//                                 <Input
//                                     type="number"
//                                     name="sequence"
//                                     value={sequence}
//                                     onChange={handleChange}
//                                     placeholder="Sequence"
//                                     mb='2.5'
//                                 />
//                             </FormControl>

//                             <FormControl isRequired={true} mb='3'>
//                                 <FormLabel>Feature:</FormLabel>
//                                 <Select
//                                     name="feature"
//                                     value={formData.feature}
//                                     onChange={handleChange}
//                                     mb='2.5'
//                                 >
//                                     <option value={true}>Yes</option>
//                                     <option value={false}>No</option>
//                                 </Select>
//                             </FormControl>

//                             <Center mt="6">
//                                 <Button 
//                                     colorScheme="blue" 
//                                     type={editID ? "button" : "submit"} 
//                                     onClick={() => { editID ? handleUpdate() : handleSubmit() }}
//                                     size="lg"
//                                     mr={editID ? 4 : 0}
//                                 >
//                                     {editID ? 'Update' : 'Add'}
//                                 </Button>
//                             </Center>
//                         </Container>
//                     </div>

//                     <div className="tw-hidden lg:tw-block tw-w-full lg:tw-w-1/2 tw-sticky tw-top-0 tw-h-screen tw-overflow-auto">
//                         <Box className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-h-full">
//                             <Heading as="h2" size="xl" mb="6" className="tw-text-center" style={{
//                                 color: "#8B5CF6", 
//                                 textDecoration: "underline"
//                             }}>
//                                 Live Preview
//                             </Heading>
//                             <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow-sm tw-min-h-full">
//                                 <div className="tw-mb-6">
//                                     <h3 className="tw-font-semibold tw-text-lg tw-mb-2">Bio:</h3>
//                                     <div
//                                         className="tw-prose tw-max-w-none tw-min-h-[200px] tw-p-4 tw-border tw-rounded tw-bg-gray-50 tw-overflow-auto"
//                                         dangerouslySetInnerHTML={{ 
//                                             __html: formData.Bio || '<p class="tw-text-gray-400 tw-italic">Start typing in the bio editor to see the live preview here...</p>' 
//                                         }}
//                                     />
//                                 </div>
//                                 <div className="tw-mb-4">
//                                     <h3 className="tw-font-semibold tw-text-lg tw-mb-2">Abstract:</h3>
//                                     <div
//                                         className="tw-prose tw-max-w-none tw-min-h-[200px] tw-p-4 tw-border tw-rounded tw-bg-gray-50 tw-overflow-auto"
//                                         dangerouslySetInnerHTML={{ 
//                                             __html: formData.Abstract || '<p class="tw-text-gray-400 tw-italic">Start typing in the abstract editor to see the live preview here...</p>' 
//                                         }}
//                                     />
//                                 </div>
//                             </div>
//                         </Box>
//                     </div>
//                 </div>
//             </div>

//             {showDeleteConfirmation && (
//                 <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
//                     <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
//                         <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
//                             Are you sure you want to delete?
//                         </p>
//                         <div className="tw-flex tw-justify-center">
//                             <Button
//                                 colorScheme="red"
//                                 onClick={confirmDelete}
//                                 mr={4}
//                             >
//                                 Yes, Delete
//                             </Button>
//                             <Button
//                                 colorScheme="blue"
//                                 onClick={() => setShowDeleteConfirmation(false)}
//                             >
//                                 Cancel
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </main>
//     );
// };

// export default Speaker;
import React, { useState, useEffect,useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import {
    FormControl, FormErrorMessage, FormLabel, Center, Heading,
    Input, Button, Select
} from '@chakra-ui/react';
import JoditEditor from 'jodit-react';

import { CustomTh, CustomLink, CustomBlueButton } from '../utils/customStyles'
import {
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/table";
const Speaker = () => {
    const params = useParams();
const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);    const apiUrl = getEnvironment();
    const ref = useRef(null);


    // Define your initial data here
    const initialData = {
        "ConfId": IdConf,
        "Name": "",
        "Designation": "",
        "Institute": "",
        "ProfileLink": "",
        "ImgLink": "",
        "TalkType": "",
        "TalkTitle": "",
        "Abstract": "",
        "Bio": "",
        "sequence": "",
        "feature": true
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { ConfId, Name, Designation, Institute, ProfileLink, ImgLink, TalkType, TalkTitle, Abstract, Bio, sequence, feature } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "feature") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }

        else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

    };

    const handleEditorChange = (value, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: value,
        });
    };
    const handleSubmit = (e) => {
        // e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/speakers`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });

    };

    const handleUpdate = () => {

        axios.put(`${apiUrl}/conferencemodule/speakers/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {

        axios.delete(`${apiUrl}/conferencemodule/speakers/${deleteItemId}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                               setShowDeleteConfirmation(false);  
                 setRefresh(refresh + 1);
          
                setFormData(initialData);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);
        axios.get(`${apiUrl}/conferencemodule/speakers/${editIDNotState}`, {
            withCredentials: true

        })

            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true)
        axios.get(`${apiUrl}/conferencemodule/speakers/conference/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [refresh]);

    return (
        <main className='tw-py-10 lg:tw-pl-72 tw-min-h-screen'>

            <Container maxW='5xl'>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Create a New Speaker
                </Heading>


                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Name of the Speaker :</FormLabel>
                    <Input
                        type="text"
                        name="Name"
                        value={Name}
                        onChange={handleChange}
                        placeholder="Name"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>Designation:</FormLabel>
                    <Input

                        type="text"
                        name="Designation"
                        value={Designation}
                        onChange={handleChange}
                        placeholder="Designation"
                        mb='2.5'
                    />

                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Institute of the Speaker :</FormLabel>
                    <Input
                        type="text"
                        name="Institute"
                        value={Institute}
                        onChange={handleChange}
                        placeholder="Institute"
                        mb='2.5'
                    />
                </FormControl>
               <FormControl isRequired={true} mb='3' >
                    <FormLabel >Image Link of the Speaker :</FormLabel>
                    <Input
                        type="text"
                        name="ImgLink"
                        value={ImgLink}
                        onChange={handleChange}
                        placeholder="ImageLink"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true}  >

                    <FormLabel >Sequence :</FormLabel>
                    <Input

                        type="number"
                        name="sequence"
                        value={sequence}
                        onChange={handleChange}
                        placeholder="sequence"
                        mb='2.5'
                   />
                   </FormControl>
                      <FormControl mb='3' >
                    <FormLabel >Profile Link of the Speaker :</FormLabel>
                    <Input
                        type="text"
                        name="ProfileLink"
                        value={ProfileLink}
                        onChange={handleChange}
                        placeholder="Profile Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl >
                    <FormLabel >Talk Type:</FormLabel>
                    <Input
                        type="text"
                        name="TalkType"
                        value={TalkType}
                        onChange={handleChange}
                        placeholder="TalkType"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl  >
                    <FormLabel >Talk Title :</FormLabel>
                    <Input
                        type="text"
                        name="TalkTitle"
                        value={TalkTitle}
                        onChange={handleChange}
                        placeholder="Talk Title"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl >
                    <FormLabel >Bio of the Speaker :</FormLabel>
                    
                    <JoditEditor
                        ref={ref}
                        value={Bio}
                        name="Bio"
                        onBlur={(value) => handleEditorChange(value, "Bio")}
                        classname='tw-mb-5'
                    />
                </FormControl>
                <FormControl  >
                    <FormLabel >Abstract :</FormLabel>
                    
                    <JoditEditor
                        ref={ref}
                        value={Abstract}
                        name="Abstract"
                        onBlur={(value) => handleEditorChange(value, "Abstract")}
                        classname='tw-mb-5'
                    />
                </FormControl>
                
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Feature:</FormLabel>
                    <Select
                        name="feature"
                        value={formData.feature}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>

                <Center>

                    <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                        
                        {editID ? 'Update' : 'Add'}
                    </Button>
                   </Center>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Existing Speakers </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh> Name</CustomTh>
                                    <CustomTh>Designation</CustomTh>
                                    <CustomTh>Institute</CustomTh>
                                    <CustomTh>Sequence</CustomTh>
                                    <CustomTh>Feature</CustomTh>


                                    <CustomTh position={'sticky'} right={'0'}>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.Name}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.Designation}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.Institute}</Td>
                                        <Td sx={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.sequence}</Td>
                                        <Td sx={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.feature ?"Yes":"No"}</Td>

                                        <Td position={'sticky'} right={'0'}><Center>
                                            <Button colorScheme="red" onClick={() => handleDelete(item._id)}>Delete </Button>
                                            <Button colorScheme="teal" onClick={() => {
                                                handleEdit(item._id);
                                                setEditID(item._id);
                                            }}>Edit </Button></Center>
                                        </Td>

                                    </Tr>))) :
                                    (
                                        <Tr>
                                            <Td colSpan="5" className="tw-p-1 tw-text-center">
                                              <Center> No data available</Center> </Td>
                                        </Tr>
                                    )
                                }
                            </Tbody>
                        </Table>
                    </TableContainer>
                )

                    : <LoadingIcon />
                } </Container>
 
            {showDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete?
                        </p>
                        <div className="tw-flex tw-justify-center">
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                mr={4}
                            >
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
            {showDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete?
                        </p>
                        <div className="tw-flex tw-justify-center">
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                mr={4}
                            >
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
            )}        </main>
    );
};

export default Speaker;