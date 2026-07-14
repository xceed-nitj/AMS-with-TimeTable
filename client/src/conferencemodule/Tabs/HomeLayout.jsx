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
                                    <Center
                                        key={s.key}
                                        py={2.5}
                                        borderBottom="1px dashed"
                                        borderColor="gray.200"
                                        bg={`${ACCENT}.50`}
                                    >
                                        <Text fontSize="xs" fontWeight="medium" color={`${ACCENT}.800`}>{s.label}</Text>
                                    </Center>
                                ))}
                                <Box bg="gray.800" px={3} py={1.5}>
                                    <Text color="whiteAlpha.700" fontSize="10px" letterSpacing="widest" textAlign="center">
                                        FOOTER
                                    </Text>
                                </Box>
                            </Box>
                            <Text fontSize="xs" color="gray.500" mt={3}>
                                This is how the home page sections will be stacked on the public site.
                            </Text>
                        </Box>
                    </Box>
                </Flex>
            ) : <Center py={10}><LoadingIcon /></Center>}
        </PageShell>
    );
};

export default HomeLayout;
