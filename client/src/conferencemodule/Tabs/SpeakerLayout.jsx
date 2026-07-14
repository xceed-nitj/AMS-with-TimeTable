import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link as RouterLink } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    Box, Flex, Text, Button, Badge, HStack, SimpleGrid, Center, Code, Icon, useToast,
} from "@chakra-ui/react";
import { FaMicrophone, FaSave, FaUndo, FaCheckCircle, FaBars, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { PageShell, PageHeader } from "../components/ui";

const ACCENT = "teal";
const COMPONENT_KEY = "speakers";

// ── Speaker-section wireframes ────────────────────────────────────────────────
// Schematic mockups of the five speaker layouts the public site implements
// (/speakers1 … /speakers5). Drawn locally with Chakra primitives to mirror each
// real design — the actual pages render on the public conference site, not here.
const Bar = (props) => <Box h="4px" borderRadius="full" bg="gray.300" {...props} />;
const BlueBar = (props) => <Box h="3px" borderRadius="full" bg="blue.300" {...props} />;

const SpeakerWireframe = ({ design }) => {
    switch (design) {
        // Design 1 — classic centred round-avatar cards, 4-up grid.
        case 1:
            return (
                <SimpleGrid columns={3} spacing={2}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Box key={i} bg="white" border="1px solid" borderColor="blue.100" borderRadius="lg" p={2}>
                            <Box w="24px" h="24px" borderRadius="full" bg="blue.100" mx="auto" mb={1.5} />
                            <Bar w="70%" mx="auto" mb={1} />
                            <Bar w="50%" mx="auto" mb={1} />
                            <BlueBar w="55%" mx="auto" />
                        </Box>
                    ))}
                </SimpleGrid>
            );
        // Design 2 — horizontal list: square photo beside name / role, wider rows.
        case 2:
            return (
                <Flex direction="column" gap={2}>
                    {[0, 1, 2].map((i) => (
                        <HStack key={i} bg="white" border="1px solid" borderColor="blue.100" borderRadius="lg" p={2.5} spacing={3}>
                            <Box w="30px" h="30px" borderRadius="md" bg="blue.100" flexShrink={0} />
                            <Box flex="1">
                                <Bar w="55%" mb={1.5} />
                                <Bar w="80%" mb={1.5} />
                                <BlueBar w="65%" />
                            </Box>
                        </HStack>
                    ))}
                </Flex>
            );
        // Design 3 — full-bleed photo with a navy gradient overlay, text at the foot.
        case 3:
            return (
                <SimpleGrid columns={2} spacing={2}>
                    {[0, 1].map((i) => (
                        <Box
                            key={i}
                            h="112px"
                            borderRadius="lg"
                            position="relative"
                            overflow="hidden"
                            style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1e3a8a 100%)" }}
                        >
                            <Box
                                position="absolute"
                                bottom={0}
                                left={0}
                                right={0}
                                p={2}
                                style={{ background: "linear-gradient(180deg, transparent, rgba(10,15,30,0.9))" }}
                            >
                                <Box h="4px" w="70%" bg="whiteAlpha.900" borderRadius="full" mb={1} />
                                <Box h="3px" w="45%" bg="blue.300" borderRadius="full" />
                            </Box>
                        </Box>
                    ))}
                </SimpleGrid>
            );
        // Design 4 — minimal cards with a small gradient accent underline.
        case 4:
            return (
                <SimpleGrid columns={3} spacing={2}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Box key={i} bg="white" border="1px solid" borderColor="blue.100" borderRadius="md" p={2} textAlign="center">
                            <Box w="22px" h="22px" borderRadius="md" bg="blue.100" mx="auto" mb={1.5} />
                            <Bar w="70%" mx="auto" mb={1} />
                            <Bar w="45%" mx="auto" mb={1.5} />
                            <Box h="3px" w="22px" mx="auto" borderRadius="full" mb={1.5} style={{ background: "linear-gradient(90deg, #60a5fa, #93c5fd)" }} />
                            <BlueBar w="55%" mx="auto" />
                        </Box>
                    ))}
                </SimpleGrid>
            );
        // Design 5 — elevated cards: ring avatar, "Invited" badge, "View Profile".
        case 5:
            return (
                <SimpleGrid columns={3} spacing={2}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Box key={i} bg="white" border="1px solid" borderColor="blue.100" borderRadius="lg" p={2} textAlign="center" position="relative">
                            {i === 0 && (
                                <Box position="absolute" top="4px" right="4px" h="6px" w="18px" borderRadius="full" bg="blue.500" />
                            )}
                            <Box w="24px" h="24px" borderRadius="full" bg="blue.100" border="3px solid" borderColor="blue.50" mx="auto" mb={1.5} />
                            <Bar w="70%" mx="auto" mb={1} />
                            <Bar w="50%" mx="auto" mb={1.5} />
                            <Box h="3px" w="42%" bg="blue.400" borderRadius="full" mx="auto" />
                        </Box>
                    ))}
                </SimpleGrid>
            );
        default:
            return <Center minH="120px"><Bar w="60%" /></Center>;
    }
};

