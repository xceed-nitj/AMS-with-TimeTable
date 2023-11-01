import React from "react";
import { Box } from "@chakra-ui/react";

const PrintableComponent = React.forwardRef((props, ref) => {
  return (
    <Box ref={ref}>
      {/* Your Chakra UI component content here */}
      <h1>Chakra UI Component</h1>
      <p>This is a Chakra UI component to be converted to PDF.</p>
    </Box>
  );
});

export default PrintableComponent;
