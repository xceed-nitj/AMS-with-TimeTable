import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Box, Table, Button, Tabs, Tab, TabList, TabPanel, TabPanels, useToast, extendTheme, ChakraProvider } from "@chakra-ui/react";
import getEnvironment from "../../getenvironment";
import Quill from "quill";
import axios from "axios";
import { Toast } from "@chakra-ui/react";
import JoditEditor from "jodit-react";
import { CheckIcon } from "@chakra-ui/icons";
import Header from "../../components/header";
import { Link } from 'react-router-dom';



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
                // 100: "#4DD0E1",// cyan.300 //tab backgrounf color
                // 600: '#00bcd4', // button background hover
                // 500: '#121826', //gray.900 //button background color
                // 700: 'white', //tab text color
                100: '#121826',
                700: 'white',
                500: '#4DD0E1',
                600: '#00bcd4',
            },
            //     scheme2: {
            //         600: '#121826',
            //     }
        },
    })

    return (
        <Container
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}
        >
            <Header title="Edit Templates" />

            {/* https://v2.chakra-ui.com/docs/components/tabs/usage */}
            {/* ChakraUI Tabs Documentaion */}
            {/* Refer to this in future */}
            <ChakraProvider theme={theme}>
                <Tabs variant='soft-rounded' colorScheme='scheme1'> {/* removed colorScheme = 'green' */}
                    <TabList
                        style={{ display: 'flex', flexWrap: 'nowrap' }}
                    >
                        {Object.keys(template).map(templateType => (
                            <Tab
                                _selected={{border: '2px solid #121826 !important', color: 'white', backgroundColor: '#121826'}}
                                _hover = {{backgroundColor: '#1f2536', color: 'white'}}
                             key={templateType} style={{ textWrap: 'nowrap', border: '2px solid #00bcd4' }}>{
                                templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Tab>
                        ))}
                    </TabList>
                    <TabPanels>
                        {Object.keys(template).map(templateType => (
                            <TabPanel>
                                <JoditEditor
                                    value={template[templateType]}
                                    onChange={newContent => setTemplate(prevTemplate => ({
                                        ...prevTemplate,
                                        [templateType]: newContent
                                    }))}
                                />
                                {/* <Button
                                    colorScheme="scheme1"
                                    leftIcon={<CheckIcon />}
                                    mt={2}
                                    onClick={() => handleSave(templateType, template[templateType])}
                                    >
                                    Save {templateType}
                                    </Button> */}
                                {/* <Link
                                    // onClick={() => handleSave(templateType, template[templateType])}
                                    className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
                                    >Save {Template}</Link> */}
                                <br/>
                                <Link
                                    onClick={() => handleSave(templateType, template[templateType])}
                                    className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
                                    style={{gap: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content'}}
                                    >
                                    <CheckIcon />Save {templateType}
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