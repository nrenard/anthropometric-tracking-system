import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, cleanup, act, waitFor, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"

const { pushMock, toastCreateMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  toastCreateMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: toastCreateMock },
}))

import LoginPage from "./page"

function renderLogin() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <LoginPage />
    </ChakraProvider>,
  )
}

function fillField(label: RegExp, value: string) {
  const input = screen.getByLabelText(label) as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

describe("LoginPage", () => {
  beforeEach(() => {
    cleanup()
    pushMock.mockReset()
    toastCreateMock.mockReset()
    vi.restoreAllMocks()
  })

  it("renders pt-BR labels for e-mail and senha", () => {
    renderLogin()

    expect(screen.getByLabelText(/E-mail/i)).toBeDefined()
    expect(screen.getByLabelText(/Senha/i)).toBeDefined()
  })

  it("renders a submit button labelled 'Entrar'", () => {
    renderLogin()

    expect(screen.getByRole("button", { name: /Entrar/i })).toBeDefined()
  })

  it("does not call fetch when submitted with empty fields", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    renderLogin()
    const submit = screen.getByRole("button", { name: /Entrar/i })
    await act(async () => {
      submit.click()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("redirects to '/' on successful login", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    renderLogin()
    fillField(/E-mail/i, "user@test.com")
    fillField(/Senha/i, "secret")

    const submit = screen.getByRole("button", { name: /Entrar/i })
    await act(async () => {
      submit.click()
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" }),
      )
    })
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/")
    })
  })

  it("shows an error toast 'Credenciais inválidas' on 401 response", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    renderLogin()
    fillField(/E-mail/i, "user@test.com")
    fillField(/Senha/i, "wrong")

    const submit = screen.getByRole("button", { name: /Entrar/i })
    await act(async () => {
      submit.click()
    })

    await waitFor(() => {
      expect(toastCreateMock).toHaveBeenCalled()
    })
    const callArg = toastCreateMock.mock.calls[0][0]
    expect(JSON.stringify(callArg)).toContain("Credenciais inválidas")
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("does not include any registration link", () => {
    renderLogin()

    expect(screen.queryByText(/cadastrar/i)).toBeNull()
    expect(screen.queryByText(/registrar/i)).toBeNull()
    expect(screen.queryByText(/criar conta/i)).toBeNull()
  })
})
