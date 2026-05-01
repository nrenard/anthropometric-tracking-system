import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { DeleteMeasurementDialog } from "./delete-measurement-dialog"

beforeEach(() => {
  cleanup()
})

function renderDialog(props?: Partial<React.ComponentProps<typeof DeleteMeasurementDialog>>) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  render(
    <ChakraProvider value={defaultSystem}>
      <DeleteMeasurementDialog
        measurementDate="2026-04-15T08:30:00.000Z"
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...props}
      />
    </ChakraProvider>,
  )
  return { onCancel, onConfirm }
}

describe("DeleteMeasurementDialog", () => {
  it("renders the confirmation copy and the formatted measurement date", () => {
    renderDialog()
    const dialog = screen.getByRole("alertdialog")
    expect(dialog.textContent).toContain("Tem certeza que deseja excluir esta medição?")
    expect(dialog.textContent).toMatch(/Medição de 15\/04\/2026/)
  })

  it("calls onCancel when the Cancelar button is clicked", () => {
    const { onCancel, onConfirm } = renderDialog()
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }))
    })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("calls onConfirm when the Excluir button is clicked", () => {
    const { onCancel, onConfirm } = renderDialog()
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))
    })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
