import { useEffect, useState } from 'react'
import { Flex, Box, HStack, Badge, Text } from '@chakra-ui/react'

export default function Header() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toLocaleDateString('en-PK', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' ' + now.toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setTime(formatted)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Flex
      as="header"
      zIndex={10}
      alignItems="center"
      justifyContent="space-between"
      px={6}
      h="58px"
      borderBottom="1px solid"
      borderColor="slate.700"
      bg="rgba(0, 0, 0, 0.95)"
      backdropFilter="blur(12px)"
    >
      <HStack gap={3}>
        <Box w={9} h={9} bgGradient="to-br(from=#fbbf24, to=#b45309)" rounded="lg" display="flex" alignItems="center" justifyContent="center" fontSize="lg" flexShrink={0}>
          🦗
        </Box>
        <Box>
          <Text fontSize="13px" fontWeight="black" color="amber.500" letterSpacing="wide" fontFamily="'Orbitron', sans-serif">
            LC-EWS
          </Text>
          <Text fontSize="10px" color="slate.400" letterSpacing="wide" textTransform="uppercase" fontFamily="'Space Mono', monospace">
            Locust Early Warning System
          </Text>
        </Box>
      </HStack>
      <HStack gap="14px">
        <Badge
          px={3}
          py={1}
          rounded="full"
          fontSize="10.5px"
          fontFamily="'Space Mono', monospace"
          letterSpacing="wide"
          bg="green.900/20"
          borderColor="green.600/30"
          border="1px solid"
          color="green.400"
        >
          <Box w={1.5} h={1.5} rounded="full" bg="currentColor" mr={1.5} animation="1.5s infinite pulse" />
          AI Engine Online
        </Badge>
        <Badge
          px={3}
          py={1}
          rounded="full"
          fontSize="10.5px"
          fontFamily="'Space Mono', monospace"
          letterSpacing="wide"
          bg="amber.900/20"
          borderColor="amber.600/30"
          border="1px solid"
          color="amber.400"
        >
          <Box w={1.5} h={1.5} rounded="full" bg="currentColor" mr={1.5} animation="1.5s infinite pulse" />
          3 Active Swarms
        </Badge>
        <Badge
          px={3}
          py={1}
          rounded="full"
          fontSize="10.5px"
          fontFamily="'Space Mono', monospace"
          letterSpacing="wide"
          bg="green.900/20"
          borderColor="green.600/30"
          border="1px solid"
          color="green.400"
        >
          <Box w={1.5} h={1.5} rounded="full" bg="currentColor" mr={1.5} animation="1.5s infinite pulse" />
          Cloud: AWS-ap-south-1
        </Badge>
        <Text fontFamily="'Space Mono', monospace" fontSize="11px" color="slate.400">
          {time}
        </Text>
      </HStack>
    </Flex>
  )
}
