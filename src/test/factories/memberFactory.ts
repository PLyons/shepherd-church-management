import { faker } from '@faker-js/faker'
import { Member, Household } from '@/types'

export const createMockMember = (overrides: Partial<Member> = {}): Member => {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    gender: faker.helpers.arrayElement(['Male', 'Female']),
    role: faker.helpers.arrayElement(['admin', 'pastor', 'member']),
    householdId: faker.string.uuid(),
    joinDate: faker.date.past(),
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }
}

export const createMockHousehold = (overrides: Partial<Household> = {}): Household => {
  return {
    id: faker.string.uuid(),
    name: `${faker.person.lastName()} Family`,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
    },
    phone: faker.phone.number(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }
}

export const createMockMembers = (count: number = 5): Member[] => {
  return Array.from({ length: count }, () => createMockMember())
}

export const createMockHouseholds = (count: number = 3): Household[] => {
  return Array.from({ length: count }, () => createMockHousehold())
}

export const createMockFamily = (memberCount: number = 3) => {
  const household = createMockHousehold()
  const members = Array.from({ length: memberCount }, (_, index) => 
    createMockMember({ 
      householdId: household.id,
      lastName: household.name.split(' ')[0], // Use household's last name
      role: index === 0 ? 'admin' : 'member', // First member is admin
    })
  )
  
  return { household, members }
}