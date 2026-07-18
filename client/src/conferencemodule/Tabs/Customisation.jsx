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

// ── Timeline ("eventDates") wireframes ────────────────────────────────────────
// Schematic mockups of the three timeline designs implemented on the public
// site (see client/src/components/Timeline.jsx, TIMELINE_DESIGNS 1-3). Drawn
// locally with Chakra primitives to mirror each real layout — the actual
// section renders on the public conference site, not here.
const Bar = (props) => <Box h="4px" borderRadius="full" bg="gray.300" {...props} />;
const BlueBar = (props) => <Box h="3px" borderRadius="full" bg="blue.300" {...props} />;

const TimelineWireframe = ({ design }) => {
    switch (design) {
        // Design 1 — numbered cards grid: coloured top stripe, icon + title, date chip.
        case 1:
            return (
                <SimpleGrid columns={4} spacing={2}>
                    {[0, 1, 2, 3].map((i) => (
                        <Box key={i} position="relative" bg="white" border="1px solid" borderColor="blue.100" borderRadius="lg" overflow="hidden" mt="6px">
                            <Box position="absolute" top="-6px" left="6px" w="12px" h="12px" borderRadius="full" bg="blue.500" border="2px solid white" />
                            <Box h="4px" w="100%" bg="blue.400" />
                            <Box p={1.5} pt={2}>
                                <Box w="12px" h="12px" borderRadius="md" bg="blue.100" mb={1.5} />
                                <Bar w="80%" mb={1} />
                                <Box h="7px" w="65%" bg="blue.50" borderRadius="full" mb={1.5} />
                                <Bar w="90%" mb={0.5} />
                                <Bar w="70%" />
                            </Box>
                        </Box>
                    ))}
                </SimpleGrid>
            );
        // Design 2 — classic vertical timeline: centre line, cards alternating left/right.
        case 2:
            return (
                <Box position="relative" px={1}>
                    <Box position="absolute" left="50%" top={0} bottom={0} w="2px" bg="blue.100" transform="translateX(-50%)" />
                    <Flex direction="column" gap={2}>
                        {[0, 1, 2].map((i) => {
                            const left = i % 2 === 0;
                            return (
                                <Flex key={i} justify={left ? "flex-start" : "flex-end"} position="relative">
                                    <Box position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)" w="10px" h="10px" borderRadius="full" bg="blue.500" border="2px solid white" zIndex={1} />
                                    <Box w="44%" bg="white" border="1px solid" borderColor="blue.100" borderRadius="lg" p={2}>
                                        <Bar w="70%" mb={1} />
                                        <Box h="7px" w="55%" bg="blue.50" borderRadius="full" mb={1} />
                                        <BlueBar w="80%" />
                                    </Box>
                                </Flex>
                            );
                        })}
                    </Flex>
                </Box>
            );
        // Design 3 — horizontal stepper: numbered nodes joined by a connecting line.
        case 3:
            return (
                <Box position="relative" px={1} pt={3}>
                    <Box position="absolute" top="9px" left="12%" right="12%" h="2px" bg="blue.100" />
                    <SimpleGrid columns={4} spacing={2}>
                        {[0, 1, 2, 3].map((i) => (
                            <Flex key={i} direction="column" align="center" position="relative">
                                <Box w="14px" h="14px" borderRadius="full" bg="blue.500" border="2px solid white" mb={2} zIndex={1} />
                                <Bar w="75%" mb={1} />
                                <Box h="6px" w="55%" bg="blue.50" borderRadius="full" mb={1} />
                                <BlueBar w="60%" />
                            </Flex>
                        ))}
                    </SimpleGrid>
                </Box>
            );
        default:
            return <Center minH="120px"><Bar w="60%" /></Center>;
    }
};

// Short blurb shown under each timeline design so the admin knows what it looks like.
const TIMELINE_DESIGN_INFO = {
    1: { title: "Numbered Cards Grid", hint: "Four-column grid of cards with a numbered badge, icon, coloured stripe and description." },
    2: { title: "Vertical Timeline", hint: "Centred vertical line with cards alternating left and right (desktop); stacked on mobile." },
    3: { title: "Horizontal Stepper", hint: "Numbered nodes joined by a connecting line, stacking into rows on mobile." },
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
                                        const isEventDates = component.key === "eventDates";
                                        const info = isEventDates ? TIMELINE_DESIGN_INFO[design] : null;
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
                                                textAlign={isEventDates ? "left" : "center"}
                                                position="relative"
                                                transition="all 0.15s"
                                                _hover={{ borderColor: `${ACCENT}.300`, transform: "translateY(-2px)", boxShadow: "sm" }}
                                            >
                                                {isSelected && (
                                                    <Box position="absolute" top={2} right={2} color={`${ACCENT}.500`} zIndex={1}>
                                                        <FaCheckCircle />
                                                    </Box>
                                                )}
                                                {isEventDates ? (
                                                    <>
                                                        <Box
                                                            bg={isSelected ? `${ACCENT}.50` : "gray.50"}
                                                            border="1px solid"
                                                            borderColor="gray.200"
                                                            borderRadius="lg"
                                                            p={2}
                                                            minH="120px"
                                                            mb={3}
                                                        >
                                                            <TimelineWireframe design={design} />
                                                        </Box>
                                                        <Text fontWeight="semibold" fontSize="sm" color={isSelected ? `${ACCENT}.800` : "gray.700"} mb={0.5}>
                                                            {info?.title || `Design ${design}`}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500" noOfLines={2}>
                                                            {info?.hint}
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
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
