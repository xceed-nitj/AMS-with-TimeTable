// src/components/Header.js

import { IconButton as Button, Heading, chakra } from '@chakra-ui/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <Heading as='h1' fontSize={32} mt='6' mb='6' display='flex' alignItems='center' >
      <Button
        variant='ghost'
        onClick={() => navigate(-1)}
        aria-label='Back'
        _hover={{ bgColor: 'transparent' }}
      >
        <chakra.svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='black'
          width={34}
          height={34}
        //   className='w-4 h-4'
          _hover={{ stroke: '#00BFFF' }}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </chakra.svg>
      </Button>
      <chakra.div marginInline='auto' >
        {title}
      </chakra.div>
    </Heading>
  );
};

export default Header;
