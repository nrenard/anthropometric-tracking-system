import type { Metadata } from "next"
import { Provider } from "@/components/ui/provider"
import { StartupRunner } from "@/components/startup-runner"

export const metadata: Metadata = {
  title: "Anthropometric Tracking",
  description: "Acompanhamento de medidas corporais",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Provider>
          <StartupRunner />
          {children}
        </Provider>
      </body>
    </html>
  )
}
