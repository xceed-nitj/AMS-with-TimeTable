    import React, {useState , useEffect} from "react";
    import { useParams } from "react-router-dom";
    import { Container,Box, Table ,Button,Tabs,TabList,TabPanel,TabPanels, useToast} from "@chakra-ui/react";
    import getEnvironment from "../../getenvironment";
    import Quill from "quill";
    import axios from "axios";
    import { Toast } from "@chakra-ui/react";
    import JoditEditor from "jodit-react";
    import { CheckIcon } from "@chakra-ui/icons";
    import Header from "../../components/header";




    function EditTemplate(){
        const apiUrl=getEnvironment();
        const {eventId}=useParams();
        const toast=useToast();
        const [template, setTemplate] = useState({
            paperSubmission: 'Default reviewer invitation template',
            reviewerInvitation: 'Default reviewer invitation template',
            paperAssignment: 'Default paper assignment template',
            reviewSubmission: 'Default review submission template',
            paperRevision: 'Default paper revision template',
            paperDecision: 'Default paper decision template',
        });
    useEffect(()=>{
        const fetchTemplate = async ()=>{
            try{
                const response =await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
                if(response.data.templates)
                    {
                        setTemplate(response.data.templates);
                    // console.log(template);
                    }
                else
                {
                    console.log("Not able to do Get Request")
                }    
            } catch(error){
                console.log("Catch Error ",error);
            }

        };

        fetchTemplate();
    },[apiUrl,eventId]);

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
                `${apiUrl}/reviewmodule/event/${eventId}`,
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

    return (
        <Container>
            <Header title="Edit Templates" />
            {Object.keys(template).map(templateType => (
                <Box key={templateType} mb={4}>
                    <h2>{templateType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
                    <JoditEditor
                        value={template[templateType]}
                        onChange={newContent => setTemplate(prevTemplate => ({
                            ...prevTemplate,
                            [templateType]: newContent
                        }))}
                    />
                    <Button
                        colorScheme="teal"
                        leftIcon={<CheckIcon />}
                        mt={2}
                        onClick={() => handleSave(templateType, template[templateType])}
                    >
                        Save {templateType}
                    </Button>
                </Box>
            ))}
        </Container>
    );
}

export default EditTemplate;