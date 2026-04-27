import { Box, Heading, Text } from "@chakra-ui/react"
import { ColorModeButton } from "@/components/ui/color-mode"
import { BottomNav } from "@/components/bottom-nav"

export default function HomePage() {
  return (
    <Box p={4} pb={16}>
      <ColorModeButton />
      <Heading as="h1">Anthropometric Tracking</Heading>
      <Text>Acompanhamento de medidas corporais</Text>
      <BottomNav />
    </Box>
  )
}
