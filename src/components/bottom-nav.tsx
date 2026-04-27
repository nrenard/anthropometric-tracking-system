"use client"

import { Box, Flex } from "@chakra-ui/react"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/medir", label: "Medir" },
  { href: "/historico", label: "Histórico" },
  { href: "/config", label: "Config" },
]

export function BottomNav() {
  return (
    <Box
      as="nav"
      display={{ base: "flex", md: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg"
      borderTopWidth={1}
      zIndex={10}
    >
      <Flex justify="space-around" w="full" p={2}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </Flex>
    </Box>
  )
}
