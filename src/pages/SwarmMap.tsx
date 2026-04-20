import { VStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function SwarmMap() {
  const metrics = [
    { label: 'Tracked Swarms', value: '3', bgColor: 'purple.900/30' },
    { label: 'GPS Signals', value: '847', bgColor: 'blue.900/30' },
    { label: 'Coverage', value: '2,840 km²', bgColor: 'orange.900/30' },
    { label: 'Last Update', value: 'Live', bgColor: 'green.900/30' },
  ]

  const locations = [
    { zone: 'Khuzdar', swarms: 1, population: '2.3M', status: 'Critical', statusColor: 'red.400' },
    { zone: 'Jacobabad', swarms: 1, population: '840K', status: 'High', statusColor: 'orange.400' },
    { zone: 'Hyderabad', swarms: 1, population: '340K', status: 'Medium', statusColor: 'blue.400' },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading
          as="h1"
          size="2xl"
          color="slate.900"
          _dark={{ color: 'slate.50' }}
          mb={3}
          letterSpacing="-0.02em"
          fontWeight={500}
        >
          Swarm Map
        </Heading>
        <Text fontSize="lg" color="slate.600" _dark={{ color: 'slate.400' }}>
          Real-time geographical tracking and migration patterns
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(4, 1fr)' }} gap={6}>
        {metrics.map((metric) => (
          <Box
            key={metric.label}
            bg={metric.bgColor}
            border="1px solid"
            borderColor="slate.700"
            rounded="lg"
            p={6}
            shadow="sm"
          >
            <Text fontSize="sm" color="slate.400">
              {metric.label}
            </Text>
            <Text fontSize="2xl" fontWeight="semibold" color="slate.50" mt={1}>
              {metric.value}
            </Text>
          </Box>
        ))}
      </Grid>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>
          Territory Overview
        </Heading>
        <svg viewBox="0 0 600 400" style={{ width: '100%', height: 'auto', borderRadius: '0.5rem' }}>
          <defs>
            <filter id="mapBg">
              <feFlood floodColor="#1f2937" />
            </filter>
          </defs>
          <polygon points="150,80 200,75 240,100 260,120 250,150 280,160 310,210 290,280 250,300 200,290 170,250 140,200 130,150" fill="#374151" stroke="#6b7280" strokeWidth="1.5" />
          <circle cx="220" cy="140" r="20" fill="#aa3bff" opacity="0.7" />
          <circle cx="280" cy="200" r="15" fill="#ec4899" opacity="0.6" />
          <circle cx="180" cy="240" r="12" fill="#06b6d4" opacity="0.5" />
          <text x="50%" y="380" textAnchor="middle" fontSize="12" fill="#9ca3af">
            Pakistan Territory · Tracked Swarms Marked
          </text>
        </svg>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
        {locations.map((loc) => (
          <Box key={loc.zone} bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={6} shadow="sm">
            <Heading as="h3" size="sm" color="slate.50" fontWeight={500}>
              {loc.zone}
            </Heading>
            <Text fontSize="sm" color="slate.400" mt={1}>
              {loc.population} locusts
            </Text>
            <Text fontSize="xs" fontWeight="medium" mt={3} color={loc.statusColor}>
              {loc.status} Severity
            </Text>
          </Box>
        ))}
      </Grid>
    </VStack>
  )
}
