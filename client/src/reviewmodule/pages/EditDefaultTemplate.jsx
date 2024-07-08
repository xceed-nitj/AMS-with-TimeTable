import React, { useState, useEffect, useMemo, useRef } from "react";
import { chakra, IconButton, Heading, Container, Box, Tabs, Tab, TabList, TabPanel, TabPanels, useToast, extendTheme, ChakraProvider, Button } from "@chakra-ui/react";
import getEnvironment from "../../getenvironment";
import axios from "axios";
import JoditEditor from "jodit-react";
import { CheckIcon } from "@chakra-ui/icons";
import { useNavigate } from 'react-router-dom';

function EditDefaultTemplate() {
    const apiUrl = getEnvironment();
    const toast = useToast();
    const [defaultTemplate, setDefaultTemplate] = useState({
        paperSubmission: 'Default paper submission template',
        reviewerInvitation: 'Default reviewer invitation template',
        paperAssignment: 'Default paper assignment template',
        reviewSubmission: 'Default review submission template',
        paperRevision: 'Default paper revision template',
        signature: 'Default signature template',
    });

    useEffect(() => {
        const fetchDefaultTemplate = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/defaultTemplate/template`);
                if (response.data) {
                    // Extract only the desired fields
                    const { paperSubmission, reviewerInvitation, paperAssignment, reviewSubmission, paperRevision, signature } = response.data;
                    const formattedData = {
                        paperSubmission: String(paperSubmission || ''),
                        reviewerInvitation: String(reviewerInvitation || ''),
                        paperAssignment: String(paperAssignment || ''),
                        reviewSubmission: String(reviewSubmission || ''),
                        paperRevision: String(paperRevision || ''),
                        signature: String(signature || '')
                    };
                    setDefaultTemplate(formattedData);
                } else {
                    console.log("No default template found");
                }
            } catch (error) {
                console.log("Error fetching default template: ", error);
            }
        };

        fetchDefaultTemplate();
    }, [apiUrl]);

    const handleSave = async (templateType, newContent) => {
        try {
            const updatedTemplate = {
                ...defaultTemplate,
                [templateType]: newContent,
            };

            // Only include the fields that need to be updated
            const templateWithoutId = {
                paperSubmission: updatedTemplate.paperSubmission,
                reviewerInvitation: updatedTemplate.reviewerInvitation,
                paperAssignment: updatedTemplate.paperAssignment,
                reviewSubmission: updatedTemplate.reviewSubmission,
                paperRevision: updatedTemplate.paperRevision,
                signature: updatedTemplate.signature
            };

            const response = await axios.patch(
                `${apiUrl}/reviewmodule/defaultTemplate/template`,
                { ...templateWithoutId },
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
                setDefaultTemplate(updatedTemplate);
            }
        } catch (error) {
            console.log("Error updating template: ", error);
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
    });

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
            placeholder: 'Start typing...',
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
                <HeaderEditTemplate color="white" textAlign="center" title="Edit Default Templates" />
            </Box>
            <br />

            <ChakraProvider theme={theme}>
                <Tabs size='md' variant='soft-rounded' colorScheme='scheme1'>
                    <TabList style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {Object.keys(defaultTemplate).map(templateType => (
                            <Tab
                                _selected={{ border: '2px solid #121826 !important', color: 'white', backgroundColor: '#121826' }}
                                _hover={{ backgroundColor: '#1f2536', color: 'white' }}
                                key={templateType} style={{ textWrap: 'nowrap', border: '2px solid #00bcd4' }}
                            >
                                {templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Tab>
                        ))}
                    </TabList>
                    <TabPanels>
                        {Object.keys(defaultTemplate).map(templateType => (
                            <TabPanel key={templateType}>
                                <JoditEditor
                                    value={defaultTemplate[templateType] || ''}
                                    onChange={newContent => setDefaultTemplate(prevTemplate => ({
                                        ...prevTemplate,
                                        [templateType]: newContent
                                    }))}
                                    ref={editor}
                                    config={config}
                                />
                                <br />
                                <Button
                                    onClick={() => handleSave(templateType, defaultTemplate[templateType])}
                                    colorScheme="blue"
                                    variant="solid"
                                    leftIcon={<CheckIcon />}
                                >
                                    Save {templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Button>
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>
            </ChakraProvider>
        </Container>
    );
}

export default EditDefaultTemplate;
