import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function Dashboard() {
  const metrics = [
    { label: 'Active Swarms', value: '3', bgColor: 'purple.900/30', accentColor: 'purple.300' },
    { label: 'Risk Zones', value: '5', bgColor: 'orange.900/30', accentColor: 'orange.300' },
    { label: 'Affected Area', value: '2,840 km²', bgColor: 'blue.900/30', accentColor: 'blue.300' },
    { label: 'Alert Status', value: 'Active', bgColor: 'red.900/30', accentColor: 'red.300' },
  ]

  const statusItems = [
    { label: 'GPS Tracking', status: 'Active', icon: '●', color: 'green.400' },
    { label: 'Satellite Feed', status: 'Active', icon: '●', color: 'green.400' },
    { label: 'Alerts System', status: 'Active', icon: '●', color: 'green.400' },
    { label: 'AI Predictions', status: 'Processing', icon: '◐', color: 'amber.400' },
  ]

  const alerts = [
    { zone: 'Khuzdar', severity: 'Critical', time: '08:42', desc: '2.3M locusts detected', severityColor: 'red.400' },
    { zone: 'Jacobabad', severity: 'High', time: '07:15', desc: 'High wind conditions', severityColor: 'orange.400' },
    { zone: 'Hyderabad', severity: 'Medium', time: '05:30', desc: '340K swarm activity', severityColor: 'blue.400' },
  ]

  return (
    <VStack gap={8} maxW="full" align="stretch">
      {/* Header */}
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
          Dashboard
        </Heading>
        <Text fontSize="lg" color="slate.600" _dark={{ color: 'slate.400' }}>
          Real-time locust swarm tracking and early warning system
        </Text>
      </Box>

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={6}>
        {metrics.map((metric) => (
          <Box
            key={metric.label}
            bg={metric.bgColor}
            border="1px solid"
            borderColor="slate.700"
            rounded="lg"
            p={6}
            shadow="sm"
            _hover={{ shadow: 'md' }}
            transition="all 0.2s"
          >
            <Text fontSize="sm" fontWeight="medium" color="slate.400" mb={2}>
              {metric.label}
            </Text>
            <Text fontSize="3xl" fontWeight="semibold" color={metric.accentColor}>
              {metric.value}
            </Text>
          </Box>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
        {/* Swarm Chart */}
        <Box gridColumn={{ lg: 'span 2' }} bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
          <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>
            Swarm Activity (24h)
          </Heading>
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="swarmFill">
                <stop offset="0%" stopColor="#aa3bff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#aa3bff" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline points="20,150 60,120 100,90 140,110 180,70 220,95 260,60 300,85 340,40 380,65" fill="none" stroke="#aa3bff" strokeWidth="2" strokeLinecap="round" />
            <polygon points="20,150 60,120 100,90 140,110 180,70 220,95 260,60 300,85 340,40 380,65 380,200 20,200" fill="url(#swarmFill)" />
            <line x1="20" y1="170" x2="380" y2="170" stroke="#d1d5db" strokeWidth="1" opacity="0.3" />
          </svg>
        </Box>

        {/* Status */}
        <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
          <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>
            System Status
          </Heading>
          <VStack gap={4} align="stretch">
            {statusItems.map((item) => (
              <HStack key={item.label} justify="space-between">
                <Text fontSize="sm" color="slate.400">
                  {item.label}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color={item.color}>
                  {item.status}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Grid>

      {/* Alerts */}
      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>
          Recent Alerts
        </Heading>
        <VStack gap={3} align="stretch">
          {alerts.map((alert, i) => (
            <HStack
              key={i}
              justify="space-between"
              p={4}
              bg="slate.900"
              rounded="md"
              border="1px solid"
              borderColor="slate.800"
              _hover={{ borderColor: 'slate.700' }}
              transition="all 0.2s"
            >
              <Box flex={1}>
                <Text fontWeight="medium" color="slate.50">
                  {alert.zone}
                </Text>
                <Text fontSize="sm" color="slate.400">
                  {alert.desc}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="xs" fontWeight="semibold" color={alert.severityColor}>
                  {alert.severity}
                </Text>
                <Text fontSize="xs" color="slate.500">
                  {alert.time}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}
