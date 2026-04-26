import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Platform Admin...')

  // Upsert the admin user
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@umbrella.com' },
    update: {},
    create: {
      email:        'admin@umbrella.com',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      firstName:    'Super',
      lastName:     'Admin',
    },
  })

  // Create the PLATFORM_ADMIN membership (no org needed)
  const existing = await prisma.membership.findFirst({
    where: { userId: admin.id, role: 'PLATFORM_ADMIN' },
  })

  if (!existing) {
    await prisma.membership.create({
      data: {
        userId:         admin.id,
        organisationId: null,
        role:           'PLATFORM_ADMIN',
        isActive:       true,
      },
    })
    console.log(`Created PLATFORM_ADMIN membership for ${admin.email}`)
  } else {
    console.log(`PLATFORM_ADMIN membership already exists for ${admin.email}`)
  }

  console.log('\nDone. You can now login as admin@umbrella.com / Admin1234!')
  console.log('The Platform Admin can then create orgs and add all other users.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


// df0706f5-a1d2-47b1-9125-fd1e4c44c4af