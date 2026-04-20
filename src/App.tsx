import { useState } from 'react'
import { ChakraProvider, Flex, Box, defaultSystem } from '@chakra-ui/react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SwarmMap from './pages/SwarmMap'
import AIPrediction from './pages/AIPrediction'
import DroneOps from './pages/DroneOps'
import FieldReports from './pages/FieldReports'
import Alerts from './pages/Alerts'
import Users from './pages/Users'

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'map':
        return <SwarmMap />
      case 'ai':
        return <AIPrediction />
      case 'drones':
        return <DroneOps />
      case 'reports':
        return <FieldReports />
      case 'alerts':
        return <Alerts />
      case 'users':
        return <Users />
      default:
        return <Dashboard />
    }
  }

  return (
    <Flex flexDirection="column" h="100vh" position="relative" zIndex={1}>
      <Header />
      <Flex flex={1} overflow="hidden">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <Box as="main" flex={1} overflowY="auto" p="22px" pr="24px">
          {renderSection()}
        </Box>
      </Flex>
    </Flex>
  )
}

export default function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <AppContent />
    </ChakraProvider>
  )
}
