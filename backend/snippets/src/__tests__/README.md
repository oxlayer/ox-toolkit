# Progressive Identity System Tests

This directory contains comprehensive tests for the progressive identity system, covering the core invariants:

- **Anonymous Actor**: Session-based, can act but not own data
- **Contact**: External person, subject of workflows (not a User)
- **Lead**: Contact with commercial/operational intent
- **User**: Keycloak-authenticated only (truth is in Keycloak)
- **Cross-Channel Linking**: Same person across multiple channels

## Test Coverage

### Domain Entity Tests

#### 1. `anonymous-session.unit.test.ts`
Tests anonymous web sessions - users before they become leads.

**Key scenarios:**
- Creating sessions with device fingerprints
- Session lifecycle (expiration, extension)
- Linking sessions to leads
- Tracking UTM parameters and referrers
- Persistence and rehydration

**Core invariants:**
- ✅ Can have draft data
- ❌ Cannot own permanent data
- ❌ Cannot be audited as a person

#### 2. `contact.entity.unit.test.ts`
Tests Contact entity - external persons that exist independently of your system.

**Key scenarios:**
- HR candidates from client systems
- Survey recipients
- WhatsApp numbers uploaded by customers
- Multi-tenant contact management

**Core invariants:**
- ✅ Can receive messages
- ✅ Can answer questions
- ✅ Can generate results
- ❌ Cannot log in
- ❌ No permissions
- ❌ No IAM

#### 3. `lead.entity.unit.test.ts`
Tests Lead entity - known contacts with intent.

**Key scenarios:**
- Progressive flow: Contact → Lead → User
- Intent tracking and qualification
- Protected actions triggering conversion
- Channel-specific behavior (web, WhatsApp, email, SMS)
- Lead nurturing and re-engagement

**Core invariants:**
- ✅ Has contact info (email/phone)
- ✅ Tracks intent score
- ✅ Can convert to User
- ❌ Not yet authenticated

#### 4. `cross-channel-link.domain.unit.test.ts`
Tests cross-channel identity linking.

**Key scenarios:**
- Explicit linking (user verifies ownership)
- Inferred linking (system detects match)
- Multi-channel identity (web + WhatsApp + email)
- Promoting inferred links to explicit
- Unlinking channels

**Core invariants:**
- Channel ≠ Identity ≠ User
- Same person can use multiple channels
- Explicit verification = high confidence
- Inferred matching = medium/low confidence

## Running Tests

### Prerequisites

Install Bun (the test runner):

```bash
# Using npm
npm install -g bun

# Using curl
curl -fsSL https://bun.sh/install | bash

# Using homebrew (macOS)
brew install oven-sh/bun
```

### Run All Tests

```bash
# From snippets directory
cd backend/snippets

# Run all tests
bun test

# Run with watch mode
bun test --watch

# Run specific test file
bun test src/__tests__/domain/anonymous-session.unit.test.ts
```

### Run from Root

```bash
# From project root
bun test --filter @oxlayer/snippets

# Run all package tests
pnpm -r test
```

## Test Organization

```
src/__tests__/
├── domain/
│   ├── anonymous-session.unit.test.ts    # Anonymous Actor tests
│   ├── contact.entity.unit.test.ts         # Contact entity tests
│   ├── lead.entity.unit.test.ts            # Lead progressive flow tests
│   └── cross-channel-link.domain.unit.test.ts  # Cross-channel linking tests
└── README.md                                  # This file
```

## Core Invariants Tested

### 1. User exists ONLY in Keycloak
- No users table in app, or if exists, it's just a cached reference
- All authentication and authorization goes through Keycloak

### 2. Contact ≠ Lead ≠ User
Three distinct concepts with specific purposes:
- **Contact**: External person, subject of workflows
- **Lead**: Contact with intent, can convert to User
- **User**: Keycloak-authenticated only

### 3. Channel ≠ Identity
Channels are just transport:
- **web**: Browser with sessions
- **whatsapp**: WhatsApp messages
- **telegram**: Telegram messages
- **sms**: SMS messages
- **email**: Email threads
- **voice**: Voice calls
- **mobile_app**: Native app

### 4. Progressive Identity Flow
Anonymous → Lead → User (same for all channels)

### 5. Anonymous Actor Can Act Without Ownership
- Try-before-login flows
- Voice commands without authentication
- Draft data creation without permanent ownership

## Example Test Output

```
bun test src/__tests__/domain/anonymous-session.unit.test.ts

Anonymous Session
  Creation and Initialization
    ✓ should create anonymous session with unique ID
    ✓ should generate session ID if not provided
    ✓ should set correct expiration date
  Session Lifecycle
    ✓ should track page views correctly
    ✓ should link to lead correctly
    ✓ should extend session TTL correctly
  ...
```

## Adding New Tests

When adding new identity features, follow these patterns:

1. **Domain Entity Tests**
   - Creation and initialization
   - Business methods and state transitions
   - Persistence and rehydration
   - Core invariant enforcement
   - Real-world scenarios
   - Edge cases

2. **Repository Mocks**
   - Use in-memory maps for simple testing
   - Mock external dependencies (Keycloak, etc.)
   - Return realistic test data

3. **Test Data Builders**
   - Use `@oxlayer/foundation-testing-kit` utilities
   - Generate test IDs, emails, dates
   - Create reusable test factories

## CI/CD Integration

Add to CI pipeline:

```yaml
# Example GitHub Actions
- name: Run identity tests
  working-directory: backend/snippets
  run: |
    bun install
    bun test
```

## Coverage Goals

- **Domain entities**: 100% coverage of business logic
- **State transitions**: All status progression paths
- **Invariants**: All core rules enforced
- **Edge cases**: Boundary conditions tested
- **Real-world scenarios**: Practical user journeys
