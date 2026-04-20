import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function DroneOps() {
  const metrics = [
    { label: 'Total Fleet', value: '12', bgColor: 'purple.900/30' },
    { label: 'On Mission', value: '4', bgColor: 'orange.900/30' },
    { label: 'Available', value: '7', bgColor: 'green.900/30' },
    { label: 'Battery Avg', value: '76%', bgColor: 'blue.900/30' },
  ]

  const drones = [
    { id: 'DPP-01', zone: 'Khuzdar', battery: 85, status: 'On Mission' },
    { id: 'DPP-02', zone: 'Jacobabad', battery: 72, status: 'On Mission' },
    { id: 'DPP-03', zone: 'Quetta', battery: 45, status: 'Returning' },
    { id: 'DPP-04', zone: 'Base', battery: 100, status: 'Standby' },
  ]

  const timeline = [
    { time: 'Today 09:15', event: 'Drone DPP-03 deployed to Quetta', status: 'Active' },
    { time: 'Today 08:45', event: 'DPP-01 completed survey mission', status: 'Complete' },
    { time: 'Today 08:00', event: 'All drones reviewed and maintenance complete', status: 'Complete' },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading as="h1" size="2xl" color="slate.50" mb={3} letterSpacing="-0.02em" fontWeight={500}>
          Drone Operations
        </Heading>
        <Text fontSize="lg" color="slate.400">Fleet coordination and mission management</Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={6}>
        {metrics.map((metric) => (
          <Box key={metric.label} bg={metric.bgColor} border="1px solid" borderColor="slate.700" rounded="lg" p={6} shadow="sm">
            <Text fontSize="sm" color="slate.400">{metric.label}</Text>
            <Text fontSize="2xl" fontWeight="semibold" color="slate.50" mt={1}>{metric.value}</Text>
          </Box>
        ))}
      </Grid>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Active Drones</Heading>
        <VStack gap={3} align="stretch">
          {drones.map((drone) => (
            <HStack key={drone.id} justify="space-between" p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <Box>
                <Text fontWeight="medium" color="slate.50">{drone.id}</Text>
                <Text fontSize="xs" color="slate.400">{drone.zone}</Text>
              </Box>
              <HStack gap={4}>
                <Box w={24}>
                  <Box
                    bg={drone.battery > 70 ? 'green.800' : drone.battery > 40 ? 'orange.800' : 'red.800'}
                    overflow="hidden"
                    h={1.5}
                    rounded="full"
                    w="full"
                  >
                    <Box
                      bg={drone.battery > 70 ? 'green.500' : drone.battery > 40 ? 'orange.500' : 'red.500'}
                      h="full"
                      w={`${drone.battery}%`}
                      rounded="full"
                      transition="width 0.3s"
                    />
                  </Box>
                  <Text fontSize="xs" color="slate.500" mt={1}>{drone.battery}%</Text>
                </Box>
                <Text fontSize="xs" fontWeight="medium" color="slate.400" w={20} textAlign="right">{drone.status}</Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Mission Timeline</Heading>
        <VStack gap={4} align="stretch">
          {timeline.map((item, i) => (
            <HStack key={i} gap={4}>
              <Text fontSize="xs" fontWeight="medium" color="slate.500" w={24}>{item.time}</Text>
              <Box flex={1}>
                <Text fontSize="sm" color="slate.50">{item.event}</Text>
              </Box>
              <Text fontSize="xs" fontWeight="medium" color={item.status === 'Active' ? 'blue.400' : 'slate.400'}>
                {item.status}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}
