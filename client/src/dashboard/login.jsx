import React from 'react'
import { Flex } from '@chakra-ui/react'

import { LogoAnimation } from '../components/login/LogoAnimation'
import LoginForm from '../components/login/LoginForm'
function Login() {
  return (
    <Flex
      minHeight='100vh'
      flexDirection={{ base: 'column', md: 'row' }}
      alignItems='center'
      justifyContent='center'
      // bg={'gray.900'}
      // color={'white'}
    >
      <LogoAnimation />

      <LoginForm />
    </Flex>
  )
}

export default Login
