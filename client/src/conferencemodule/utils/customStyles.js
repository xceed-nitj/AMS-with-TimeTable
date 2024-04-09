// CustomComponents.js
import { chakra } from "@chakra-ui/react";

// Custom styled Th component for the table header
export const CustomTh = chakra("th", {
  baseStyle: {
    background: "gray.500",
    color: "white",
  },
});

// Custom styled anchor (a) element for hyperlinks
export const CustomLink = chakra("a", {
    baseStyle: {
      color: "blue.500", // Initial link color
      textDecoration: "underline", // Add underlining
      transition: "color 0.5s", // Add a smooth color transition on hover
    },
   
  });


export const CustomBlueButton = chakra("button", {
  baseStyle: {
    color: "white", // Text color
    bg: "blue.600", // Brighter background color (you can adjust the shade)
    paddingX: 4, // Horizontal padding
    paddingY: 2,
    margin:5, // Vertical padding
    borderRadius: "md", // Add some border radius for rounded corners
    _hover: {
      bg: "blue.700", // Brighter background color on hover
    },
    _active: {
      bg: "blue.800", // Background color when clicked
    },
  },
});

export const CustomTealButton = chakra("button", {
  baseStyle: {
    color: "white", // Text color
    bg: "teal", // Brighter background color (you can adjust the shade)
    paddingX: 4, // Horizontal padding
    paddingY: 2,
    margin:0, // Vertical padding
    borderRadius: "md", // Add some border radius for rounded corners
    _hover: {
      bg: "teal.700", // Brighter background color on hover
    },
    _active: {
      bg: "teal.800", // Background color when clicked
    },
  },
});


export const CustomPlusButton = chakra("button", {
    baseStyle: {
      color: "white", // Text color
      bg: "green", // Brighter background color (you can adjust the shade)
      paddingX: 10, // Horizontal padding
      paddingY: 2, // Vertical padding
      borderRadius: "md", // Add some border radius for rounded corners
    //   _hover: {
    //     bg: "blue.700", // Brighter background color on hover
    //   },
    //   _active: {
    //     bg: "blue.800", // Background color when clicked
    //   },
    },
  });
  
  export const CustomDeleteButton = chakra("button", {
    baseStyle: {
      color: "white", // Text color
      bg: "red.600", // Brighter background color (you can adjust the shade)
      paddingX: 6, // Horizontal padding
      paddingY: 2, // Vertical padding
      borderRadius: "md", // Add some border radius for rounded corners
    //   _hover: {
    //     bg: "blue.700", // Brighter background color on hover
    //   },
    //   _active: {
    //     bg: "blue.800", // Background color when clicked
    //   },
    },
  });