import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { chakra, IconButton, Heading, Container, Box, Button, Tabs, Tab, TabList, TabPanel, TabPanels, useToast, extendTheme, ChakraProvider } from "@chakra-ui/react";
import getEnvironment from "../../getenvironment";
import axios from "axios";
import JoditEditor from "jodit-react";
import { CheckIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from 'react-router-dom';

function EditTemplate() {
    const apiUrl = getEnvironment();
    const { eventId } = useParams();
    const toast = useToast();
    const [template, setTemplate] = useState({
        paperSubmission: 'Default paper submission template',
        reviewerInvitation: 'Default reviewer invitation template',
        paperAssignment: 'Default paper assignment template',
        reviewSubmission: 'Default review submission template',
        paperRevision: 'Default paper revision template',
        paperDecision: 'Default paper decision template',
    });

    const [fields, setFields] = useState([]);
    const [event_fields,setEventFields] = useState({})
    const [selectedTab, setSelectedTab] = useState(0);

    const collectionNames = ['prs-papers', 'users', 'prs-papers', 'prs-reviews', 'prs-papers', 'prs-papers'];

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
                if (response.data.templates) {
                    setTemplate(response.data.templates);
                    setEventFields(response.data || {});
                } else {
                    console.log("Not able to do Get Request");
                }
            } catch (error) {
                console.log("Catch Error ", error);
            }
        };

        fetchTemplate();
    }, [apiUrl, eventId]);

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/event/getFields/${collectionNames[selectedTab]}`);
                const fieldData = response.data;
                if (Array.isArray(fieldData)) {
                    setFields(fieldData);
                } else {
                    console.log("Fetched fields are not an array:", fieldData);
                }
            } catch (error) {
                console.log("Error fetching fields:", error);
            }
        };

        fetchFields();
    }, [selectedTab]);
    const insertEventField = (field) => {
        setTemplate(prevTemplate => {
            const currentContent = prevTemplate[Object.keys(template)[selectedTab]];
            const trimmedContent = currentContent.trim();
            const fieldToInsert = event_fields[field];
            const updatedContent = trimmedContent + (trimmedContent ? ' ' : '') + fieldToInsert;
            return {
                ...prevTemplate,
                [Object.keys(template)[selectedTab]]: updatedContent
            };
        });
    };
    const handleSave = async (templateType, newContent) => {
        try {
            const updatedTemplates = {
                ...template,
                [templateType]: newContent,
            };

            const { _id, ...templatesWithoutId } = updatedTemplates;

            const response = await axios.patch(
                `${apiUrl}/reviewmodule/event/template/${eventId}`,
                { templates: templatesWithoutId },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.status === 200) {
                toast({
                    title: "Template updated.",
                    description: `The ${templateType} template has been updated.`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                setTemplate(updatedTemplates);
            }
        } catch (error) {
            console.log("Catch Error ", error);
            toast({
                title: "Error updating template.",
                description: `There was an error updating the ${templateType} template.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const insertField = (field) => {
        setTemplate(prevTemplate => {
            const currentContent = prevTemplate[Object.keys(template)[selectedTab]];
            const updatedContent = currentContent + `{{${field}}}`;
            return {
                ...prevTemplate,
                [Object.keys(template)[selectedTab]]: updatedContent
            };
        });
    };

    const theme = extendTheme({
        colors: {
            scheme1: {
                100: '#121826',
                700: 'white',
                500: '#4DD0E1',
                600: '#00bcd4',
            }
        },
    });

    const options = [
        'bold', 'italic', '|', 'ul', 'ol', '|', 'font', 'fontsize', '|', 'outdent', 'indent', 'align', '|', 'hr', '|', 'fullsize', 'brush', '|', 'table', 'link', '|', 'undo', 'redo'
    ];

    const config = useMemo(() => ({
        readonly: false,
        placeholder: 'Start typing...',
        defaultActionOnPaste: 'insert_as_html',
        defaultLineHeight: 1.5,
        enter: 'div',
        buttons: options,
        buttonsMD: options,
        buttonsSM: options,
        buttonsXS: options,
        statusbar: false,
        height: 240,
    }), []);

    const editor = useRef(null);

    const HeaderEditTemplate = ({ title }) => {
        const navigate = useNavigate();

        return (
            <Heading mr='1' ml='1' display='flex'>
                <IconButton
                    mb='1'
                    variant='ghost'
                    onClick={() => navigate(-1)}
                    _hover={{ bgColor: 'transparent' }}
                >
                    <chakra.svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='white'
                        className='w-6 h-6'
                        _hover={{ stroke: '#00BFFF' }}
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                    </chakra.svg>
                </IconButton>
                <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
                    {title}
                </chakra.div>
            </Heading>
        );
    };

    return (
        <Container style={{ display: 'flex', minWidth: '85vw', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}>
            <br />
            <Box bg="black" p={0.2} width='100%'>
                <HeaderEditTemplate color="white" textAlign="center" title="Edit Templates" />
            </Box>
            <br />
            <ChakraProvider theme={theme}>
                <Tabs size='md' variant='soft-rounded' colorScheme='scheme1' onChange={index => setSelectedTab(index)}>
                    <TabList style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {Object.keys(template).map((templateType, index) => (
                            <Tab key={templateType} _selected={{ border: '2px solid #121826 !important', color: 'white', backgroundColor: '#121826' }} _hover={{ backgroundColor: '#1f2536', color: 'white' }}>
                                {templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Tab>
                        ))}
                    </TabList>
                    <TabPanels>
                        {Object.keys(template).map((templateType, index) => (
                            <TabPanel key={templateType}>
                                <Box>
                                    {Array.isArray(fields) && fields.map((field, idx) => (
                                        <Button key={idx} onClick={() => insertField(field)} m={1}>
                                            {field}
                                        </Button>
                                    ))}
                                </Box>
                                <br/>
                                <p>Event Fields</p>
                                <Box>
                                    {Object.keys(event_fields).map((field, idx) => (
                                        <Button key={idx} onClick={() => insertEventField(field)} m={1}>
                                            {field}
                                        </Button>
                                    ))}
                                </Box>
                                <br/>
                                <JoditEditor
                                    value={template[templateType]}
                                    onChange={newContent => setTemplate(prevTemplate => ({
                                        ...prevTemplate,
                                        [templateType]: newContent
                                    }))}
                                    ref={editor}
                                    config={config}
                                />
                                <br/>
                                <Link
                                    onClick={() => handleSave(templateType, template[templateType])}
                                    className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center tw-m-auto"
                                    style={{gap: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content'}}
                                    >
                                    <CheckIcon />Save {templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Link>
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>
            </ChakraProvider>
        </Container>
    );
}

export default EditTemplate;
