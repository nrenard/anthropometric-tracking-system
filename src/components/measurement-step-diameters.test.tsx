import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MeasurementStepDiameters } from "./measurement-step-diameters"
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

describe("MeasurementStepDiameters", () => {
  it("renders humerus and femur fields with inputMode='decimal'", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepDiameters
          data={emptyData()}
          errors={{}}
          onChange={vi.fn()}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const humerus = screen.getByLabelText(/Úmero/i) as HTMLInputElement
    const femur = screen.getByLabelText(/Fêmur/i) as HTMLInputElement
    expect(humerus.inputMode).toBe("decimal")
    expect(femur.inputMode).toBe("decimal")
  })

  it("calls onChange when value typed", () => {
    const onChange = vi.fn()
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepDiameters
          data={emptyData()}
          errors={{}}
          onChange={onChange}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const humerus = screen.getByLabelText(/Úmero/i)
    fireEvent.change(humerus, { target: { value: "7.2" } })
    expect(onChange).toHaveBeenCalledWith("diameters.humerus", "7.2")
  })
})
