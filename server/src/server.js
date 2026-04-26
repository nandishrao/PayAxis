import 'dotenv/config'
import app from './app.js'
import prisma from './config/prisma.js'
import env from './config/env.js'

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀 Agentic Umbrella API running`)
  console.log(`   Port    : ${env.PORT}`)
  console.log(`   Env     : ${env.NODE_ENV}`)
  console.log(`   Health  : http://localhost:${env.PORT}/api/health\n`)
})

// Graceful shutdown — closes DB connections cleanly
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`)
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Database disconnected. Goodbye.\n')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// Unhandled promise rejections — log and exit so the process doesn't hang
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  process.exit(1)
})