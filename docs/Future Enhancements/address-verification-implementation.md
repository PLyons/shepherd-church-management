# address-verification-implementation

## Purpose
Implement real-time address verification for the Shepherd Church Management System to ensure postal addresses are valid and deliverable. This system will validate addresses as members are added or updated, providing immediate feedback to users and maintaining high data quality for church communications and mailings.

## Requirements
- Integrate with free address validation APIs (OpenStreetMap Nominatim primary, Google Maps fallback)
- Validate addresses in real-time during member form entry
- Provide visual feedback for address validation status
- Cache validated addresses to minimize API calls and improve performance
- Support international addresses (not just US-specific)
- Graceful degradation when validation services are unavailable
- Feature flag to enable/disable validation system-wide
- Maintain backward compatibility with existing member data
- Rate limit API calls to stay within free tier limits
- Store validation metadata for analytics and debugging
- Progressive enhancement - forms work without validation, better with it

## Procedure

### Phase 1: Core Service Infrastructure

#### Task 1: Create Address Validation Service Interface
**File**: `src/services/addressValidation.service.ts`

Create the foundational service architecture with the following specifications:

```typescript
// Interface definitions required
interface ValidationProvider {
  name: 'nominatim' | 'google' | 'usps';
  validateAddress(address: AddressInput): Promise<ValidationResult>;
  isConfigured(): boolean;
  getRateLimit(): { requests: number; period: 'second' | 'minute' | 'hour' };
}

interface AddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100 score
  standardizedAddress?: StandardizedAddress;
  suggestions?: StandardizedAddress[];
  provider: string;
  timestamp: string;
  errors?: string[];
  warning?: string;
}

interface StandardizedAddress extends AddressInput {
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  placeId?: string; // Provider-specific identifier
}

interface ValidationCache {
  address: string; // Normalized address key
  result: ValidationResult;
  expiresAt: number; // Timestamp
}
```

**Implementation Requirements:**
1. Create abstract base class `BaseValidationProvider` implementing `ValidationProvider`
2. Implement provider registry pattern to manage multiple validation services
3. Add address normalization function to create cache keys (lowercase, remove spaces, standardize abbreviations)
4. Create rate limiting mechanism using token bucket algorithm
5. Implement exponential backoff for failed requests
6. Add comprehensive error handling with specific error types
7. Include request/response logging for debugging
8. Add configuration validation on service initialization

#### Task 2: Implement OpenStreetMap Nominatim Provider
**File**: `src/services/validation-providers/nominatim.provider.ts`

Create Nominatim-specific implementation:

```typescript
class NominatimProvider extends BaseValidationProvider {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent: string;
  private lastRequest = 0;
  private readonly minInterval = 1000; // 1 second between requests
}
```

**Specific Implementation Requirements:**
1. Respect OSM usage policy: max 1 request per second
2. Include proper User-Agent header: `Shepherd-CMS/1.0 (+contact-email)`
3. Use structured search API endpoint: `/search`
4. Parse confidence based on `importance` and `place_rank` fields
5. Map OSM address components to our standardized format
6. Handle various response formats (JSON array, may be empty)
7. Implement timeout handling (5 second timeout)
8. Add retry logic for network failures only (not rate limit errors)
9. Convert coordinates to proper number types
10. Handle international addresses with proper country code mapping

**Required Environment Variables:**
- `VITE_NOMINATIM_USER_AGENT`: Custom user agent string
- `VITE_NOMINATIM_EMAIL`: Contact email for heavy usage

#### Task 3: Implement Caching Layer
**File**: `src/services/addressValidationCache.service.ts`

Create sophisticated caching to minimize API calls:

```typescript
class AddressValidationCache {
  private readonly storageKey = 'shepherd_address_cache';
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly maxEntries = 1000;
}
```

