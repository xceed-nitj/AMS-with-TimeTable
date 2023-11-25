import React from 'react'
import logoImage from '../../assets/logo.png'

import { Image, Text } from '@chakra-ui/react'

const FormHeader = () => {
  return (
    <>
      <Image
        width={{
          base: '4rem',
          md: '5rem',
          lg: '6rem',
        }}
        height={{
          base: '4rem',
          md: '5rem',
          lg: '6rem',
        }}
        // display={{
        //   base: 'none',
        //   md: 'block',
        // }}
        marginInline={'auto'}
        src={logoImage}
        alt='NITJ Logo'
        mb={4}
        userSelect={'none'}
        draggable={false}
      />

      <Text
        fontSize={{
          base: '2xl',
          md: '3xl',
          lg: '4xl',
        }}
        textAlign={'center'}
        fontWeight='bold'
        mb={2}>
        Welcome to XCEED
      </Text>
      <Text
        fontSize='md'
        mb={{
          base: '2rem',
          md: '4rem',
        }}
        textAlign={'center'}
        color={'gray.500'}>
        Empowering campus connectivity through digital innovation
      </Text>
    </>
  )
}

export default FormHeader
