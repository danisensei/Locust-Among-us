import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react'

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⬛', group: 'Overview' },
    { id: 'map', label: 'Swarm Map', icon: '🗺', group: 'Overview' },
    { id: 'ai', label: 'AI Prediction', icon: '🤖', group: 'Operations' },
    { id: 'drones', label: 'Drone Ops', icon: '🛸', group: 'Operations' },
    { id: 'reports', label: 'Field Reports', icon: '📋', group: 'Operations' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', group: 'System', badge: 5 },
    { id: 'users', label: 'Users', icon: '👥', group: 'System' },
  ]

  const groups = ['Overview', 'Operations', 'System']

  return (
    <Box as="nav" w="214px" bg="slate.900/70" borderRight="1px solid" borderColor="slate.700" py={4} flexShrink={0} overflowY="auto">
      {groups.map((group) => (
        <Box key={group}>
          <Text
            fontSize="9px"
            letterSpacing="0.2em"
            color="slate.500"
            textTransform="uppercase"
            px="18px"
            pb="6px"
            mt="14px"
          >
            {group}
          </Text>
          <VStack gap={0} align="stretch">
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <HStack
                  key={item.id}
                  gap="10px"
                  px="18px"
                  py="9px"
                  cursor="pointer"
                  fontSize="13px"
                  borderLeft="2px solid"
                  transition="all 180ms"
                  userSelect="none"
                  borderColor={activeSection === item.id ? 'amber.500' : 'transparent'}
                  bg={activeSection === item.id ? 'amber.500/10' : 'transparent'}
                  color={activeSection === item.id ? 'amber.500' : 'slate.400'}
                  _hover={{
                    bg: 'slate.700/30',
                    color: 'slate.300',
                  }}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Text fontSize="14px" w="18px" textAlign="center">
                    {item.icon}
                  </Text>
                  <Text flex={1}>{item.label}</Text>
                  {item.badge && (
                    <Badge
                      ml="auto"
                      bg="red.600"
                      color="white"
                      fontSize="9px"
                      px="6px"
                      py="2px"
                      rounded="full"
                      fontFamily="'Space Mono', monospace"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </HStack>
              ))}
          </VStack>
        </Box>
      ))}
    </Box>
  )
}