**Implementation Requirements:**
1. Use localStorage for persistence across sessions
2. Implement LRU (Least Recently Used) eviction policy
3. Compress cache data using JSON compression
4. Add cache statistics tracking (hit rate, size, age distribution)
5. Implement cache warming for common addresses
6. Handle localStorage quota exceeded gracefully
7. Add manual cache invalidation methods
8. Include cache migration for schema changes
9. Implement cache export/import for data portability
10. Add cache health monitoring

### Phase 2: Form Integration

#### Task 4: Create Validation UI Components
**File**: `src/components/common/AddressValidation.tsx`

Create reusable validation UI components:

```typescript
interface AddressValidationProps {
  address: AddressInput;
  onValidationComplete?: (result: ValidationResult) => void;
  onAddressSelect?: (address: StandardizedAddress) => void;
  showSuggestions?: boolean;
  validateOnMount?: boolean;
  debounceMs?: number;
}

const AddressValidation: React.FC<AddressValidationProps> = ({...}) => {
  // Component implementation
}
```

**UI/UX Requirements:**
1. Loading states: Show spinner during validation
2. Success states: Green checkmark with confidence percentage
3. Warning states: Yellow warning icon for low confidence (< 70%)
4. Error states: Red X for invalid addresses or API failures
5. Suggestion modal: Show alternative addresses when available
6. Progressive disclosure: Validation details on hover/click
7. Accessibility: Proper ARIA labels, keyboard navigation
8. Responsive design: Mobile-friendly interface
9. Animations: Smooth transitions between states (200ms duration)
10. Tooltips: Explain validation scores and provider information

**Additional Components to Create:**
- `AddressValidationStatus`: Icon + status display
- `AddressValidationModal`: Suggestion selection modal
- `ValidationResultTooltip`: Detailed result information

#### Task 5: Integrate with Member Forms
**File**: `src/components/members/MemberFormEnhanced.tsx` (modifications)

Integrate validation into existing member forms:

**Integration Requirements:**
1. Add validation to each address in the addresses array
2. Implement debounced validation (500ms after user stops typing)
3. Validate on field blur events
4. Validate before form submission
5. Block submission for invalid addresses (user override option)
6. Show validation status inline with address fields
7. Update form validation schema to include address validation
8. Handle validation during edit mode for existing addresses
9. Store validation metadata with saved addresses
10. Add form-level validation summary

**Specific Implementation Steps:**
1. Import AddressValidation component
2. Wrap address fieldsets with validation component  
3. Add validation state to form state management
4. Update form submission logic to check validation status
5. Add validation toggle in form settings
6. Implement "Skip validation" override for admin users
7. Update form error handling for validation failures
8. Add validation progress indicators for bulk operations

### Phase 3: Advanced Features

#### Task 6: Implement Google Maps Fallback Provider
**File**: `src/services/validation-providers/google.provider.ts`

Add Google Maps as backup validation:

```typescript
class GoogleMapsProvider extends BaseValidationProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
}
```

**Implementation Requirements:**
1. Use Geocoding API for address validation
2. Implement proper API key management
3. Handle quota limits (10,000 requests/month free)
4. Parse Google's response format to our standard
5. Map confidence based on location_type and partial_match fields
6. Handle different result types (ROOFTOP, RANGE_INTERPOLATED, etc.)
7. Implement proper error handling for quota exceeded
8. Add billing alert warnings as quota approaches
9. Support multiple result types (addresses, POIs, etc.)
10. Handle international address formatting

**Required Environment Variables:**
- `VITE_GOOGLE_MAPS_API_KEY`: API key for Google Maps services
- `VITE_GOOGLE_MAPS_QUOTA_LIMIT`: Monthly quota limit for monitoring

#### Task 7: Create Validation Configuration System
**File**: `src/services/validationConfig.service.ts`

Create administrative configuration interface:

**Configuration Options:**
1. Enable/disable validation globally
2. Set confidence thresholds (minimum acceptable scores)
3. Configure provider priorities and fallback order
4. Set rate limiting parameters
5. Configure cache settings (size, TTL)
6. Enable/disable specific validation features
7. Set validation requirements by role (admin can skip, etc.)
8. Configure international validation rules
9. Set API timeout values
10. Configure retry policies

