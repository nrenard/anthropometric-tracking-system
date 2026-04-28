import bcrypt from "bcrypt"

const SALT_ROUNDS = 12

async function main(): Promise<void> {
  const password = process.argv[2]

  if (!password) {
    console.error("Usage: npx tsx scripts/hash-password.ts <password>")
    process.exit(1)
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hash = await bcrypt.hash(password, salt)
  console.log(hash)
}

main().catch((error) => {
  console.error("Failed to hash password:", error)
  process.exit(1)
})
