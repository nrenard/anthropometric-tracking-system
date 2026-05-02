"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { DeleteMeasurementDialog } from "@/components/delete-measurement-dialog"
import { toaster } from "@/components/ui/toaster"
import { useActiveProfile } from "@/hooks/use-active-profile"
import {
  computeAllMetrics,
  type AllMetrics,
} from "@/lib/calculations"
import { formatDateTime } from "@/lib/date-utils"
import {
  toMeasurementInput,
  toProfileInput,
  type MeasurementData,
  type ProfileData,
} from "@/lib/measurement-utils"

const EM_DASH = "—"
const FETCH_ERROR_MESSAGE = "Falha ao carregar medição"

type FetchState =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; measurement: MeasurementData; profile: ProfileData }

function formatNumber(value: number | null | undefined, decimals: number, unit?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH
  const formatted = value.toFixed(decimals)
  return unit ? `${formatted} ${unit}` : formatted
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Flex justify="space-between" align="center" gap={2}>
      <Text color="fg.muted">{label}</Text>
      <Text fontWeight="bold">{value}</Text>
    </Flex>
  )
}

interface SectionProps {
  testId: string
  title: string
  children: React.ReactNode
}

function Section({ testId, title, children }: SectionProps) {
  return (
    <Box borderWidth={1} borderRadius="md" p={4} data-testid={testId}>
      <Heading as="h2" size="md" mb={3}>
        {title}
      </Heading>
      <Stack gap={2}>{children}</Stack>
    </Box>
  )
}

interface BasicSectionProps {
  measurement: MeasurementData
}

function BasicSection({ measurement }: BasicSectionProps) {
  return (
    <Section testId="detail-section-basic" title="Básico">
      <DetailRow label="Data" value={formatDateTime(measurement.measuredAt)} />
      <DetailRow label="Peso" value={formatNumber(measurement.weight, 1, "kg")} />
      <DetailRow label="Altura" value={formatNumber(measurement.height, 1, "cm")} />
      <DetailRow label="Notas" value={measurement.notes?.trim() || EM_DASH} />
    </Section>
  )
}

interface SkinfoldsSectionProps {
  skinfolds: MeasurementData["skinfolds"]
}

const SKINFOLD_FIELDS: ReadonlyArray<{
  label: string
  key: keyof NonNullable<MeasurementData["skinfolds"]>
}> = [
  { label: "Tríceps", key: "triceps" },
  { label: "Subescapular", key: "subscapular" },
  { label: "Suprailíaca", key: "suprailiac" },
  { label: "Abdominal", key: "abdominal" },
  { label: "Coxa", key: "thigh" },
  { label: "Peito", key: "chest" },
  { label: "Axilar", key: "midaxillary" },
]

function SkinfoldsSection({ skinfolds }: SkinfoldsSectionProps) {
  return (
    <Section testId="detail-section-skinfolds" title="Dobras Cutâneas">
      <SimpleGrid columns={2} gap={2}>
        {SKINFOLD_FIELDS.map(({ label, key }) => (
          <DetailRow
            key={key}
            label={label}
            value={formatNumber(skinfolds?.[key], 1, "mm")}
          />
        ))}
      </SimpleGrid>
    </Section>
  )
}

interface PerimetersSectionProps {
  perimeters: MeasurementData["perimeters"]
}

interface BilateralRowProps {
  label: string
  pair: { left: number; right: number } | undefined
}

function BilateralRow({ label, pair }: BilateralRowProps) {
  const left = formatNumber(pair?.left, 1, "cm")
  const right = formatNumber(pair?.right, 1, "cm")
  return (
    <Flex justify="space-between" align="center" gap={2} wrap="wrap">
      <Text color="fg.muted">{label}</Text>
      <Text fontWeight="bold">
        E {left} | D {right}
      </Text>
    </Flex>
  )
}

function PerimetersSection({ perimeters }: PerimetersSectionProps) {
  return (
    <Section testId="detail-section-perimeters" title="Perímetros">
      <DetailRow label="Cintura" value={formatNumber(perimeters?.waist, 1, "cm")} />
      <DetailRow label="Quadril" value={formatNumber(perimeters?.hip, 1, "cm")} />
      <BilateralRow label="Braço" pair={perimeters?.arm} />
      <BilateralRow label="Antebraço" pair={perimeters?.forearm} />
      <BilateralRow label="Coxa" pair={perimeters?.thigh} />
      <BilateralRow label="Panturrilha" pair={perimeters?.calf} />
    </Section>
  )
}

interface DiametersSectionProps {
  diameters: MeasurementData["diameters"]
}

function DiametersSection({ diameters }: DiametersSectionProps) {
  return (
    <Section testId="detail-section-diameters" title="Diâmetros">
      <DetailRow label="Úmero" value={formatNumber(diameters?.humerus, 1, "cm")} />
      <DetailRow label="Fêmur" value={formatNumber(diameters?.femur, 1, "cm")} />
    </Section>
  )
}

interface MetricsSectionProps {
  metrics: AllMetrics | null
}