**Admin UI Requirements:**
- Add validation settings to admin panel
- Display API usage statistics
- Show cache performance metrics
- Provide validation test interface
- Include provider health monitoring
- Add validation error reporting
- Implement configuration export/import

#### Task 8: Add Validation Analytics and Reporting
**File**: `src/services/validationAnalytics.service.ts`

Track validation performance and usage:

**Metrics to Track:**
1. Validation requests per provider
2. Success/failure rates by provider
3. Average confidence scores
4. Cache hit/miss ratios
5. API response times
6. Error types and frequencies
7. Geographic distribution of validated addresses
8. User validation override rates
9. Monthly API usage against quotas
10. Address quality improvements over time

**Reporting Features:**
1. Daily/weekly/monthly validation reports
2. Provider performance comparisons
3. Cache effectiveness analysis
4. API cost projections
5. Address data quality dashboards
6. Validation failure analysis
7. User behavior insights
8. Geographic validation success rates

### Phase 4: Testing and Quality Assurance

#### Task 9: Implement Comprehensive Testing
**Files**: `src/services/__tests__/addressValidation.test.ts` and related

**Testing Requirements:**
1. Unit tests for each validation provider
2. Integration tests for full validation flow
3. Mock API responses for consistent testing
4. Edge case testing (empty responses, timeouts, errors)
5. Cache testing (LRU eviction, persistence, migration)
6. Rate limiting tests
7. UI component testing with various validation states
8. Form integration testing
9. Performance testing for large address lists
10. Accessibility testing for validation UI

**Test Data Requirements:**
- Sample addresses for different countries
- Invalid address examples
- Provider-specific response mocks
- Cache edge cases
- Network failure scenarios

#### Task 10: Performance Optimization and Monitoring
**File**: `src/services/validationMonitoring.service.ts`

**Optimization Requirements:**
1. Implement request batching where possible
2. Add connection pooling for HTTP requests
3. Implement circuit breaker pattern for failed providers
4. Add performance monitoring and alerting
5. Optimize cache serialization/deserialization
6. Implement lazy loading for validation components
7. Add request deduplication
8. Optimize for mobile networks (slower connections)
9. Implement offline mode detection
10. Add performance budgets and monitoring

### Implementation Notes for Claude Code Agent

**Critical Implementation Order:**
1. Start with Task 1 (service interface) - this establishes the foundation
2. Implement Task 3 (caching) before Task 2 (providers) to avoid API calls during testing
3. Complete Task 2 (Nominatim) before Task 4 (UI) to have working validation
4. Task 4 and 5 can be developed in parallel
5. Tasks 6-8 are optional enhancements, implement based on user needs
6. Tasks 9-10 should be ongoing throughout development

**Testing Strategy:**
- Test each provider with real API calls during development
- Mock API calls in automated tests
- Test with various international address formats
- Verify rate limiting works correctly
- Test cache behavior under various scenarios

**Error Handling Priority:**
1. Network failures: Graceful degradation
2. Rate limiting: Proper backoff and user messaging
3. Invalid responses: Clear error messages
4. Cache corruption: Automatic recovery
5. Configuration errors: Fail-fast with clear messages

**Security Considerations:**
- Never log or cache sensitive address data
- Validate API keys and configuration
- Implement proper CORS handling
- Sanitize address inputs to prevent injection
- Use HTTPS for all API calls

**Performance Targets:**
- Validation response time: < 2 seconds average
- Cache hit rate: > 80% for repeated addresses
- API error rate: < 5% under normal conditions
- Form responsiveness: No UI blocking during validation
- Memory usage: < 50MB for cache and validation services

Each task should be implemented with comprehensive error handling, logging, and documentation. Follow existing code patterns in the Shepherd codebase, particularly the service layer architecture and React component patterns.