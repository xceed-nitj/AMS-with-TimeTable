import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    Box, Flex, Text, Button, Badge, Switch, HStack, Icon, Center, Tooltip, useToast,
} from "@chakra-ui/react";
import {
    FaThLarge, FaSave, FaArrowUp, FaArrowDown, FaEye, FaEyeSlash, FaUndo,
} from "react-icons/fa";
import { PageShell, PageHeader } from "../components/ui";

const ACCENT = "pink";

// ── Wireframe thumbnails ──────────────────────────────────────────────────────
// Tiny schematic mockups so the admin sees the *shape* of each section, not just
// its name. Drawn locally with Chakra primitives — the real designs render on the
// public conference site, which isn't part of this admin client.
const Bar = (props) => <Box h="4px" borderRadius="full" bg="gray.300" {...props} />;

const SectionThumb = ({ sectionKey, accent = ACCENT }) => {
    const dot = (opacity) => (
        <Box w="5px" h="5px" borderRadius="full" bg="whiteAlpha.900" opacity={opacity} />
    );
    switch (sectionKey) {
        case "slider":
            return (
                <Flex h="44px" borderRadius="md" bgGradient={`linear(to-r, ${accent}.300, ${accent}.500)`} align="flex-end" justify="center" pb={1.5}>
                    <HStack spacing={1}>{dot(1)}{dot(0.5)}{dot(0.5)}</HStack>
                </Flex>
            );
        case "aboutConf":
        case "aboutDept":
            return (
                <HStack spacing={2} align="center" py={1}>
                    <Box w="34px" h="30px" borderRadius="md" bg={`${accent}.100`} flexShrink={0} />
                    <Box flex="1"><Bar w="90%" mb={1.5} /><Bar w="70%" mb={1.5} /><Bar w="80%" /></Box>
                </HStack>
            );
        case "aboutInstitute":
            return (
                <HStack spacing={2} align="center" py={1}>
                    <Box flex="1"><Bar w="80%" mb={1.5} /><Bar w="70%" mb={1.5} /><Bar w="85%" /></Box>
                    <Box w="34px" h="30px" borderRadius="md" bg="gray.200" flexShrink={0} />
                </HStack>
            );
        case "timeline":
            return (
                <HStack spacing={0} py={2} px={1} justify="space-between">
                    {[0, 1, 2, 3].map((i) => (
                        <Flex key={i} align="center" flex={i < 3 ? 1 : "0 0 auto"} w="100%">
                            <Box w="7px" h="7px" borderRadius="full" bg={`${accent}.400`} flexShrink={0} />
                            {i < 3 && <Box flex="1" h="2px" bg="gray.200" />}
                        </Flex>
                    ))}
                </HStack>
            );
        case "countdown":
            return (
                <HStack spacing={1} justify="center" py={1.5}>
                    {["12", "04", "57", "30"].map((n, i) => (
                        <React.Fragment key={i}>
                            <Center w="20px" h="22px" borderRadius="sm" bg="gray.800">
                                <Text fontSize="10px" fontWeight="bold" color="white">{n}</Text>
                            </Center>
                            {i < 3 && <Text fontSize="10px" color="gray.400">:</Text>}
                        </React.Fragment>
                    ))}
                </HStack>
            );
        case "speakers":
            return (
                <HStack spacing={2} justify="center" py={1}>
                    {[0, 1, 2, 3].map((i) => (
                        <Box key={i}>
                            <Box w="22px" h="22px" borderRadius="full" bg={`${accent}.200`} mb={1} />
                            <Bar w="22px" />
                        </Box>
                    ))}
                </HStack>
            );
        case "sponsors":
            return (
                <HStack spacing={2} justify="center" py={2}>
                    {[0, 1, 2].map((i) => (
                        <Box key={i} w="42px" h="18px" borderRadius="sm" bg="gray.200" />
                    ))}
                </HStack>
            );
        case "cmtNotice":
            return (
                <Center py={1.5}>
                    <Box w="80%" h="10px" borderRadius="full" bg="gray.100" />
                </Center>
            );
        default:
            return <Center py={3}><Bar w="60%" /></Center>;
    }
};

// Short descriptions shown under each section name in the admin list.
const SECTION_HINTS = {
    slider: "Hero image slider at the top of the page",
    aboutConf: "About-the-conference text sections",
    timeline: "Important dates timeline",
    aboutInstitute: "About the institute (NITJ)",
    countdown: "Countdown timer to the conference start",
    aboutDept: "About the organising department",
    speakers: "Keynote / invited speakers grid",
    sponsors: "Sponsor logos",
    cmtNotice: "Microsoft CMT acknowledgement notice",
};