function MetricsSection({ metrics }: MetricsSectionProps) {
  return (
    <Section testId="detail-section-metrics" title="Métricas Calculadas">
      <DetailRow label="IMC" value={formatNumber(metrics?.bmi, 2, "kg/m²")} />
      <DetailRow
        label="Densidade Corporal"
        value={formatNumber(metrics?.bodyDensity, 4, "g/ml")}
      />
      <DetailRow label="% Gordura" value={formatNumber(metrics?.bodyFatPercent, 2, "%")} />
      <DetailRow label="Massa Gorda" value={formatNumber(metrics?.fatMass, 1, "kg")} />
      <DetailRow label="Massa Magra" value={formatNumber(metrics?.leanMass, 1, "kg")} />
      <DetailRow label="Massa Óssea" value={formatNumber(metrics?.boneMass, 1, "kg")} />
      <DetailRow label="Massa Muscular" value={formatNumber(metrics?.muscleMass, 1, "kg")} />
      <DetailRow label="RCQ" value={formatNumber(metrics?.waistToHip, 2)} />
      <DetailRow label="RCE" value={formatNumber(metrics?.waistToHeight, 2)} />
      <DetailRow label="TMB" value={formatNumber(metrics?.bmr, 0, "kcal/dia")} />
    </Section>
  )
}

function DetailSkeleton() {
  return (
    <Stack gap={3} data-testid="detail-skeleton">
      <Skeleton height="48px" />
      <Skeleton height="160px" />
      <Skeleton height="160px" />
      <Skeleton height="160px" />
      <SkeletonText noOfLines={6} />
    </Stack>
  )
}

export default function MeasurementDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const { activeProfileId } = useActiveProfile()
  const [state, setState] = useState<FetchState>({ kind: "loading" })
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!activeProfileId || !id) return

    let cancelled = false

    ;(async () => {
      try {
        const [measurementRes, profileRes] = await Promise.all([
          fetch(`/api/measurements/${id}`),
          fetch(`/api/profiles/${activeProfileId}`),
        ])
        if (cancelled) return
        if (measurementRes.status === 404) {
          setState({ kind: "notFound" })
          return
        }
        if (!measurementRes.ok || !profileRes.ok) {
          throw new Error(FETCH_ERROR_MESSAGE)
        }
        const measurement = (await measurementRes.json()) as MeasurementData
        const profile = (await profileRes.json()) as ProfileData
        if (cancelled) return
        setState({ kind: "loaded", measurement, profile })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : FETCH_ERROR_MESSAGE
        setState({ kind: "error", message })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeProfileId, id])

  const cancelDelete = useCallback(() => {
    setIsConfirmingDelete(false)
  }, [])

  const confirmDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/measurements/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir medição")
      toaster.create({ title: "Medição excluída", type: "success" })
      router.push("/historico")
    } catch {
      toaster.create({ title: "Erro ao excluir medição", type: "error" })
    } finally {
      setIsConfirmingDelete(false)
    }
  }, [id, router])

  const metrics = useMemo<AllMetrics | null>(() => {
    if (state.kind !== "loaded") return null
    const measurementInput = toMeasurementInput(
      state.measurement,
      state.profile.defaultHeight,
    )
    if (!measurementInput) return null
    return computeAllMetrics(measurementInput, toProfileInput(state.profile))
  }, [state])

  if (!activeProfileId) {
    return (
      <Box p={4} pb={32}>
        <Heading as="h1" size="lg" mb={4}>
          Detalhes da Medição
        </Heading>
        <Stack gap={3}>
          <Text>Selecione um perfil para ver o histórico</Text>
          <Button asChild alignSelf="flex-start">
            <NextLink href="/configuracoes">Gerenciar perfis</NextLink>
          </Button>
        </Stack>
        <BottomNav />
      </Box>
    )
  }

  return (
    <Box p={4} pb={32}>
      <Flex justify="space-between" align="center" mb={4} gap={2} wrap="wrap">
        <Heading as="h1" size="lg">
          Detalhes da Medição
        </Heading>
        <Flex gap={2}>
          <Button asChild size="sm" variant="outline">
            <NextLink href="/historico">Voltar</NextLink>
          </Button>
          {state.kind === "loaded" && (
            <>
              <Button asChild size="sm" variant="outline">
                <NextLink href="/comparar">Comparar</NextLink>
              </Button>
              <Button asChild size="sm" variant="outline">
                <NextLink href={`/medir?edit=${id}`}>Editar</NextLink>
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                variant="ghost"
                onClick={() => setIsConfirmingDelete(true)}
              >
                Excluir
              </Button>
            </>
          )}
        </Flex>
      </Flex>

      {state.kind === "loading" && <DetailSkeleton />}

      {state.kind === "notFound" && (
        <Stack gap={3}>
          <Text role="alert">Medição não encontrada</Text>
        </Stack>
      )}

      {state.kind === "error" && (
        <Stack gap={3}>
          <Text role="alert" color="red.500">
            {state.message}
          </Text>
        </Stack>
      )}

      {state.kind === "loaded" && (
        <Stack gap={3}>
          <BasicSection measurement={state.measurement} />
          <SkinfoldsSection skinfolds={state.measurement.skinfolds} />
          <PerimetersSection perimeters={state.measurement.perimeters} />
          <DiametersSection diameters={state.measurement.diameters} />
          <MetricsSection metrics={metrics} />
        </Stack>
      )}

      {isConfirmingDelete && state.kind === "loaded" && (
        <DeleteMeasurementDialog
          measurementDate={state.measurement.measuredAt}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <BottomNav />
    </Box>
  )
}
