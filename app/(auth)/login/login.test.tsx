import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import LoginPage from "./page"

// Mock Next.js navigation and NextAuth
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
}))

vi.mock("next-auth/react", () => ({
    signIn: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
}))

describe("LoginPage - Volunteer and Venue Operations Credentials", () => {
    it("renders Volunteer and Venue Operations tabs and portal title", () => {
        render(<LoginPage />)
        expect(screen.getByText("Login Portal")).toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: /Volunteer/i }).length).toBeGreaterThan(0)
        expect(screen.getAllByRole("button", { name: /Venue Ops/i }).length).toBeGreaterThan(0)
    })

    it("displays Volunteer credentials by default and allows auto-fill", () => {
        render(<LoginPage />)
        expect(screen.getAllByText("volunteer@codeundercover.com").length).toBeGreaterThan(0)

        const autoFillButtons = screen.getAllByRole("button", { name: /Auto-fill Form|Use Volunteer Credentials/i })
        expect(autoFillButtons.length).toBeGreaterThan(0)

        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement
        fireEvent.click(autoFillButtons[0])

        expect(emailInput.value).toBe("volunteer@codeundercover.com")
    })

    it("switches to Venue Operations portal and displays venue credentials", () => {
        render(<LoginPage />)
        const venueTabs = screen.getAllByRole("button", { name: /Venue Ops/i })
        fireEvent.click(venueTabs[0])

        expect(screen.getAllByText("venue.ops@codeundercover.com").length).toBeGreaterThan(0)

        const autoFillButtons = screen.getAllByRole("button", { name: /Auto-fill Form|Use Venue Ops Credentials/i })
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement
        fireEvent.click(autoFillButtons[0])

        expect(emailInput.value).toBe("venue.ops@codeundercover.com")
    })
})
