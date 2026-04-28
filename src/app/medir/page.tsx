"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Button, Flex, Heading, Spinner, Stack, Steps, Text } from "@chakra-ui/react"
import { BottomNav } from "@/components/bottom-nav"
import { MeasurementStepBasic } from "@/components/measurement-step-basic"
import { MeasurementStepSkinfolds } from "@/components/measurement-step-skinfolds"
import { MeasurementStepPerimeters } from "@/components/measurement-step-perimeters"
import { MeasurementStepDiameters } from "@/components/measurement-step-diameters"
import { MeasurementStepReview } from "@/components/measurement-step-review"
import { toaster } from "@/components/ui/toaster"
import { useActiveProfile } from "@/hooks/use-active-profile"
import { useMeasurementWizard, type WizardStep } from "@/hooks/use-measurement-wizard"

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Básico",
  2: "Dobras",
  3: "Perímetros",
  4: "Diâmetros",
  5: "Revisar",
}

const STEP_ITEMS = [
  { value: 0, title: STEP_LABELS[1] },
  { value: 1, title: STEP_LABELS[2] },
  { value: 2, title: STEP_LABELS[3] },
  { value: 3, title: STEP_LABELS[4] },
  { value: 4, title: STEP_LABELS[5] },
]

const SAVE_ERROR_MESSAGE = "Não foi possível salvar a medição"
const SAVE_SUCCESS_MESSAGE = "Medição salva com sucesso"

export default function MedirPage() {
  const router = useRouter()
  const { activeProfile, activeProfileId, isLoading } = useActiveProfile()
  const { step, data, errors, hasData, setField, next, prev, getSavePayload } =
    useMeasurementWizard()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (activeProfile?.defaultHeight && data.height === "") {
      setField("height", String(activeProfile.defaultHeight))
    }
  }, [activeProfile?.defaultHeight, data.height, setField])

  useEffect(() => {
    if (!hasData) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => {
      window.removeEventListener("beforeunload", handler)
    }
  }, [hasData])

  const reviewPayload = useMemo(
    () => (step === 5 ? getSavePayload() : null),
    [step, getSavePayload],
  )

  const isFirst = step === 1
  const isLast = step === 5
  const disabled = !activeProfileId || isSaving

  const handleSave = async () => {
    if (!activeProfileId) {
      toaster.create({ title: SAVE_ERROR_MESSAGE, type: "error" })
      return
    }
    setIsSaving(true)
    try {
      const payload = { ...getSavePayload(), profileId: activeProfileId }
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        toaster.create({ title: SAVE_SUCCESS_MESSAGE, type: "success" })
        router.push("/historico")
        return
      }
      let message = SAVE_ERROR_MESSAGE
      try {
        const body = (await response.json()) as { error?: string }
        if (body.error) message = body.error
      } catch {
        // ignore body parse errors
      }
      toaster.create({ title: message, type: "error" })
    } catch {
      toaster.create({ title: SAVE_ERROR_MESSAGE, type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrimary = () => {
    if (isLast) {
      void handleSave()
    } else {
      next()
    }
  }

  if (isLoading) {
    return (
      <Box p={4} pb={32} display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner />
        <BottomNav />
      </Box>
    )
  }

  return (
    <Box p={4} pb={32}>
      <Heading as="h1" size="lg" mb={4}>
        Nova medição
      </Heading>

      {!activeProfileId && (
        <Box
          bg="yellow.50"
          borderWidth={1}
          borderColor="yellow.200"
          color="yellow.900"
          p={4}
          borderRadius="md"
          mb={4}
        >
          <Stack gap={2}>
            <Text>Selecione um perfil para registrar medições</Text>
            <Button
              alignSelf="flex-start"
              size="sm"
              onClick={() => router.push("/configuracoes")}
            >
              Gerenciar perfis
            </Button>
          </Stack>
        </Box>
      )}

      <Steps.Root step={step - 1} count={STEP_ITEMS.length} mb={6}>
        <Steps.List>
          {STEP_ITEMS.map((item, index) => (
            <Steps.Item key={item.value} index={index} title={item.title}>
              <Steps.Indicator />
              <Steps.Title>{item.title}</Steps.Title>
              <Steps.Separator />
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>

      <Box minH="200px">
        {step === 1 && (
          <MeasurementStepBasic
            data={data}
            errors={errors}
            onChange={setField}
            disabled={disabled}
          />
        )}
        {step === 2 && (
          <MeasurementStepSkinfolds
            data={data}
            errors={errors}
            onChange={setField}
            disabled={disabled}
          />
        )}
        {step === 3 && (
          <MeasurementStepPerimeters
            data={data}
            errors={errors}
            onChange={setField}
            disabled={disabled}
          />
        )}
        {step === 4 && (
          <MeasurementStepDiameters
            data={data}
            errors={errors}
            onChange={setField}
            disabled={disabled}
          />
        )}
        {step === 5 && reviewPayload && (
          <MeasurementStepReview payload={reviewPayload} />
        )}
      </Box>

      <Flex justify="space-between" mt={6} gap={2}>
        <Button
          variant="outline"
          onClick={prev}
          disabled={isFirst || isSaving || !activeProfileId}
        >
          Voltar
        </Button>
        <Button onClick={handlePrimary} loading={isSaving} disabled={disabled}>
          {isLast ? "Salvar" : "Próximo"}
        </Button>
      </Flex>

      <BottomNav />
    </Box>
  )
}
