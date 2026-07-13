// Shared design kit for the conference module admin panel.
// Presentation-only components — no data logic lives here.
import React from "react";
import {
    Box, Flex, Heading, Text, Button, Badge, SimpleGrid, Icon, HStack,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Table, TableContainer, Thead, Tr, Th, Td, Center, Tooltip,
} from "@chakra-ui/react";
import { FaEdit, FaTrashAlt, FaExclamationTriangle, FaInbox } from "react-icons/fa";

// Single place to tune the accent gradients used across the panel.
const GRADIENTS = {
    blue: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    teal: "linear-gradient(135deg, #134e4a 0%, #14b8a6 100%)",
    orange: "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
    green: "linear-gradient(135deg, #14532d 0%, #22c55e 100%)",
    purple: "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)",
    pink: "linear-gradient(135deg, #831843 0%, #ec4899 100%)",
    cyan: "linear-gradient(135deg, #164e63 0%, #06b6d4 100%)",
    red: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)",
    yellow: "linear-gradient(135deg, #713f12 0%, #eab308 100%)",
    gray: "linear-gradient(135deg, #1f2937 0%, #6b7280 100%)",
};

export const accentGradient = (accent) => GRADIENTS[accent] || GRADIENTS.blue;

// ── Page banner ──────────────────────────────────────────────────────────────
// variant="solid" (default): accent gradient background with white text.
// variant="outline": white background with an accent border and dark text,
// for pages where the filled banner is too dark.
export const PageHeader = ({ icon, title, subtitle, accent = "blue", variant = "solid", children }) => {
    const isOutline = variant === "outline";
    return (
        <Box
            borderRadius="2xl"
            px={{ base: 5, md: 8 }}
            py={6}
            mb={6}
            color={isOutline ? "gray.800" : "white"}
            bg={isOutline ? "white" : undefined}
            border={isOutline ? "2px solid" : undefined}
            borderColor={isOutline ? `${accent}.400` : undefined}
            style={isOutline ? undefined : { background: accentGradient(accent) }}
            boxShadow={isOutline ? "md" : "lg"}
        >
            <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                <HStack spacing={4}>
                    {icon && (
                        <Center
                            bg={isOutline ? `${accent}.50` : "whiteAlpha.300"}
                            color={isOutline ? `${accent}.600` : undefined}
                            borderRadius="xl"
                            boxSize="52px"
                            fontSize="24px"
                        >
                            <Icon as={icon} />
                        </Center>
                    )}
                    <Box>
                        <Heading as="h1" size="lg" letterSpacing="tight" color={isOutline ? `${accent}.700` : undefined}>
                            {title}
                        </Heading>
                        {subtitle && (
                            <Text mt={1} color={isOutline ? "gray.600" : "whiteAlpha.800"} fontSize="sm">
                                {subtitle}
                            </Text>
                        )}
                    </Box>
                </HStack>
                {children && <Box>{children}</Box>}
            </Flex>
        </Box>
    );
};

// ── Form container ───────────────────────────────────────────────────────────
export const FormCard = ({ title, accent = "blue", isEditing = false, children, actions }) => (
    <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        borderTop="5px solid"
        borderTopColor={`${accent}.400`}
        mb={8}
        overflow="hidden"
    >
        <Flex
            px={{ base: 4, md: 6 }}
            py={3}
            bg={`${accent}.50`}
            borderBottom="1px solid"
            borderBottomColor={`${accent}.100`}
            align="center"
            justify="space-between"
        >
            <Heading as="h2" size="md" color={`${accent}.800`}>{title}</Heading>
            {isEditing && <Badge colorScheme="orange" fontSize="0.8em" px={2} py={1} borderRadius="md">Editing</Badge>}
        </Flex>
        <Box px={{ base: 4, md: 6 }} py={5}>
            {children}
        </Box>
        {actions && (
            <Flex px={{ base: 4, md: 6 }} py={4} bg="gray.50" borderTop="1px solid" borderTopColor="gray.100" justify="center" gap={3}>
                {actions}
            </Flex>
        )}
    </Box>
);

