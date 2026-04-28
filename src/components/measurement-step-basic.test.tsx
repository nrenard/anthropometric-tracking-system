import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MeasurementStepBasic } from "./measurement-step-basic"
import type { WizardData, WizardErrors, WizardField } from "@/hooks/use-measurement-wizard"

function emptyData(): WizardData {
  const fields: WizardField[] = [
    "weight",
    "height",
    "measuredAt",
    "notes",
    "skinfolds.chest",
    "skinfolds.midaxillary",
    "skinfolds.triceps",
    "skinfolds.subscapular",
    "skinfolds.abdominal",
    "skinfolds.suprailiac",
    "skinfolds.thigh",
    "perimeters.neck",
    "perimeters.waist",
    "perimeters.hip",
    "perimeters.abdomen",
    "perimeters.chest",
    "perimeters.arm.left",
    "perimeters.arm.right",
    "perimeters.forearm.left",
    "perimeters.forearm.right",
    "perimeters.thigh.left",
    "perimeters.thigh.right",
    "perimeters.calf.left",
    "perimeters.calf.right",
    "diameters.humerus",
    "diameters.femur",
  ]
  return fields.reduce((acc, f) => ({ ...acc, [f]: "" }), {} as WizardData)
}

function renderStep(props: {
  data?: Partial<WizardData>
  errors?: WizardErrors
  onChange?: (field: WizardField, value: string) => void
  disabled?: boolean
}) {
  const data: WizardData = { ...emptyData(), ...props.data }
  const onChange = props.onChange ?? vi.fn()
  return render(
    <ChakraProvider value={defaultSystem}>
      <MeasurementStepBasic
        data={data}
        errors={props.errors ?? {}}
        onChange={onChange}
        disabled={props.disabled ?? false}
      />
    </ChakraProvider>,
  )
}

describe("MeasurementStepBasic", () => {
  beforeEach(() => cleanup())

  it("renders weight, height, measuredAt, and notes inputs", () => {
    renderStep({})
    expect(screen.getByLabelText(/Peso/i)).toBeDefined()
    expect(screen.getByLabelText(/Altura/i)).toBeDefined()
    expect(screen.getByLabelText(/Data/i)).toBeDefined()
    expect(screen.getByLabelText(/Observa/i)).toBeDefined()
  })

  it("uses inputMode='decimal' on numeric inputs", () => {
    renderStep({})
    const weight = screen.getByLabelText(/Peso/i) as HTMLInputElement
    expect(weight.inputMode).toBe("decimal")
    const height = screen.getByLabelText(/Altura/i) as HTMLInputElement
    expect(height.inputMode).toBe("decimal")
  })

  it("displays current values from data", () => {
    renderStep({ data: { weight: "70.5", height: "180", notes: "abc" } })
    expect((screen.getByLabelText(/Peso/i) as HTMLInputElement).value).toBe("70.5")
    expect((screen.getByLabelText(/Altura/i) as HTMLInputElement).value).toBe("180")
    expect((screen.getByLabelText(/Observa/i) as HTMLTextAreaElement).value).toBe("abc")
  })

  it("calls onChange when weight is typed", () => {
    const onChange = vi.fn()
    renderStep({ onChange })
    const weight = screen.getByLabelText(/Peso/i)
    fireEvent.change(weight, { target: { value: "75" } })
    expect(onChange).toHaveBeenCalledWith("weight", "75")
  })

  it("renders weight error when present", () => {
    renderStep({ errors: { weight: "Peso é obrigatório" } })
    expect(screen.getByText("Peso é obrigatório")).toBeDefined()
  })

  it("disables inputs when disabled prop is true", () => {
    renderStep({ disabled: true })
    expect((screen.getByLabelText(/Peso/i) as HTMLInputElement).disabled).toBe(true)
  })
})
