import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"

let mongoServer: MongoMemoryServer

export async function setupTestDb() {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
}

export async function teardownTestDb() {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  await mongoServer.stop()
}
