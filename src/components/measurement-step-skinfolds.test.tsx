import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MeasurementStepSkinfolds } from "./measurement-step-skinfolds"
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

describe("MeasurementStepSkinfolds", () => {
  it("renders all 7 skinfold fields with inputMode='decimal'", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepSkinfolds
          data={emptyData()}
          errors={{}}
          onChange={vi.fn()}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const labels = [
      /Peitoral/i,
      /Axilar/i,
      /Tríceps/i,
      /Subescapular/i,
      /Abdominal/i,
      /Suprail/i,
      /Coxa/i,
    ]
    for (const label of labels) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      expect(input).toBeDefined()
      expect(input.inputMode).toBe("decimal")
    }
  })

  it("displays current value and calls onChange", () => {
    const onChange = vi.fn()
    const data = { ...emptyData(), "skinfolds.chest": "10" }
    render(
      <ChakraProvider value={defaultSystem}>
        <MeasurementStepSkinfolds
          data={data}
          errors={{}}
          onChange={onChange}
          disabled={false}
        />
      </ChakraProvider>,
    )
    const chest = screen.getByLabelText(/Peitoral/i) as HTMLInputElement
    expect(chest.value).toBe("10")
    fireEvent.change(chest, { target: { value: "12" } })
    expect(onChange).toHaveBeenCalledWith("skinfolds.chest", "12")
  })
})
