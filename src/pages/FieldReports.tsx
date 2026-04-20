import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function FieldReports() {
  const metrics = [
    { label: 'Today Reports', value: '38', bgColor: 'blue.900/30' },
    { label: 'Verified', value: '36', bgColor: 'green.900/30' },
    { label: 'Pending', value: '2', bgColor: 'orange.900/30' },
    { label: 'Accuracy', value: '94%', bgColor: 'purple.900/30' },
  ]

  const reports = [
    { observer: 'Muhammad Ali', location: 'Khuzdar', severity: 'Critical', verified: true, time: '08:42', severityColor: 'red.400' },
    { observer: 'Fatima Khan', location: 'Jacobabad', severity: 'High', verified: true, time: '07:30', severityColor: 'orange.400' },
    { observer: 'Ahmed Hassan', location: 'Hyderabad', severity: 'Medium', verified: false, time: '06:15', severityColor: 'blue.400' },
  ]

  const hotspots = [
    { zone: 'Khuzdar', reports: 18, risk: 'Critical', temp: '38°C', riskColor: 'red.400' },
    { zone: 'Jacobabad', reports: 12, risk: 'High', temp: '41°C', riskColor: 'orange.400' },
    { zone: 'Hyderabad', reports: 8, risk: 'Medium', temp: '36°C', riskColor: 'blue.400' },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading as="h1" size="2xl" color="slate.50" mb={3} letterSpacing="-0.02em" fontWeight={500}>
          Field Reports
        </Heading>
        <Text fontSize="lg" color="slate.400">Farmer and officer observations with AI verification</Text>
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
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Recent Reports</Heading>
        <VStack gap={3} align="stretch">
          {reports.map((report, i) => (
            <HStack key={i} justify="space-between" p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <Box>
                <Text fontWeight="medium" color="slate.50">{report.observer}</Text>
                <Text fontSize="xs" color="slate.400">{report.location}</Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="xs" fontWeight="semibold" color={report.severityColor}>{report.severity}</Text>
                <Text fontSize="xs" color="slate.500" mt={1}>{report.verified ? '✓ Verified' : 'Pending'}</Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Hotspot Zones</Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
          {hotspots.map((zone) => (
            <Box key={zone.zone} p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <Text fontWeight="medium" color="slate.50">{zone.zone}</Text>
              <Text fontSize="xs" color="slate.400" mt={1}>{zone.reports} reports today</Text>
              <Text fontSize="xs" fontWeight="medium" mt={2} color={zone.riskColor}>
                {zone.risk} Risk • {zone.temp}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>
    </VStack>
  )
}