// Two-column responsive field layout; wrap wide fields in <Span2>.
export const FieldGrid = ({ children, columns = { base: 1, md: 2 } }) => (
    <SimpleGrid columns={columns} spacingX={6} spacingY={1}>{children}</SimpleGrid>
);

export const Span2 = ({ children }) => (
    <Box gridColumn={{ md: "1 / -1" }}>{children}</Box>
);

// ── Table container ──────────────────────────────────────────────────────────
export const TableCard = ({ title, count, accent = "blue", children }) => (
    <Box bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden" mb={8}>
        <Flex
            px={{ base: 4, md: 6 }}
            py={4}
            align="center"
            justify="space-between"
            color="white"
            style={{ background: accentGradient(accent) }}
        >
            <Heading as="h2" size="md">{title}</Heading>
            {count !== undefined && (
                <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="0.85em">
                    {count} {count === 1 ? "entry" : "entries"}
                </Badge>
            )}
        </Flex>
        <TableContainer>{children}</TableContainer>
    </Box>
);

export const ThemedTh = ({ accent = "blue", children, ...rest }) => (
    <Th bg={`${accent}.600`} color="white" fontSize="xs" letterSpacing="wider" py={3} {...rest}>
        {children}
    </Th>
);

export const WrapTd = ({ children, maxW = "220px", ...rest }) => (
    <Td sx={{ maxWidth: maxW, whiteSpace: "normal", wordWrap: "break-word" }} {...rest}>
        {children}
    </Td>
);

export const RowActions = ({ onEdit, onDelete }) => (
    <HStack spacing={2} justify="center">
        {onEdit && (
            <Tooltip label="Edit" hasArrow>
                <Button size="sm" colorScheme="teal" variant="solid" onClick={onEdit} leftIcon={<FaEdit />}>
                    Edit
                </Button>
            </Tooltip>
        )}
        {onDelete && (
            <Tooltip label="Delete" hasArrow>
                <Button size="sm" colorScheme="red" variant="outline" onClick={onDelete} leftIcon={<FaTrashAlt />}>
                    Delete
                </Button>
            </Tooltip>
        )}
    </HStack>
);

export const EmptyRow = ({ colSpan, message = "No data available yet — add your first entry above." }) => (
    <Tr>
        <Td colSpan={colSpan} py={10}>
            <Center flexDirection="column" color="gray.400" gap={2}>
                <Icon as={FaInbox} fontSize="28px" />
                <Text fontSize="sm">{message}</Text>
            </Center>
        </Td>
    </Tr>
);

// ── Delete confirmation ──────────────────────────────────────────────────────
export const DeleteModal = ({ isOpen, onCancel, onConfirm, label = "this entry" }) => (
    <Modal isOpen={isOpen} onClose={onCancel} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
            <ModalHeader bg="red.500" color="white" display="flex" alignItems="center" gap={3}>
                <Icon as={FaExclamationTriangle} /> Confirm deletion
            </ModalHeader>
            <ModalBody py={6}>
                <Text>Are you sure you want to delete {label}? This action cannot be undone.</Text>
            </ModalBody>
            <ModalFooter bg="gray.50" gap={3}>
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button colorScheme="red" onClick={onConfirm} leftIcon={<FaTrashAlt />}>Yes, delete</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
);

// Standard page wrapper. The left offset for the fixed sidebar is applied by
// Sidebar's Outlet wrapper (it changes when the sidebar is collapsed).
export const PageShell = ({ children }) => (
    <main className="tw-py-8 tw-min-h-screen tw-bg-slate-100">
        <Box px={{ base: 4, md: 8 }} maxW="1100px" mx="auto">
            {children}
        </Box>
    </main>
);
