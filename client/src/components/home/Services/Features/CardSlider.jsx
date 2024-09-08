import { Box, Image, Flex, useStyleConfig } from "@chakra-ui/react";
import { useState } from "react";
import ServiceCard from "../ServiceCard";
import "./style.css"

const CardSlider = ({ services, speed = 20000 }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleHover = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleScroll = (e) => {
    if (isHovering) {
      setScrollPosition(e.target.scrollLeft);
    }
  };

  return (
    <Flex
      overflow="hidden"
      w="100%"
      h="400px"
      onMouseOver={handleHover}
      onMouseLeave={handleMouseLeave}
      onScroll={handleScroll}
    >
      <Flex
        animation={`scrolling ${speed}ms linear infinite`}
        w="fit-content"
        style={{
          animationPlayState: isHovering ? 'paused' : 'running',
          transform: `translateX(${scrollPosition}px)`,
        }}
      >
        {services.map((service, index) => (
          <Box
            key={service.id}
            m={6}
            p={1}
            w="375px"
            border="2px solid #164e63"
            borderRadius="10px"
            overflow="hidden"
          >
            <ServiceCard {...service} />
          </Box>
        ))}
        {services.map((service, index) => (
          <Box
            key={`${service.id}-dup`}
            m={6}
            p={1}
            w="375px"
            border="2px solid #164e63"
            borderRadius="10px"
            overflow="hidden"
          >
            <ServiceCard {...service} />
          </Box>
        ))}
      </Flex>
    </Flex>
  );
};

export default CardSlider;