# CLAUDE.md - Software Engineering Principles & Constraints

> A comprehensive guide to writing clean, maintainable, and pragmatic code. This document serves as a reference for AI assistants and developers to follow best practices while avoiding common pitfalls.

---

## Table of Contents

1. [DRY Principle (Don't Repeat Yourself)](#dry-principle-dont-repeat-yourself)
2. [Overengineering Constraints](#overengineering-constraints)
3. [KISS Principle (Keep It Simple, Stupid)](#kiss-principle-keep-it-simple-stupid)
4. [YAGNI Principle (You Aren't Gonna Need It)](#yagni-principle-you-arent-gonna-need-it)
5. [SOLID Principles](#solid-principles)
6. [Code Quality Standards](#code-quality-standards)
7. [Error Handling Guidelines](#error-handling-guidelines)
8. [Testing Philosophy](#testing-philosophy)
9. [Documentation Standards](#documentation-standards)
10. [Performance Considerations](#performance-considerations)
11. [Security Guidelines](#security-guidelines)
12. [Code Review Checklist](#code-review-checklist)

---

## DRY Principle (Don't Repeat Yourself)

### Core Definition

The DRY principle states that **"every piece of knowledge must have a single, unambiguous, authoritative representation within a system."** This means that logic, data, or functionality should exist in only one place. When you find yourself copying and pasting code, you're likely violating DRY.

### Why DRY Matters

- **Maintainability**: Changes need to be made in only one place
- **Reduced Bugs**: Single source of truth means fewer opportunities for inconsistencies
- **Improved Readability**: Code becomes more modular and easier to understand
- **Faster Development**: Reusable components accelerate future development

### DRY Implementation Strategies

#### 1. Extract Functions and Methods

```javascript
// ❌ BAD: Repeated logic
function calculateCircleArea(radius) {
  return Math.PI * radius * radius;
}

function calculateCylinderVolume(radius, height) {
  return Math.PI * radius * radius * height;
}

// ✅ GOOD: DRY approach
function calculateCircleArea(radius) {
  return Math.PI * radius * radius;
}

function calculateCylinderVolume(radius, height) {
  return calculateCircleArea(radius) * height;
}
```

#### 2. Use Configuration Objects

```javascript
// ❌ BAD: Repeated configuration
const apiEndpoints = {
  users: 'https://api.example.com/users',
  posts: 'https://api.example.com/posts',
  comments: 'https://api.example.com/comments'
};

// ✅ GOOD: DRY configuration
const API_BASE = 'https://api.example.com';
const apiEndpoints = {
  users: `${API_BASE}/users`,
  posts: `${API_BASE}/posts`,
  comments: `${API_BASE}/comments`
};
```

#### 3. Create Utility Modules

```javascript
// ✅ GOOD: Centralized utilities
// utils/formatting.js
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};
```

#### 4. Template Literals and Interpolation

```javascript
// ❌ BAD: String concatenation repeated
const greeting1 = 'Hello, ' + name + '! Welcome to ' + app;
const greeting2 = 'Hello, ' + userName + '! Welcome to ' + appName;

// ✅ GOOD: Template literals
const createGreeting = (name, app) => `Hello, ${name}! Welcome to ${app}`;
```

### DRY Anti-Patterns to Avoid

#### Premature Abstraction

```javascript
// ❌ BAD: Over-abstracted for simple cases
class StringManipulator {
  constructor(str) {
    this.str = str;
  }
  
  toUpperCase() {
    return this.str.toUpperCase();
  }
  
  toLowerCase() {
    return this.str.toLowerCase();
  }
  
  capitalize() {
    return this.str.charAt(0).toUpperCase() + this.str.slice(1);
  }
}

// ✅ GOOD: Use native methods directly for simple operations
const upperStr = str.toUpperCase();
const lowerStr = str.toLowerCase();
```

#### The "Rule of Three"

Before abstracting code, wait until you have **three instances** of similar logic. This ensures you understand the pattern well enough to create a proper abstraction.

```javascript
// First instance - keep it simple
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Second instance - still acceptable to duplicate slightly
function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}

// Third instance - now consider abstraction
function createValidator(pattern) {
  return (value) => pattern.test(value);
}

const validateEmail = createValidator(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const validatePhone = createValidator(/^\d{10}$/);
const validateZip = createValidator(/^\d{5}(-\d{4})?$/);
```

### When NOT to Apply DRY

- **Different Domains**: Similar code serving different business purposes
- **Independent Evolution**: Code that may change independently in the future
- **Readability Trade-offs**: When abstraction makes code harder to understand

---

## Overengineering Constraints

### Definition

Overengineering occurs when developers create solutions that are more complex than necessary for the problem at hand. This often manifests as excessive abstractions, unnecessary features, or premature optimization.

### Signs of Overengineering

#### 1. Excessive Abstraction Layers

```javascript
// ❌ BAD: Overengineered
class AbstractDataProcessor {
  constructor(data) {
    this.data = data;
  }
  
  process() {
    throw new Error('Must implement process method');
  }
}

class DataProcessorFactory {
  static create(type, data) {
    switch(type) {
      case 'json': return new JsonDataProcessor(data);
      case 'xml': return new XmlDataProcessor(data);
      default: throw new Error('Unknown type');
    }
  }
}

class JsonDataProcessor extends AbstractDataProcessor {
  process() {
    return JSON.parse(this.data);
  }
}

// ✅ GOOD: Simple and direct
function parseData(data, type = 'json') {
  if (type === 'json') return JSON.parse(data);
  throw new Error(`Unsupported type: ${type}`);
}
```

#### 2. Premature Feature Addition

```javascript
// ❌ BAD: Building features nobody asked for
class UserValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode ?? false;
    this.allowEmptyFields = options.allowEmptyFields ?? true;
    this.customRules = options.customRules ?? [];
    this.internationalSupport = options.internationalSupport ?? false;
    this.aiValidation = options.aiValidation ?? false; // Nobody needs this yet!
  }
  
  validate(user) {
    // 500 lines of validation logic
  }
}

// ✅ GOOD: Build only what's needed
class UserValidator {
  validate(user) {
    const errors = [];
    if (!user.email) errors.push('Email is required');
    if (!user.name) errors.push('Name is required');
    return { isValid: errors.length === 0, errors };
  }
}
```

#### 3. Configuration Overkill

```javascript
// ❌ BAD: Too many configuration options
const buttonConfig = {
  size: { width: 100, height: 40 },
  colors: { 
    primary: '#007bff', 
    secondary: '#6c757d',
    hover: '#0056b3',
    active: '#004494',
    disabled: '#cccccc'
  },
  animation: {
    duration: 200,
    easing: 'ease-in-out',
    delay: 0
  },
  accessibility: {
    ariaLabel: 'Button',
    role: 'button',
    tabIndex: 0
  },
  // ... 20 more config options
};

// ✅ GOOD: Sensible defaults with minimal override
const buttonConfig = {
  variant: 'primary', // primary | secondary | danger
  size: 'medium'      // small | medium | large
};
```

### Overengineering Prevention Rules

#### Rule 1: Start Simple, Add Complexity When Needed

```
Level 1: Direct solution (function)
    ↓ (when complexity grows)
Level 2: Module with related functions
    ↓ (when patterns emerge)
Level 3: Class with state and methods
    ↓ (when multiple implementations needed)
Level 4: Abstract class / Interface
    ↓ (when extensibility is proven requirement)
Level 5: Framework / Library
```

#### Rule 2: The "What If" Test

Before adding complexity, ask:

1. **Is this feature requested?** If not, don't build it.
2. **Is this abstraction needed now?** If not, wait.
3. **Will this save time?** Calculate: (time saved) - (time to build) > 0?
4. **Can I explain this in 30 seconds?** If not, it might be too complex.

#### Rule 3: Code-to-Value Ratio

Maintain a healthy ratio between code written and value delivered:

```
Good:    10 lines of code → immediate value
Warning: 100 lines of code → potential future value
Danger:  1000 lines of code → speculative value
```

### Complexity Budget

Establish limits on acceptable complexity:

| Metric | Recommended Limit | Warning Level |
|--------|-------------------|---------------|
| Function Length | 20-30 lines | > 50 lines |
| File Length | 200-300 lines | > 500 lines |
| Nesting Depth | 3 levels | > 4 levels |
| Parameters | 3-4 parameters | > 5 parameters |
| Cyclomatic Complexity | 10-15 | > 20 |
| Dependencies per File | 5-7 | > 10 |

---

## KISS Principle (Keep It Simple, Stupid)

### Core Philosophy

The KISS principle emphasizes that systems work best when they are kept simple rather than made complicated. Simplicity should be a key goal in design, and unnecessary complexity should be avoided.

### Implementation Guidelines

#### 1. Prefer Composition Over Inheritance

```javascript
// ❌ BAD: Deep inheritance chain
class Animal {
  constructor(name) { this.name = name; }
}

class Mammal extends Animal {
  constructor(name) { super(name); this.warmBlooded = true; }
}

class Dog extends Mammal {
  constructor(name, breed) { super(name); this.breed = breed; }
}

class WorkingDog extends Dog {
  constructor(name, breed, job) { super(name, breed); this.job = job; }
}

// ✅ GOOD: Composition
const createAnimal = (name) => ({ name });

const withWarmBlood = (animal) => ({ ...animal, warmBlooded: true });

const withBreed = (animal, breed) => ({ ...animal, breed });

const withJob = (animal, job) => ({ ...animal, job });

const workingDog = withJob(withBreed(withWarmBlood(createAnimal('Rex')), 'German Shepherd'), 'K-9');
```

#### 2. Use Clear, Descriptive Names

```javascript
// ❌ BAD: Cryptic abbreviations
const procUsrDt = (u) => {
  const d = u.d;
  return d ? JSON.parse(d) : null;
};

// ✅ GOOD: Self-documenting names
const processUserData = (user) => {
  const userData = user.data;
  return userData ? JSON.parse(userData) : null;
};
```

#### 3. Single Responsibility

```javascript
// ❌ BAD: Doing too many things
class UserService {
  createUser(data) { /* ... */ }
  sendEmail(user) { /* ... */ }
  generateReport(user) { /* ... */ }
  validateCredentials(email, password) { /* ... */ }
  logActivity(user, action) { /* ... */ }
}

// ✅ GOOD: Separated concerns
class UserRepository {
  create(data) { /* ... */ }
  findById(id) { /* ... */ }
}

class EmailService {
  sendWelcomeEmail(user) { /* ... */ }
}

class AuthService {
  validateCredentials(email, password) { /* ... */ }
}
```

---

## YAGNI Principle (You Aren't Gonna Need It)

### Core Concept

YAGNI states that you should not build functionality until you actually need it. This is the antidote to speculative development and feature creep.

### YAGNI Decision Framework

```
┌─────────────────────────────────────────────────────────────┐
│                    Do I Need This Feature?                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Is there a current requirement for this?                 │
│     ├── Yes → Build it                                       │
│     └── No → Continue to question 2                          │
│                                                              │
│  2. Is there a scheduled requirement within 2 sprints?       │
│     ├── Yes → Consider building it                           │
│     └── No → Continue to question 3                          │
│                                                              │
│  3. Would adding this cost more later?                       │
│     ├── Significant cost → Consider building it              │
│     └── Minimal cost → Don't build it                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Examples

```javascript
// ❌ BAD: YAGNI violation - building for hypothetical future
class Database {
  constructor() {
    this.connectionPool = [];
    this.maxConnections = 100; // We only need 5 connections now
    this.readReplicas = [];    // We don't have read replicas
    this.shardingStrategy = null; // We don't shard
  }
}

// ✅ GOOD: Build for current needs
class Database {
  constructor() {
    this.connectionPool = [];
    this.maxConnections = 5;
  }
}
```

---

## SOLID Principles

### S - Single Responsibility Principle (SRP)

A class should have only one reason to change.

```javascript
// ❌ BAD: Multiple responsibilities
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  save() {
    // Database logic
  }
  
  sendEmail() {
    // Email logic
  }
  
  generateReport() {
    // Report logic
  }
}

// ✅ GOOD: Single responsibility
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

class UserRepository {
  save(user) { /* Database logic */ }
}

class EmailService {
  send(user, message) { /* Email logic */ }
}
```

### O - Open/Closed Principle (OCP)

Software entities should be open for extension but closed for modification.

```javascript
// ❌ BAD: Modifying existing code for new shapes
class AreaCalculator {
  calculate(shape) {
    if (shape.type === 'circle') {
      return Math.PI * shape.radius ** 2;
    } else if (shape.type === 'rectangle') {
      return shape.width * shape.height;
    }
    // Must modify this method for each new shape!
  }
}

// ✅ GOOD: Open for extension
class Shape {
  area() {
    throw new Error('Must implement area method');
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
  
  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
  
  area() {
    return this.width * this.height;
  }
}
```

### L - Liskov Substitution Principle (LSP)

Derived classes must be substitutable for their base classes.

```javascript
// ❌ BAD: Violates LSP
class Bird {
  fly() {
    console.log('Flying');
  }
}

class Penguin extends Bird {
  fly() {
    throw new Error("Penguins can't fly!");
  }
}

// ✅ GOOD: Proper hierarchy
class Bird {
  move() {
    console.log('Moving');
  }
}

class FlyingBird extends Bird {
  fly() {
    console.log('Flying');
  }
}

class SwimmingBird extends Bird {
  swim() {
    console.log('Swimming');
  }
}
```

### I - Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they don't use.

```javascript
// ❌ BAD: Fat interface
class Worker {
  work() {}
  eat() {}
  sleep() {}
}

class Robot extends Worker {
  eat() {
    throw new Error("Robots don't eat!");
  }
  sleep() {
    throw new Error("Robots don't sleep!");
  }
}

// ✅ GOOD: Segregated interfaces
class Workable {
  work() {}
}

class Feedable {
  eat() {}
}

class Sleepable {
  sleep() {}
}

class Human extends Workable {
  // Can implement work, eat, and sleep
}

class Robot extends Workable {
  // Only implements work
}
```

### D - Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

```javascript
// ❌ BAD: High-level module depends on low-level
class LightBulb {
  turnOn() { console.log('Light on'); }
  turnOff() { console.log('Light off'); }
}

class Switch {
  constructor() {
    this.bulb = new LightBulb(); // Direct dependency
  }
  
  toggle() {
    this.bulb.turnOn();
  }
}

// ✅ GOOD: Depend on abstraction
class Switch {
  constructor(device) {
    this.device = device;
  }
  
  toggle() {
    this.device.toggle();
  }
}

class LightBulb {
  toggle() { /* ... */ }
}

class Fan {
  toggle() { /* ... */ }
}
```

---

## Code Quality Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `itemCount` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Functions | camelCase (verb prefix) | `getUserById`, `calculateTotal` |
| Classes | PascalCase | `UserService`, `HttpClient` |
| Private members | _prefix or #prefix | `_privateMethod`, `#privateField` |
| Boolean variables | is/has/can prefix | `isValid`, `hasPermission`, `canEdit` |
| Event handlers | handle prefix | `handleClick`, `handleSubmit` |

### Function Design Rules

```javascript
// ✅ GOOD: Small, focused functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const validateUser = (user) => {
  return {
    isValid: validateEmail(user.email) && validatePassword(user.password),
    errors: [
      !validateEmail(user.email) && 'Invalid email',
      !validatePassword(user.password) && 'Password too short'
    ].filter(Boolean)
  };
};
```

### Magic Numbers and Strings

```javascript
// ❌ BAD: Magic values
if (status === 404) {
  // Handle not found
}

// ✅ GOOD: Named constants
const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

if (status === HTTP_STATUS.NOT_FOUND) {
  // Handle not found
}
```

---

## Error Handling Guidelines

### Error Handling Levels

```javascript
// Level 1: Input Validation
const createUser = (data) => {
  if (!data.email) {
    return { success: false, error: 'Email is required' };
  }
  // Continue processing
};

// Level 2: Business Logic Errors
const processPayment = async (amount) => {
  if (amount <= 0) {
    throw new BusinessError('Amount must be positive');
  }
  // Continue processing
};

// Level 3: System Errors
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    throw new SystemError('Failed to fetch data', { cause: error });
  }
};
```

### Error Handling Best Practices

```javascript
// ✅ GOOD: Specific error handling
const processFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new ParseError(`Invalid JSON in file: ${filePath}`);
    }
    throw error; // Re-throw unknown errors
  }
};

// ✅ GOOD: Graceful degradation
const fetchWithFallback = async (primaryUrl, fallbackUrl) => {
  try {
    return await fetch(primaryUrl);
  } catch (error) {
    console.warn(`Primary URL failed, trying fallback: ${error.message}`);
    return fetch(fallbackUrl);
  }
};
```

---

## Testing Philosophy

### Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲           Few, Slow, Expensive
                 ╱──────╲
                ╱        ╲
               ╱Integration╲       Some, Medium Speed
              ╱────────────╲
             ╱              ╲
            ╱   Unit Tests   ╲      Many, Fast, Cheap
           ╱──────────────────╲
```

### Test Coverage Guidelines

| Type | Target Coverage | Focus |
|------|-----------------|-------|
| Unit Tests | 80%+ | Business logic, utilities |
| Integration Tests | 60%+ | API endpoints, database |
| E2E Tests | Critical paths | User journeys |

### Test Naming Convention

```javascript
// Pattern: should_expectedBehavior_when_condition
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {
      // ...
    });
    
    it('should throw error when email is missing', () => {
      // ...
    });
    
    it('should hash password before saving', () => {
      // ...
    });
  });
});
```

---

## Documentation Standards

### Code Comments

```javascript
// ✅ GOOD: Explain WHY, not WHAT
// Using parseInt with radix 10 to avoid octal interpretation in older browsers
const count = parseInt(input, 10);

// ✅ GOOD: Document complex algorithms
// Binary search implementation - O(log n) complexity
// Returns the index of target in sorted array, or -1 if not found
const binarySearch = (arr, target) => {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
};
```

### JSDoc Standards

```javascript
/**
 * Calculates the total price including tax and discount
 * 
 * @param {Object} params - The calculation parameters
 * @param {number} params.basePrice - The base price before adjustments
 * @param {number} params.taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param {number} [params.discount=0] - Discount amount to subtract
 * @returns {number} The final price rounded to 2 decimal places
 * @throws {Error} If basePrice or taxRate is negative
 * 
 * @example
 * const total = calculateTotalPrice({
 *   basePrice: 100,
 *   taxRate: 0.08,
 *   discount: 10
 * }); // Returns 105.84
 */
const calculateTotalPrice = ({ basePrice, taxRate, discount = 0 }) => {
  if (basePrice < 0 || taxRate < 0) {
    throw new Error('Price and tax rate must be non-negative');
  }
  
  const subtotal = basePrice - discount;
  const tax = subtotal * taxRate;
  return Math.round((subtotal + tax) * 100) / 100;
};
```

---

## Performance Considerations

### Optimization Priority

```
1. Correctness - It must work first
2. Readability - Code is read more than written
3. Maintainability - Future developers will thank you
4. Performance - Optimize only measured bottlenecks
```

### Performance Anti-Patterns

```javascript
// ❌ BAD: Premature optimization
const cache = new Map();
const getUserId = (name) => {
  if (cache.has(name)) return cache.get(name);
  const id = expensiveLookup(name);
  cache.set(name, id);
  return id;
};

// ✅ GOOD: Optimize when needed (after profiling)
// Start with simple implementation
const getUserId = (name) => expensiveLookup(name);

// Add caching only when profiling shows this is a bottleneck
```

### Memory Management

```javascript
// ❌ BAD: Memory leak potential
class EventManager {
  constructor() {
    this.listeners = [];
  }
  
  addListener(callback) {
    this.listeners.push(callback);
    // Never removed!
  }
}

// ✅ GOOD: Proper cleanup
class EventManager {
  constructor() {
    this.listeners = new Set();
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  clear() {
    this.listeners.clear();
  }
}
```

---

## Security Guidelines

### Input Validation

```javascript
// ✅ GOOD: Comprehensive validation
const validateInput = (input, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = input[field];
    
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be ${rules.type}`);
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### SQL Injection Prevention

```javascript
// ❌ BAD: SQL injection vulnerable
const getUser = (id) => {
  return db.query(`SELECT * FROM users WHERE id = ${id}`);
};

// ✅ GOOD: Parameterized queries
const getUser = (id) => {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
};
```

### XSS Prevention

```javascript
// ❌ BAD: XSS vulnerable
const renderComment = (comment) => {
  element.innerHTML = comment;
};

// ✅ GOOD: Safe rendering
const renderComment = (comment) => {
  element.textContent = comment;
};

// Or sanitize HTML
import DOMPurify from 'dompurify';
const renderComment = (comment) => {
  element.innerHTML = DOMPurify.sanitize(comment);
};
```

---

## Code Review Checklist

### Before Submitting Code

- [ ] **Functionality**: Does the code do what it's supposed to do?
- [ ] **DRY**: Is there any duplicated code that should be abstracted?
- [ ] **Overengineering**: Is the solution appropriately simple?
- [ ] **Naming**: Are variables, functions, and classes clearly named?
- [ ] **Error Handling**: Are errors handled appropriately?
- [ ] **Security**: Are inputs validated and outputs sanitized?
- [ ] **Performance**: Are there any obvious performance issues?
- [ ] **Tests**: Is there adequate test coverage?
- [ ] **Documentation**: Is complex logic documented?
- [ ] **Standards**: Does it follow project conventions?

### Review Questions

1. Can I understand this code without context?
2. Would a new team member be able to maintain this?
3. Are there any edge cases not handled?
4. Is this the simplest solution that could work?
5. What could go wrong with this implementation?

---

## Quick Reference Cards

### Decision Matrix: To Abstract or Not to Abstract?

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| 1 instance | Don't abstract | No duplication |
| 2 instances | Consider later | Pattern unclear |
| 3 instances | Abstract | Rule of three satisfied |
| Different domains | Don't abstract | Coupling risk |
| Same domain, same pattern | Abstract | Clear benefit |

### Complexity Indicators

| Indicator | Action |
|-----------|--------|
| File > 300 lines | Split into modules |
| Function > 30 lines | Extract helper functions |
| Nesting > 3 levels | Extract to separate function |
| Parameters > 4 | Use options object |
| Cyclomatic complexity > 15 | Simplify logic |

### Priority Order for New Code

```
1. Make it work      (Correctness)
2. Make it right     (Clean code)
3. Make it fast      (Performance)
4. Make it small     (Optimization)
```

---

## Conclusion

These principles are guidelines, not rigid rules. Use judgment and context when applying them. The goal is to produce code that is:

- **Readable**: Others can understand it
- **Maintainable**: Changes are straightforward
- **Reliable**: It works correctly
- **Efficient**: It performs well
- **Secure**: It protects data and users

Remember: **The best code is no code at all.** Every line of code is a liability that must be maintained, tested, and understood. Before writing code, ask if there's a simpler solution or if the feature is truly needed.

---

*"Simplicity is prerequisite for reliability."* — Edsger W. Dijkstra

*"The cheapest, fastest, and most reliable components of a computer system are those that aren't there."* — Gordon Bell

*"Programs must be written for people to read, and only incidentally for machines to execute."* — Harold Abelson
