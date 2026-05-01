"use client"

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react"

interface DeleteMeasurementDialogProps {
  measurementDate: string
  onCancel: () => void
  onConfirm: () => void
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function DeleteMeasurementDialog({
  measurementDate,
  onCancel,
  onConfirm,
}: DeleteMeasurementDialogProps) {
  return (
    <Box
      role="alertdialog"
      aria-label="Confirmar exclusão"
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      zIndex={30}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box bg="bg" borderRadius="md" p={6} minW="320px" maxW="90vw">
        <Heading as="h2" size="md" mb={2}>
          Tem certeza que deseja excluir esta medição?
        </Heading>
        <Text mb={4} color="fg.muted">
          Medição de {formatDateOnly(measurementDate)}
        </Text>
        <Flex gap={2} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button colorPalette="red" onClick={onConfirm}>
            Excluir
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
