import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    Box, Flex, Text, Button, Badge, HStack, SimpleGrid, Center, useToast,
} from "@chakra-ui/react";
import {
    FaPalette, FaSave, FaUndo, FaCheckCircle, FaClock, FaCalendarAlt,
} from "react-icons/fa";
import { PageShell, PageHeader } from "../components/ui";

const ACCENT = "purple";

// Short descriptions shown under each component name in the admin list.
const COMPONENT_HINTS = {
    countdown: "Countdown timer to the conference start",
    eventDates: "Important dates / timeline shown on the home page",
};

const COMPONENT_ICONS = {
    countdown: FaClock,
    eventDates: FaCalendarAlt,
};

const Customisation = () => {
    const { confid: confId } = useParams();
    const apiUrl = getEnvironment();
    const toast = useToast();

    const [components, setComponents] = useState([]);
    const [savedComponents, setSavedComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!confId) return;
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/homecustomisation/${confId}`, { withCredentials: true })
            .then((res) => {
                const list = res.data?.components || [];
                setComponents(list);
                setSavedComponents(list);
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [confId, apiUrl]);

    const isDirty = JSON.stringify(components) !== JSON.stringify(savedComponents);

    const selectDesign = (key, design) => {
        setComponents((prev) =>
            prev.map((c) => (c.key === key ? { ...c, design } : c))
        );
    };

    const handleReset = () => setComponents(savedComponents);

    const handleSave = () => {
        setSaving(true);
        const payload = { components: components.map((c) => ({ key: c.key, design: c.design })) };
        axios.put(`${apiUrl}/conferencemodule/homecustomisation/${confId}`, payload, { withCredentials: true })
            .then((res) => {
                const list = res.data?.components || components;
                setComponents(list);
                setSavedComponents(list);
                toast({ title: "Customisation saved", description: "The public site will use these designs.", status: "success", duration: 2500, isClosable: true });
            })
            .catch((err) => {
                console.log(err);
                toast({ title: "Failed to save customisation", description: err?.response?.data?.error || err.message, status: "error", duration: 4000, isClosable: true });
            })
            .finally(() => setSaving(false));
    };

    return (
        <PageShell>
            <PageHeader
                icon={FaPalette}
                title="Customisation of Home Page Components"
                subtitle="Pick a design for each component. The selected design number is sent to the public site, which renders that variant."
                accent={ACCENT}
                variant="outline"
            >
                <HStack spacing={2}>
                    {isDirty && (
                        <Button variant="outline" colorScheme="gray" leftIcon={<FaUndo />} onClick={handleReset}>
                            Discard
                        </Button>
                    )}
                    <Button
                        colorScheme={ACCENT}
                        leftIcon={<FaSave />}
                        onClick={handleSave}
                        isLoading={saving}
                        loadingText="Saving…"
                        isDisabled={!isDirty}
                    >
                        Save Customisation
                    </Button>
                </HStack>
            </PageHeader>

            {!loading ? (
                <Flex direction="column" gap={6}>
                    {/* `speakers` has its own dedicated "Speaker Layout" tab, so it's
                        hidden here — but kept in `components` state so saving from this
                        tab doesn't wipe the speaker design selection. */}
                    {components.filter((c) => c.key !== "speakers").map((component) => {
                        const Icon = COMPONENT_ICONS[component.key] || FaPalette;
                        return (
                            <Box key={component.key} bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden">
                                <Flex px={5} py={3} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center" gap={3}>
                                    <HStack spacing={3} minW={0}>
                                        <Center w="34px" h="34px" borderRadius="lg" bg={`${ACCENT}.50`} color={`${ACCENT}.600`} flexShrink={0}>
                                            <Icon />
                                        </Center>
                                        <Box minW={0}>
                                            <Text fontWeight="bold" color={`${ACCENT}.800`}>{component.label}</Text>
                                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                {COMPONENT_HINTS[component.key] || component.key}
                                            </Text>
                                        </Box>
                                    </HStack>
                                    <Badge colorScheme={ACCENT} borderRadius="full" px={3} flexShrink={0}>
                                        Design {component.design} selected
                                    </Badge>
                                </Flex>

                                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} p={5}>
                                    {Array.from({ length: component.designCount || 4 }, (_, i) => i + 1).map((design) => {
                                        const isSelected = component.design === design;
                                        return (
                                            <Box
                                                key={design}
                                                as="button"
                                                type="button"
                                                onClick={() => selectDesign(component.key, design)}
                                                border="2px solid"
                                                borderColor={isSelected ? `${ACCENT}.400` : "gray.200"}
                                                bg={isSelected ? `${ACCENT}.50` : "white"}
                                                borderRadius="xl"
                                                p={4}
                                                textAlign="center"
                                                position="relative"
                                                transition="all 0.15s"
                                                _hover={{ borderColor: `${ACCENT}.300`, transform: "translateY(-2px)", boxShadow: "sm" }}
                                            >
                                                {isSelected && (
                                                    <Box position="absolute" top={2} right={2} color={`${ACCENT}.500`}>
                                                        <FaCheckCircle />
                                                    </Box>
                                                )}
                                                <Center
                                                    h="64px"
                                                    borderRadius="lg"
                                                    bg={isSelected ? `${ACCENT}.100` : "gray.100"}
                                                    color={isSelected ? `${ACCENT}.700` : "gray.500"}
                                                    fontSize="2xl"
                                                    fontWeight="bold"
                                                    mb={3}
                                                >
                                                    {design}
                                                </Center>
                                                <Text fontWeight="semibold" fontSize="sm" color={isSelected ? `${ACCENT}.800` : "gray.700"}>
                                                    Design {design}
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                </SimpleGrid>
                            </Box>
                        );
                    })}

                    <Text fontSize="xs" color="gray.500">
                        The design numbers correspond to the variants implemented on the public conference site.
                    </Text>
                </Flex>
            ) : <Center py={10}><LoadingIcon /></Center>}
        </PageShell>
    );
};

export default Customisation;
