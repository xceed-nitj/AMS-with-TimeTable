import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { chakra, IconButton, Heading, Container, Box, Table, Button, Tabs, Tab, TabList, TabPanel, TabPanels, useToast, extendTheme, ChakraProvider } from "@chakra-ui/react";
import getEnvironment from "../../getenvironment";
import Quill from "quill";
import axios from "axios";
import { Toast } from "@chakra-ui/react";
import JoditEditor from "jodit-react";
import { CheckIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from 'react-router-dom';
import { HeartIcon } from "@heroicons/react/24/outline";



function EditTemplate() {
    const apiUrl = getEnvironment();
    const { eventId } = useParams();
    const toast = useToast();
    const [template, setTemplate] = useState({
        paperSubmission: 'Default reviewer invitation template',
        reviewerInvitation: 'Default reviewer invitation template',
        paperAssignment: 'Default paper assignment template',
        reviewSubmission: 'Default review submission template',
        paperRevision: 'Default paper revision template',
        paperDecision: 'Default paper decision template',
    });
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
                if (response.data.templates) {
                    setTemplate(response.data.templates);
                    // console.log(template);
                }
                else {
                    console.log("Not able to do Get Request")
                }
            } catch (error) {
                console.log("Catch Error ", error);
            }

        };

        fetchTemplate();
    }, [apiUrl, eventId]);

    // useEffect(() => {
    //     console.log(template);
    // }, [template]);


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

    const theme = extendTheme({
        colors: {
            scheme1: {
                100: '#121826',
                700: 'white',
                500: '#4DD0E1',
                600: '#00bcd4',
            }
        },
    })

    function removeId(dataset) { // filters out the _id field and returns a list without it
        let datasetRemovedId = []
        for(let i = 0; i < dataset.length; i++) if (dataset[i] != '_id') datasetRemovedId.push(dataset[i])
        return datasetRemovedId
    }

    const options = [
        'bold',
        'italic',
        '|',
        'ul',
        'ol',
        '|',
        'font',
        'fontsize',
        '|',
        'outdent',
        'indent',
        'align',
        '|',
        'hr',
        '|',
        'fullsize',
        'brush',
        '|',
        'table',
        'link',
        '|',
        'undo',
        'redo',
    ];
      
      
    const config = useMemo(
        () => ({
        readonly: false,
        placeholder: 'Default reviewer invitation template',
        defaultActionOnPaste: 'insert_as_html',
        defaultLineHeight: 1.5,
        enter: 'div',
        buttons: options,
        buttonsMD: options,
        buttonsSM: options,
        buttonsXS: options,
        statusbar: false,
        sizeLG: 900,
        sizeMD: 700,
        sizeSM: 400,
        toolbarAdaptive: false,
        height: 240,
        }),
        [],
    );
    const editor = useRef(null);

    const HeaderEditTemplate = ({ title }) => {
        const navigate = useNavigate();
        
        return (
          <Heading mr='1' ml='1' display='flex' >
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
            <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2' >
              {title}
            </chakra.div>
          </Heading>
        );
    };

    return (
        <Container
            style={{ display: 'flex', minWidth:'85vw',flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}
        >
            <br />
            <Box  bg="black" p={0.2} width='100%'>
                <HeaderEditTemplate  color="white" textAlign="center" title="Edit Templates"/>
            </Box>
            <br />

            {/* https://v2.chakra-ui.com/docs/components/tabs/usage */}
            {/* ChakraUI Tabs Documentaion */}
            {/* Refer to this in future */}
            <ChakraProvider theme={theme}>
                <Tabs size='md' variant='soft-rounded' colorScheme='scheme1'> {/* removed colorScheme = 'green' */}
                    <TabList
                        style={{ display: 'flex', flexWrap: 'wrap' }}
                    >
                        {removeId(Object.keys(template)).map(templateType => (
                            <Tab
                                _selected={{border: '2px solid #121826 !important', color: 'white', backgroundColor: '#121826'}}
                                _hover = {{backgroundColor: '#1f2536', color: 'white'}}
                             key={templateType} style={{ textWrap: 'nowrap', border: '2px solid #00bcd4' }}>{
                                templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Tab>
                        ))}
                    </TabList>
                    <TabPanels>
                        {removeId(Object.keys(template)).map(templateType => (
                            <TabPanel>
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