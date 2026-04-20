import { VStack, HStack, Box, Grid, Heading, Text } from '@chakra-ui/react'

export default function Users() {
  const metrics = [
    { label: 'Total Users', value: '1,886', bgColor: 'purple.900/30' },
    { label: 'Admins', value: '4', bgColor: 'red.900/30' },
    { label: 'Officers', value: '28', bgColor: 'orange.900/30' },
    { label: 'Online Now', value: '287', bgColor: 'green.900/30' },
  ]

  const teamMembers = [
    { name: 'Dr. Ahmed Nawaz', role: 'Administrator', zone: 'Islamabad HQ', status: 'Active', roleColor: 'purple', statusColor: 'green.600' },
    { name: 'Fatima Siddiqui', role: 'Officer', zone: 'Balochistan', status: 'Active', roleColor: 'orange', statusColor: 'green.600' },
    { name: 'Usman Tariq', role: 'Officer', zone: 'Sindh', status: 'Active', roleColor: 'orange', statusColor: 'green.600' },
    { name: 'Zara Khan', role: 'Field Officer', zone: 'Khuzdar', status: 'Offline', roleColor: 'blue', statusColor: 'slate.500' },
  ]

  const regions = [
    { region: 'Sindh', users: 542, pct: 28.7 },
    { region: 'Balochistan', users: 468, pct: 24.8 },
    { region: 'KPK', users: 412, pct: 21.8 },
    { region: 'Punjab', users: 386, pct: 20.5 },
  ]

  const permissions = [
    { perm: 'View Dashboard', admin: true, officer: true, farmer: true },
    { perm: 'Send Alerts', admin: true, officer: true, farmer: false },
    { perm: 'Manage Users', admin: true, officer: false, farmer: false },
    { perm: 'Submit Reports', admin: true, officer: true, farmer: true },
  ]

  return (
    <VStack gap={8} align="stretch">
      <Box mb={12}>
        <Heading as="h1" size="2xl" color="slate.50" mb={3} letterSpacing="-0.02em" fontWeight={500}>
          Users
        </Heading>
        <Text fontSize="lg" color="slate.400">Role-based access control and team management</Text>
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
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Team Members</Heading>
        <VStack gap={3} align="stretch">
          {teamMembers.map((user, i) => (
            <HStack key={i} justify="space-between" p={4} bg="slate.900" rounded="md" border="1px solid" borderColor="slate.800">
              <Box>
                <Text fontWeight="medium" color="slate.50">{user.name}</Text>
                <Text fontSize="xs" color="slate.400">{user.zone}</Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="xs" fontWeight="medium" px={2} py={1} rounded="md" bg={`${user.roleColor}.900/20`} color={`${user.roleColor}.400`}>
                  {user.role}
                </Text>
                <Text fontSize="xs" mt={1} color={user.statusColor}>{user.status}</Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Regional Distribution</Heading>
        <VStack gap={4} align="stretch">
          {regions.map((reg) => (
            <Box key={reg.region}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" color="slate.50">{reg.region}</Text>
                <Text fontSize="sm" color="slate.400">{reg.users} users</Text>
              </HStack>
              <Box bg="slate.800" rounded="full" overflow="hidden" h={2} w="full">
                <Box bg="purple.500" h="full" w={`${reg.pct}%`} rounded="full" transition="width 0.3s" />
              </Box>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box bg="slate.950" border="1px solid" borderColor="slate.800" rounded="lg" p={8} shadow="sm" overflowX="auto">
        <Heading as="h2" size="md" color="slate.50" mb={6} fontWeight={500}>Permissions Reference</Heading>
        <Box as="table" w="full" fontSize="sm">
          <Box as="thead">
            <Box as="tr" borderBottom="1px solid" borderColor="slate.700">
              <Box as="th" textAlign="left" p={3} color="slate.400" fontWeight="medium">Permission</Box>
              <Box as="th" textAlign="center" p={3} color="slate.400" fontWeight="medium">Admin</Box>
              <Box as="th" textAlign="center" p={3} color="slate.400" fontWeight="medium">Officer</Box>
              <Box as="th" textAlign="center" p={3} color="slate.400" fontWeight="medium">Farmer</Box>
            </Box>
          </Box>
          <Box as="tbody">
            {permissions.map((row, i) => (
              <Box as="tr" key={i} borderBottom="1px solid" borderColor="slate.800">
                <Box as="td" p={2} color="slate.50">{row.perm}</Box>
                <Box as="td" textAlign="center" p={2} color="green.400">{row.admin ? '✓' : ''}</Box>
                <Box as="td" textAlign="center" p={2} color="green.400">{row.officer ? '✓' : ''}</Box>
                <Box as="td" textAlign="center" p={2} color="blue.400">{row.farmer ? '✓' : ''}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </VStack>
  )
}
