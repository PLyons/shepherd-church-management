import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MembersService } from '../members.service'
import { Member } from '../../../types/firestore'

// Mock the base service and dependencies
vi.mock('../base.service')
vi.mock('../households.service')
vi.mock('../../lib/firebase', () => ({
  db: 'mock-db',
}))

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => 'mock-db'),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1640995200, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: Math.floor(date.getTime() / 1000), 
      nanoseconds: 0 
    })),
  },
}))

// Mock the converters
vi.mock('../../utils/firestore-converters', () => ({
  memberDocumentToMember: vi.fn((id: string, doc: any) => ({ id, ...doc })),
  memberToMemberDocument: vi.fn((member: any) => member),
}))

// Mock the BaseFirestoreService class
vi.mock('../base.service', () => ({
  BaseFirestoreService: class MockBaseFirestoreService {
    protected collectionName: string
    private mockData: Map<string, any> = new Map()

    constructor(collectionName: string) {
      this.collectionName = collectionName
    }

    async create(data: any, customId?: string): Promise<any> {
      const id = customId || `generated-${Date.now()}`
      const member = { id, ...data }
      this.mockData.set(id, member)
      return member
    }

    async getById(id: string): Promise<any | null> {
      return this.mockData.get(id) || null
    }

    async getWhere(field: string, operator: string, value: any): Promise<any[]> {
      const results: any[] = []
      for (const [id, doc] of this.mockData.entries()) {
        if (doc[field] === value) {
          results.push(doc)
        }
      }
      return results
    }

    async getAll(options?: any): Promise<any[]> {
      let results = Array.from(this.mockData.values())
      
      // Apply where clauses if provided
      if (options?.where && options.where.length > 0) {
        results = results.filter(doc => {
          return options.where.every((condition: any) => {
            return doc[condition.field] === condition.value
          })
        })
      }
      
      return results
    }

    async update(id: string, data: any): Promise<any> {
      const existing = this.mockData.get(id)
      if (!existing) throw new Error('Member not found')
      
      const updated = { ...existing, ...data }
      this.mockData.set(id, updated)
      return updated
    }

    async delete(id: string): Promise<void> {
      this.mockData.delete(id)
    }

    async updateBatch(updates: { id: string; data: any }[]): Promise<any[]> {
      return Promise.all(updates.map(update => this.update(update.id, update.data)))
    }

    async count(options?: any): Promise<number> {
      if (!options?.where) return this.mockData.size
      
      let count = 0
      for (const [id, doc] of this.mockData.entries()) {
        const matchesAll = options.where.every((condition: any) => {
          return doc[condition.field] === condition.value
        })
        if (matchesAll) count++
      }
      return count
    }

    subscribeToCollection(options: any, callback?: any): () => void {
      return vi.fn()
    }

    getDocRef(id: string) {
      return { id }
    }

    // Helper methods for testing
    setMockData(data: Record<string, any>) {
      this.mockData.clear()
      Object.entries(data).forEach(([id, member]) => {
        this.mockData.set(id, member)
      })
    }

    clearMockData() {
      this.mockData.clear()
    }
  }
}))

