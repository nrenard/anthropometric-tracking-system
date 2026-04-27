import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import HomePage from "./page"

describe("HomePage", () => {
  it("renders the app heading", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <HomePage />
      </ChakraProvider>,
    )
    expect(screen.getByRole("heading", { name: /anthropometric tracking/i })).toBeDefined()
  })
})
