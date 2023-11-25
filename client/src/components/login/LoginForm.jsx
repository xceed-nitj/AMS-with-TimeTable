import React, { useState } from 'react'
import FormHeader from './FormHeader'
import getEnvironment from '../../getenvironment'
import { Button, Input, Text, VStack, Flex } from '@chakra-ui/react'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const apiUrl = getEnvironment()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const userData = { email, password }

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      })

      if (response.ok) {
        const responseData = await response.json()
        setMessage(responseData.message)
        window.location.href = '/dashboard'
      } else {
        const errorData = await response.json()
        setMessage(`Login failed: ${errorData.message}`)
      }
    } catch (error) {
      console.error('An error occurred', error)
      setMessage('An error occurred. Please try again.')
    }
  }
  return (
    <Flex
      flex={{
        base: '50%',
        lg: '30%',
      }}
      marginBlock={{ base: 10, md: 0 }}
      display='flex'
      flexDirection='column'
      paddingInline={{
        base: '1rem',
        md: '2rem',
      }}>
      <FormHeader />
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} width='100%'>
          <Input
            type='email'
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type='password'
            placeholder='Enter your password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
          />
          <Button
            colorScheme='blackAlpha'
            bg={'blackAlpha.900'}
            onClick={handleSubmit}
            width={'100%'}>
            Login
          </Button>
        </VStack>
      </form>

      {message && <Text mt={4}>{message}</Text>}
    </Flex>
  )
}

export default LoginForm