describe('MembersService', () => {
  let service: MembersService
  let mockBaseService: any

  const createMockMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    role: 'member',
    memberStatus: 'active',
    householdId: 'household-1',
    joinDate: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MembersService()
    // Access the mock base service for test setup
    mockBaseService = service as any
    mockBaseService.clearMockData()
  })

  describe('basic CRUD operations', () => {
    it('should create a member with auth UID', async () => {
      const memberData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      }
      const authUID = 'auth-123'

      const result = await service.createWithAuthUID(authUID, memberData)

      expect(result.id).toBe(authUID)
      expect(result.firstName).toBe('Jane')
      expect(result.lastName).toBe('Smith')
      expect(result.email).toBe('jane.smith@example.com')
    })

    it('should get member by email', async () => {
      const member = createMockMember({ email: 'test@example.com' })
      mockBaseService.setMockData({ [member.id]: member })

      const result = await service.getByEmail('test@example.com')

      expect(result).toEqual(member)
    })

    it('should return null when member email not found', async () => {
      const result = await service.getByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('filtering operations', () => {
    beforeEach(() => {
      const members = [
        createMockMember({ id: 'admin-1', role: 'admin', householdId: 'house-1' }),
        createMockMember({ id: 'pastor-1', role: 'pastor', householdId: 'house-2' }),
        createMockMember({ id: 'member-1', role: 'member', householdId: 'house-1' }),
        createMockMember({ id: 'member-2', role: 'member', householdId: 'house-3', memberStatus: 'inactive' }),
      ]
      
      const memberMap = members.reduce((acc, member) => {
        acc[member.id] = member
        return acc
      }, {} as Record<string, Member>)
      
      mockBaseService.setMockData(memberMap)
    })

    it('should get members by household ID', async () => {
      const result = await service.getByHouseholdId('house-1')

      expect(result).toHaveLength(2)
      expect(result.every(m => m.householdId === 'house-1')).toBe(true)
    })

    it('should get members by role', async () => {
      const adminMembers = await service.getByRole('admin')
      const pastorMembers = await service.getByRole('pastor')
      const regularMembers = await service.getByRole('member')

      expect(adminMembers).toHaveLength(1)
      expect(adminMembers[0].role).toBe('admin')
      
      expect(pastorMembers).toHaveLength(1)
      expect(pastorMembers[0].role).toBe('pastor')
      
      expect(regularMembers).toHaveLength(2)
      expect(regularMembers.every(m => m.role === 'member')).toBe(true)
    })

    it('should get members by status', async () => {
      const activeMembers = await service.getByStatus('active')
      const inactiveMembers = await service.getByStatus('inactive')

      expect(activeMembers).toHaveLength(3)
      expect(inactiveMembers).toHaveLength(1)
      expect(inactiveMembers[0].memberStatus).toBe('inactive')
    })
  })

  describe('search functionality', () => {
    beforeEach(() => {
      const members = [
        createMockMember({ 
          id: 'john-1', 
          firstName: 'John', 
          lastName: 'Smith', 
          fullName: 'John Smith',
          email: 'john.smith@example.com',
          phone: '555-0123'
        }),
        createMockMember({ 
          id: 'jane-1', 
          firstName: 'Jane', 
          lastName: 'Doe', 
          fullName: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '555-0456'
        }),
        createMockMember({ 
          id: 'bob-1', 
          firstName: 'Bob', 
          lastName: 'Johnson', 
          fullName: 'Bob Johnson',
          email: 'bob@test.org',
          phone: '555-0789'
        }),
      ]
      
      const memberMap = members.reduce((acc, member) => {
        acc[member.id] = member
        return acc
      }, {} as Record<string, Member>)
      
      mockBaseService.setMockData(memberMap)
    })

    it('should search members by first name', async () => {
      const result = await service.search('john smith') // More specific search

      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe('John')
    })

    it('should search members by last name', async () => {
      const result = await service.search('doe')

      expect(result).toHaveLength(1)
      expect(result[0].lastName).toBe('Doe')
    })

    it('should search members by full name', async () => {
      const result = await service.search('jane doe')

      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('Jane Doe')
    })

    it('should search members by email', async () => {
      const result = await service.search('bob@test.org')

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('bob@test.org')
    })

    it('should search members by phone', async () => {
      const result = await service.search('555-0456')

      expect(result).toHaveLength(1)
      expect(result[0].phone).toBe('555-0456')
    })

    it('should return empty array for no matches', async () => {
      const result = await service.search('nonexistent')

      expect(result).toHaveLength(0)
    })

    it('should be case insensitive', async () => {
      const result = await service.search('JANE')

      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe('Jane')
    })

    it('should support partial matches', async () => {
      const result = await service.search('jo')

      expect(result).toHaveLength(2) // John and Johnson
      expect(result.some(m => m.firstName === 'John')).toBe(true)
      expect(result.some(m => m.lastName === 'Johnson')).toBe(true)
    })

    it('should match multiple fields with partial search', async () => {
      const result = await service.search('john')

      expect(result).toHaveLength(2) // John (firstName) and Johnson (lastName)
      expect(result.some(m => m.firstName === 'John')).toBe(true)
      expect(result.some(m => m.lastName === 'Johnson')).toBe(true)
    })
  })

  describe('member directory', () => {
    beforeEach(() => {
      const members = [
        createMockMember({ id: 'active-1', memberStatus: 'active', role: 'admin' }),
        createMockMember({ id: 'active-2', memberStatus: 'active', role: 'member' }),
        createMockMember({ id: 'inactive-1', memberStatus: 'inactive', role: 'member' }),
        createMockMember({ id: 'visitor-1', memberStatus: 'visitor', role: 'member' }),
      ]
      
      const memberMap = members.reduce((acc, member) => {
        acc[member.id] = member
        return acc
      }, {} as Record<string, Member>)
      
      mockBaseService.setMockData(memberMap)
    })

    it('should get member directory with all members by default', async () => {
      const result = await service.getMemberDirectory()

      expect(result).toHaveLength(4)
    })

    it('should filter by status', async () => {
      const result = await service.getMemberDirectory({ status: 'active' })

      expect(result).toHaveLength(2)
      expect(result.every(m => m.memberStatus === 'active')).toBe(true)
    })

    it('should filter by role', async () => {
      const result = await service.getMemberDirectory({ role: 'admin' })

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('admin')
    })

    it('should support search in directory', async () => {
      // getMemberDirectory filters inline on firstName, lastName, and email
      // Set up member with searchable firstName
      const members = [
        createMockMember({ 
          id: 'searchable-1', 
          firstName: 'TestUser', 
          lastName: 'Smith',
          memberStatus: 'active', 
          role: 'admin' 
        }),
      ]
      
      const memberMap = members.reduce((acc, member) => {
        acc[member.id] = member
        return acc
      }, {} as Record<string, Member>)
      
      mockBaseService.setMockData(memberMap)

      const result = await service.getMemberDirectory({ search: 'TestUser' })

      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe('TestUser')
    })
  })

  describe('statistics', () => {
    beforeEach(() => {
      const members = [
        createMockMember({ memberStatus: 'active', role: 'admin' }),
        createMockMember({ memberStatus: 'active', role: 'member' }),
        createMockMember({ memberStatus: 'active', role: 'member' }),
        createMockMember({ memberStatus: 'inactive', role: 'member' }),
        createMockMember({ memberStatus: 'visitor', role: 'member' }),
      ]
      
      const memberMap = members.reduce((acc, member, index) => {
        acc[`member-${index}`] = member
        return acc
      }, {} as Record<string, Member>)
      
      mockBaseService.setMockData(memberMap)
    })

    it('should get member statistics', async () => {
      // Mock the count method for different queries
      const countSpy = vi.spyOn(service, 'count')
      countSpy
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(3)  // active
        .mockResolvedValueOnce(1)  // inactive
        .mockResolvedValueOnce(1)  // visitors
        .mockResolvedValueOnce(1)  // admins
        .mockResolvedValueOnce(0)  // pastors
        .mockResolvedValueOnce(4)  // members

      // Mock householdsService count
      const mockHouseholdsService = service as any
      mockHouseholdsService.householdsService = {
        count: vi.fn().mockResolvedValue(3)
      }

      const result = await service.getStatistics()

      expect(result).toEqual({
        total: 5,
        active: 3,
        inactive: 1,
        visitors: 1,
        admins: 1,
        pastors: 0,
        members: 4,
        householdsCount: 3,
      })
    })
  })

  describe('error handling', () => {
    it('should handle errors when getting member by email', async () => {
      // Mock getWhere to throw an error
      vi.spyOn(service, 'getWhere').mockRejectedValue(new Error('Database error'))

      await expect(service.getByEmail('test@example.com')).rejects.toThrow('Database error')
    })

    it('should handle errors when searching members', async () => {
      // Mock getAll to throw an error
      vi.spyOn(service, 'getAll').mockRejectedValue(new Error('Search failed'))

      await expect(service.search('test')).rejects.toThrow('Search failed')
    })
  })

  describe('bulk operations', () => {
    it('should import members successfully', async () => {
      const membersData = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ]

      // Mock create method
      const createSpy = vi.spyOn(service, 'create')
      createSpy
        .mockResolvedValueOnce(createMockMember({ id: 'created-1', firstName: 'John' }))
        .mockResolvedValueOnce(createMockMember({ id: 'created-2', firstName: 'Jane' }))

      const result = await service.importMembers(membersData)

      expect(result.success).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.success[0].firstName).toBe('John')
      expect(result.success[1].firstName).toBe('Jane')
    })

    it('should handle import validation errors', async () => {
      const membersData = [
        { firstName: 'John' }, // Missing required fields
        { firstName: 'Jane', lastName: 'Smith', email: 'existing@example.com' }, // Duplicate email
      ]

      // Mock getByEmail to return existing member
      vi.spyOn(service, 'getByEmail').mockResolvedValue(createMockMember({ email: 'existing@example.com' }))

      const result = await service.importMembers(membersData)

      expect(result.success).toHaveLength(0)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].error).toContain('Missing required fields')
      expect(result.errors[1].error).toContain('already exists')
    })

    it('should export members to CSV format', async () => {
      const members = [
        createMockMember({ 
          id: 'member-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isPrimaryContact: true
        }),
      ]

      // Mock getMemberDirectory
      vi.spyOn(service, 'getMemberDirectory').mockResolvedValue(members)

      const result = await service.exportMembers()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'member-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isPrimaryContact: 'Yes',
      })
    })
  })

  describe('household sync operations', () => {
    it('should update member with household sync', async () => {
      const currentMember = createMockMember({ 
        id: 'member-1', 
        firstName: 'John',
        householdId: 'old-household',
        isPrimaryContact: false
      })
      mockBaseService.setMockData({ [currentMember.id]: currentMember })

      const updateData = {
        firstName: 'UpdatedJohn',
        householdId: 'new-household',
        isPrimaryContact: true
      }

      // Update mock data to simulate the effect of the batch operation
      const updatedMember = { ...currentMember, ...updateData }
      
      // Spy on the service methods to simulate the household operations
      vi.spyOn(service, 'getById')
        .mockResolvedValueOnce(currentMember) // First call in the method
        .mockResolvedValueOnce(updatedMember) // Second call at the end

      const result = await service.updateWithHouseholdSync('member-1', updateData)

      expect(result.firstName).toBe('UpdatedJohn')
      expect(result.householdId).toBe('new-household')
      expect(result.isPrimaryContact).toBe(true)
    })

    it('should delete member with household cleanup', async () => {
      const member = createMockMember({ id: 'member-1', householdId: 'household-1' })
      mockBaseService.setMockData({ [member.id]: member })

      // Mock householdsService
      const mockHouseholdsService = {
        removeMemberFromHousehold: vi.fn().mockResolvedValue(undefined),
      }
      ;(service as any).householdsService = mockHouseholdsService

      await service.deleteWithHouseholdCleanup('member-1')

      expect(mockHouseholdsService.removeMemberFromHousehold).toHaveBeenCalledWith('household-1', 'member-1')
    })
  })

  describe('subscriptions', () => {
    it('should subscribe to member directory', () => {
      const callback = vi.fn()
      const mockUnsubscribe = vi.fn()

      // Mock subscribeToCollection
      vi.spyOn(service, 'subscribeToCollection').mockReturnValue(mockUnsubscribe)

      const unsubscribe = service.subscribeToMemberDirectory({ status: 'active', limit: 50 }, callback)

      expect(service.subscribeToCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ field: 'memberStatus', operator: '==', value: 'active' }],
          limit: 50,
          orderBy: { field: 'fullName', direction: 'asc' }
        }),
        callback
      )
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should subscribe to household members', () => {
      const callback = vi.fn()
      const mockUnsubscribe = vi.fn()

      // Mock subscribeToCollection
      vi.spyOn(service, 'subscribeToCollection').mockReturnValue(mockUnsubscribe)

      const unsubscribe = service.subscribeToHouseholdMembers('household-1', callback)

      expect(service.subscribeToCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ field: 'householdId', operator: '==', value: 'household-1' }],
          orderBy: { field: 'fullName', direction: 'asc' }
        }),
        callback
      )
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})