const HomeLayout = () => {
    const { confid: confId } = useParams();
    const apiUrl = getEnvironment();
    const toast = useToast();

    const [sections, setSections] = useState([]);
    const [savedSections, setSavedSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!confId) return;
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/homelayout/${confId}`, { withCredentials: true })
            .then((res) => {
                const list = res.data?.sections || [];
                setSections(list);
                setSavedSections(list);
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [confId, apiUrl]);

    const isDirty = JSON.stringify(sections) !== JSON.stringify(savedSections);

    const move = (index, direction) => {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= sections.length) return;
        const next = [...sections];
        [next[index], next[target]] = [next[target], next[index]];
        setSections(next.map((s, i) => ({ ...s, order: i + 1 })));
    };

    const toggleVisible = (index) => {
        setSections((prev) =>
            prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
        );
    };

    const handleReset = () => setSections(savedSections);

    const handleSave = () => {
        setSaving(true);
        const payload = { sections: sections.map((s, i) => ({ key: s.key, visible: s.visible, order: i + 1 })) };
        axios.put(`${apiUrl}/conferencemodule/homelayout/${confId}`, payload, { withCredentials: true })
            .then((res) => {
                const list = res.data?.sections || sections;
                setSections(list);
                setSavedSections(list);
                toast({ title: "Home layout saved", description: "The public site will use this arrangement.", status: "success", duration: 2500, isClosable: true });
            })
            .catch((err) => {
                console.log(err);
                toast({ title: "Failed to save layout", description: err?.response?.data?.error || err.message, status: "error", duration: 4000, isClosable: true });
            })
            .finally(() => setSaving(false));
    };

    const visibleCount = sections.filter((s) => s.visible).length;

    return (
        <PageShell>
            <PageHeader
                icon={FaThLarge}
                title="Home Page Layout"
                subtitle="Choose which sections appear on the public site's home page, and in what order."
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

            {!loading ? (
                <Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
                    {/* Section list */}
                    <Box flex="1" minW={0} w="100%" bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden">
                        <Flex px={5} py={3} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center">
                            <Text fontWeight="bold" color={`${ACCENT}.800`}>Sections</Text>
                            <Badge colorScheme={ACCENT} borderRadius="full" px={3}>
                                {visibleCount} of {sections.length} visible
                            </Badge>
                        </Flex>
                        {sections.map((section, index) => (
                            <Flex
                                key={section.key}
                                align="center"
                                gap={3}
                                px={5} py={3.5}
                                borderBottom={index < sections.length - 1 ? "1px solid" : "none"}
                                borderColor="gray.100"
                                bg={section.visible ? "white" : "gray.50"}
                                transition="background 0.2s"
                            >
                                <Badge
                                    colorScheme={section.visible ? ACCENT : "gray"}
                                    borderRadius="full"
                                    w="26px" h="26px"
                                    display="inline-flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                >
                                    {index + 1}
                                </Badge>
                                <Box flex="1" minW={0} opacity={section.visible ? 1 : 0.55}>
                                    <Text fontWeight="semibold" fontSize="sm">{section.label}</Text>
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                        {SECTION_HINTS[section.key] || section.key}
                                    </Text>
                                </Box>
                                <Tooltip label="Move up" hasArrow>
                                    <Button size="sm" variant="outline" onClick={() => move(index, "up")} isDisabled={index === 0}>
                                        <FaArrowUp />
                                    </Button>
                                </Tooltip>
                                <Tooltip label="Move down" hasArrow>
                                    <Button size="sm" variant="outline" onClick={() => move(index, "down")} isDisabled={index === sections.length - 1}>
                                        <FaArrowDown />
                                    </Button>
                                </Tooltip>
                                <Tooltip label={section.visible ? "Shown on the site" : "Hidden from the site"} hasArrow>
                                    <Box>
                                        <HStack spacing={2}>
                                            <Icon
                                                as={section.visible ? FaEye : FaEyeSlash}
                                                color={section.visible ? `${ACCENT}.500` : "gray.400"}
                                            />
                                            <Switch
                                                colorScheme={ACCENT}
                                                isChecked={section.visible}
                                                onChange={() => toggleVisible(index)}
                                            />
                                        </HStack>
                                    </Box>
                                </Tooltip>
                            </Flex>
                        ))}
                    </Box>

                    {/* Order preview */}
                    <Box
                        w={{ base: "100%", lg: "300px" }}
                        flexShrink={0}
                        position={{ lg: "sticky" }}
                        top={{ lg: "90px" }}
                        bg="white"
                        borderRadius="2xl"
                        boxShadow="md"
                        overflow="hidden"
                    >
                        <Flex px={5} py={3} borderBottom="1px solid" borderColor="gray.100">
                            <Text fontWeight="bold" color={`${ACCENT}.800`}>Page Preview</Text>
                        </Flex>
                        <Box p={4}>
                            <Box border="2px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                                <Box bg="gray.800" px={3} py={1.5}>
                                    <Text color="whiteAlpha.700" fontSize="10px" letterSpacing="widest" textAlign="center">
                                        NAVBAR
                                    </Text>
                                </Box>
                                {sections.filter((s) => s.visible).map((s) => (
                                    <Box
                                        key={s.key}
                                        px={3} py={2}
                                        borderBottom="1px dashed"
                                        borderColor="gray.200"
                                        bg="white"
                                    >
                                        <Text fontSize="9px" fontWeight="semibold" letterSpacing="wide" textTransform="uppercase" color="gray.400" mb={1}>
                                            {s.label}
                                        </Text>
                                        <SectionThumb sectionKey={s.key} accent={ACCENT} />
                                    </Box>
                                ))}
                                <Box bg="gray.800" px={3} py={1.5}>
                                    <Text color="whiteAlpha.700" fontSize="10px" letterSpacing="widest" textAlign="center">
                                        FOOTER
                                    </Text>
                                </Box>
                            </Box>
                            <Text fontSize="xs" color="gray.500" mt={3}>
                                A schematic of how the home page sections will be stacked on the public site. Actual colours and content come from your site settings.
                            </Text>
                        </Box>
                    </Box>
                </Flex>
            ) : <Center py={10}><LoadingIcon /></Center>}
        </PageShell>
    );
};

export default HomeLayout;
