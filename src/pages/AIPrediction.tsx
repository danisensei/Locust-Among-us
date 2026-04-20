import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function AIPrediction() {
  const metrics = [
    { label: 'Model Accuracy', value: '87%', bgColor: 'green.900/30' },
    { label: 'Processing Time', value: '2.3s', bgColor: 'blue.900/30' },
    { label: 'Data Points', value: '12,847', bgColor: 'purple.900/30' },
  ]

  const forecastData = [
    { hours: 12, risk: 'Low', bgColor: 'green.900/20', textColor: 'green.400' },
    { hours: 24, risk: 'Low', bgColor: 'green.900/20', textColor: 'green.400' },
    { hours: 36, risk: 'Medium', bgColor: 'blue.900/20', textColor: 'blue.400' },
    { hours: 48, risk: 'High', bgColor: 'orange.900/20', textColor: 'orange.400' },
    { hours: 60, risk: 'Critical', bgColor: 'red.900/20', textColor: 'red.400' },
    { hours: 72, risk: 'High', bgColor: 'orange.900/20', textColor: 'orange.400' },
  ]

  const parameters = [
    { param: 'Wind Direction', value: 'NE at 32 km/h', impact: 'High', impactColor: 'red.400' },
    { param: 'Temperature', value: '38°C', impact: 'Medium', impactColor: 'orange.400' },
    { param: 'Humidity', value: '22%', impact: 'Low', impactColor: 'green.400' },
    { param: 'Vegetation Index', value: 'Moderate growth', impact: 'High', impactColor: 'red.400' },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading as="h1" size="2xl" color="slate.50" mb={3} letterSpacing="-0.02em" fontWeight={500}>
          AI Prediction
        </Heading>
        <Text fontSize="lg" color="slate.400">72-hour swarm movement forecast using machine learning</Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
        {metrics.map((metric) => (
          <Box key={metric.label} bg={metric.bgColor} border="1px solid" borderColor="slate.700" rounded="lg" p={6} shadow="sm">
            <Text fontSize="sm" color="slate.400">{metric.label}</Text>
            <Text fontSize="2xl" fontWeight="semibold" color="slate.50" mt={1}>{metric.value}</Text>
          </Box>
        ))}
      </Grid>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>72-Hour Risk Forecast</Heading>
        <Grid templateColumns="repeat(6, 1fr)" gap={3}>
          {forecastData.map((item, i) => (
            <Box key={i} p={4} rounded="md" border="1px solid" borderColor="slate.700" bg={item.bgColor} textAlign="center">
              <Text fontSize="xs" color="slate.400" mb={2}>{item.hours}-{item.hours + 12}h</Text>
              <Text fontSize="sm" fontWeight="semibold" color={item.textColor}>{item.risk}</Text>
            </Box>
          ))}
        </Grid>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Key Parameters</Heading>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          {parameters.map((item) => (
            <HStack key={item.param} justify="space-between" p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="slate.50">{item.param}</Text>
                <Text fontSize="xs" color="slate.400" mt={1}>{item.value}</Text>
              </Box>
              <Text fontSize="xs" fontWeight="medium" color={item.impactColor}>{item.impact} Impact</Text>
            </HStack>
          ))}
        </Grid>
      </Box>
    </VStack>
  )
}
