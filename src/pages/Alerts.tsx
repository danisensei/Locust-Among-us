import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function Alerts() {
  const metrics = [
    { label: 'Critical', value: '2', bgColor: 'red.900/30' },
    { label: 'High', value: '5', bgColor: 'orange.900/30' },
    { label: 'Medium', value: '8', bgColor: 'blue.900/30' },
    { label: 'Resolved', value: '124', bgColor: 'green.900/30' },
  ]

  const activeAlerts = [
    { title: 'Swarm Detected — Khuzdar', severity: 'Critical', time: '08:42', status: 'New', desc: '2.3M locusts moving northeast', borderColor: 'red.600', bgColor: 'red.900/20' },
    { title: 'High Wind Alert — Jacobabad', severity: 'High', time: '07:15', status: 'Active', desc: 'Wind 34 km/h accelerating migration', borderColor: 'orange.600', bgColor: 'orange.900/20' },
    { title: 'Vegetation Change — D.I. Khan', severity: 'Medium', time: '05:30', status: 'Monitoring', desc: 'Crop availability increased', borderColor: 'blue.600', bgColor: 'blue.900/20' },
  ]

  const channels = [
    { channel: 'SMS Alerts', count: 147, icon: '📱' },
    { channel: 'Email Notifications', count: 23, icon: '📧' },
    { channel: 'Portal Alerts', count: 156, icon: '🌐' },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading as="h1" size="2xl" color="slate.50" mb={3} letterSpacing="-0.02em" fontWeight={500}>
          Alerts
        </Heading>
        <Text fontSize="lg" color="slate.400">Notification management and alert history</Text>
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
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Active Alerts</Heading>
        <VStack gap={3} align="stretch">
          {activeAlerts.map((alert, i) => (
            <Box
              key={i}
              p={4}
              rounded="md"
              bg={alert.bgColor}
              borderLeft="4px solid"
              borderLeftColor={alert.borderColor}
              border="1px solid"
              borderColor="slate.700"
            >
              <HStack justify="space-between" mb={2}>
                <Box>
                  <Text fontWeight="medium" color="slate.50">{alert.title}</Text>
                  <Text fontSize="xs" color="slate.400" mt={1}>{alert.desc}</Text>
                </Box>
                <Box fontSize="xs" fontWeight="medium" color={alert.borderColor}>
                  {alert.severity}
                </Box>
              </HStack>
              <Text fontSize="xs" color="slate.500">{alert.time} • {alert.status}</Text>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Notification Channels</Heading>
        <VStack gap={3} align="stretch">
          {channels.map((ch) => (
            <HStack key={ch.channel} justify="space-between" p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <HStack gap={3}>
                <Text fontSize="lg">{ch.icon}</Text>
                <Text fontSize="sm" color="slate.50">{ch.channel}</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="medium" color="slate.400">{ch.count} sent today</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}
