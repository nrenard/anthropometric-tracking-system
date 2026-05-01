"use client"

import { Box, Flex } from "@chakra-ui/react"
import Link from "next/link"
import { ProfileSwitcher } from "@/components/profile-switcher"

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/medir", label: "Medir" },
  { href: "/historico", label: "Histórico" },
  { href: "/graficos", label: "Gráficos" },
  { href: "/configuracoes", label: "Perfis" },
]

export function BottomNav() {
  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg"
      borderTopWidth={1}
      zIndex={10}
    >
      <Flex
        justify="center"
        align="center"
        p={2}
        borderBottomWidth={1}
        display={{ base: "flex", md: "none" }}
      >
        <ProfileSwitcher />
      </Flex>
      <Flex
        justify="space-around"
        w="full"
        p={2}
        display={{ base: "flex", md: "none" }}
      >
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </Flex>
    </Box>
  )
}
