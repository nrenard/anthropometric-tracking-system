import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MeasurementStepPerimeters } from "./measurement-step-perimeters"
import type { WizardData, WizardField } from "@/hooks/use-measurement-wizard"

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

beforeEach(() => cleanup())

describe("MeasurementStepPerimeters", () => {
  it("renders single-side perimeter fields", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepPerimeters
          data={emptyData()}
          errors={{}}
          onChange={vi.fn()}
          disabled={false}
        />
      </ChakraProvider>,
    )
    expect(screen.getByLabelText(/Pescoço/i)).toBeDefined()
    expect(screen.getByLabelText(/Cintura/i)).toBeDefined()
    expect(screen.getByLabelText(/Quadril/i)).toBeDefined()
    expect(screen.getByLabelText(/Abdômen/i)).toBeDefined()
    expect(screen.getByLabelText(/Tórax/i)).toBeDefined()
  })

  it("renders L/R pairs (arm, forearm, thigh, calf)", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepPerimeters
          data={emptyData()}
          errors={{}}
          onChange={vi.fn()}
          disabled={false}
        />
      </ChakraProvider>,
    )
    expect(screen.getByLabelText(/^Braço esq/i)).toBeDefined()
    expect(screen.getByLabelText(/^Braço dir/i)).toBeDefined()
    expect(screen.getByLabelText(/^Antebraço esq/i)).toBeDefined()
    expect(screen.getByLabelText(/^Antebraço dir/i)).toBeDefined()
    expect(screen.getByLabelText(/^Coxa esq/i)).toBeDefined()
    expect(screen.getByLabelText(/^Coxa dir/i)).toBeDefined()
    expect(screen.getByLabelText(/^Panturrilha esq/i)).toBeDefined()
    expect(screen.getByLabelText(/^Panturrilha dir/i)).toBeDefined()
  })

  it("calls onChange with the correct field key for L/R pairs", () => {
    const onChange = vi.fn()
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepPerimeters
          data={emptyData()}
          errors={{}}
          onChange={onChange}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const armLeft = screen.getByLabelText(/^Braço esq/i)
    fireEvent.change(armLeft, { target: { value: "32" } })
    expect(onChange).toHaveBeenCalledWith("perimeters.arm.left", "32")
  })

  it("uses inputMode='decimal' on all numeric inputs", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepPerimeters
          data={emptyData()}
          errors={{}}
          onChange={vi.fn()}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const neck = screen.getByLabelText(/Pescoço/i) as HTMLInputElement
    expect(neck.inputMode).toBe("decimal")
  })
})