// Short blurb shown under each design so the admin knows what it looks like.
const DESIGN_INFO = {
    1: { title: "Centred Avatar Cards", hint: "Round photo centred with name, designation and institute — a four-column grid." },
    2: { title: "Horizontal List", hint: "Square photo beside the name, designation and institute, in wider rows." },
    3: { title: "Photo Spotlight", hint: "Full-bleed photo with a navy gradient overlay and the name across the bottom." },
    4: { title: "Minimal Underline", hint: "Compact card with a small gradient accent underline under the name." },
    5: { title: "Elevated Profile", hint: "Ring-framed avatar with an 'Invited' badge and a 'View Profile' link." },
};

const SpeakerLayout = () => {
    const { confid: confId } = useParams();
    const apiUrl = getEnvironment();
    const toast = useToast();

    // Full component list is kept so saving preserves the other components'
    // designs (the customisation endpoint replaces the whole array).
    const [components, setComponents] = useState([]);
    const [savedComponents, setSavedComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Nav menu items whose link is tied to the Speakers page (linkType
    // "speakers"). Their url is resolved server-side from this same design
    // selection, so they always match — this list is just shown for visibility.
    const [navItems, setNavItems] = useState([]);
    const [navLoading, setNavLoading] = useState(true);

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

    useEffect(() => {
        if (!confId) return;
        setNavLoading(true);
        axios.get(`${apiUrl}/conferencemodule/navitem/conf/${confId}`, { withCredentials: true })
            .then((res) => setNavItems(res.data || []))
            .catch((err) => console.log(err))
            .finally(() => setNavLoading(false));
    }, [confId, apiUrl, savedComponents]);

    const speakers = components.find((c) => c.key === COMPONENT_KEY);
    const designCount = speakers?.designCount || 5;
    const selected = speakers?.design || 1;

    // Menu entries (top-level or nested under a dropdown) pointing at the
    // Speakers page, flattened for display.
    const speakersMenuEntries = navItems.flatMap((item) => {
        const entries = [];
        if (item.linkType === "speakers") entries.push({ label: item.label, section: item.section, parent: null });
        (item.subItems || []).forEach((sub) => {
            if (sub.linkType === "speakers") entries.push({ label: sub.label, section: item.section, parent: item.label });
        });
        return entries;
    });

    const isDirty = JSON.stringify(components) !== JSON.stringify(savedComponents);

    const selectDesign = (design) => {
        setComponents((prev) =>
            prev.map((c) => (c.key === COMPONENT_KEY ? { ...c, design } : c))
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
                toast({ title: "Speaker layout saved", description: `The public site will render the speakers${res.data?.components?.find((c) => c.key === COMPONENT_KEY)?.design || selected} layout.`, status: "success", duration: 2500, isClosable: true });
            })
            .catch((err) => {
                console.log(err);
                toast({ title: "Failed to save speaker layout", description: err?.response?.data?.error || err.message, status: "error", duration: 4000, isClosable: true });
            })
            .finally(() => setSaving(false));
    };

    return (
        <PageShell>
            <PageHeader
                icon={FaMicrophone}
                title="Speaker Layout"
                subtitle="Choose how the speakers section looks on the public conference site. Your choice maps to one of the /speakers1 … /speakers5 designs."
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
                        Save Layout
                    </Button>
                </HStack>
            </PageHeader>

            {!loading && speakers ? (
                <Flex direction="column" gap={5}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                        <Text color="gray.600" fontSize="sm">
                            Selected design renders as <Code colorScheme={ACCENT}>speakers{selected}</Code> on the public site.
                        </Text>
                        <Badge colorScheme={ACCENT} borderRadius="full" px={3}>
                            speakers{selected} selected
                        </Badge>
                    </Flex>

                    {/* Navbar menu link — shows which menu item(s) point at the
                        Speakers page, or prompts to create one in Nav Menu first. */}
                    {!navLoading && (
                        <Box bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden">
                            <Flex px={5} py={3} borderBottom="1px solid" borderColor="gray.100" align="center" gap={2}>
                                <Icon as={FaBars} color={`${ACCENT}.500`} />
                                <Text fontWeight="bold" color={`${ACCENT}.800`}>Navbar Menu Link</Text>
                            </Flex>
                            <Box p={5}>
                                {speakersMenuEntries.length > 0 ? (
                                    <Flex direction="column" gap={2}>
                                        <Text fontSize="sm" color="gray.600">
                                            These menu items link to the Speakers page and update automatically whenever you change the design above:
                                        </Text>
                                        <Flex wrap="wrap" gap={2} mt={1}>
                                            {speakersMenuEntries.map((entry, i) => (
                                                <Badge key={i} colorScheme={ACCENT} variant="subtle" borderRadius="full" px={3} py={1}>
                                                    {entry.parent ? `${entry.parent} → ${entry.label}` : entry.label}
                                                    {" "}({entry.section}) → /speakers{selected}
                                                </Badge>
                                            ))}
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <Flex align="center" gap={3} bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="lg" p={3}>
                                        <Icon as={FaExclamationTriangle} color="orange.400" flexShrink={0} />
                                        <Text fontSize="sm" color="orange.800" flex="1">
                                            No menu item links to the Speakers page yet. Create one in <b>Nav Menu</b> first —
                                            add a menu item and set its link type to <b>&ldquo;Speakers Page&rdquo;</b>; it will always
                                            point at whichever design (/speakers1 … /speakers{designCount}) is selected here.
                                        </Text>
                                        <Button
                                            as={RouterLink}
                                            to={`/cf/${confId}/navmenu`}
                                            size="sm"
                                            colorScheme="orange"
                                            rightIcon={<FaArrowRight />}
                                            flexShrink={0}
                                        >
                                            Go to Nav Menu
                                        </Button>
                                    </Flex>
                                )}
                            </Box>
                        </Box>
                    )}

                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                        {Array.from({ length: designCount }, (_, i) => i + 1).map((design) => {
                            const isSelected = selected === design;
                            const info = DESIGN_INFO[design] || { title: `Design ${design}`, hint: "" };
                            return (
                                <Box
                                    key={design}
                                    as="button"
                                    type="button"
                                    onClick={() => selectDesign(design)}
                                    textAlign="left"
                                    bg="white"
                                    border="2px solid"
                                    borderColor={isSelected ? `${ACCENT}.400` : "gray.200"}
                                    borderRadius="2xl"
                                    boxShadow={isSelected ? "md" : "sm"}
                                    overflow="hidden"
                                    position="relative"
                                    transition="all 0.15s"
                                    _hover={{ borderColor: `${ACCENT}.300`, transform: "translateY(-3px)", boxShadow: "lg" }}
                                >
                                    {isSelected && (
                                        <Box position="absolute" top={3} right={3} color={`${ACCENT}.500`} fontSize="lg" zIndex={1}>
                                            <FaCheckCircle />
                                        </Box>
                                    )}

                                    {/* Wireframe preview */}
                                    <Box p={4} bg={isSelected ? `${ACCENT}.50` : "gray.50"} borderBottom="1px solid" borderColor="gray.100">
                                        <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" p={3} minH="140px">
                                            <SpeakerWireframe design={design} />
                                        </Box>
                                    </Box>

                                    {/* Caption */}
                                    <Box p={4}>
                                        <HStack justify="space-between" mb={1}>
                                            <Text fontWeight="bold" color={isSelected ? `${ACCENT}.800` : "gray.700"}>
                                                {info.title}
                                            </Text>
                                            <Code fontSize="xs" colorScheme={isSelected ? ACCENT : "gray"}>
                                                speakers{design}
                                            </Code>
                                        </HStack>
                                        <Text fontSize="xs" color="gray.500" noOfLines={2}>
                                            {info.hint}
                                        </Text>
                                    </Box>
                                </Box>
                            );
                        })}
                    </SimpleGrid>

                    <Text fontSize="xs" color="gray.500">
                        These are schematic previews. The design numbers (speakers1–speakers{designCount}) correspond to the
                        speaker-section variants implemented on the public conference site; the actual colours, photos and
                        content come from the speakers you add in the Speakers tab.
                    </Text>
                </Flex>
            ) : <Center py={10}><LoadingIcon /></Center>}
        </PageShell>
    );
};

export default SpeakerLayout;
