# Project Rules – Claude Code

## 1. Mandatory Documentation

Whenever you implement, modify, or create any functionality:

* **Update existing documentation** if there are related files (README.md, docs/, code comments)
* **Create new documentation** if nothing related to the implemented feature exists
* At a minimum, document:

  * What the functionality does
  * How to use it
  * Parameters and return values (for functions/APIs)
  * Usage examples when applicable

## 2. Clean Code – No Legacy

**NEVER** reuse legacy code or apply “patches.” Always:

* Completely replace old implementations with new ones
* Rewrite from scratch instead of adapting existing code
* Remove dead or unused code
* **Only exception**: extremely compatible and well-structured code that does not compromise quality

When encountering legacy code:

1. Understand what it does
2. Implement a new solution from scratch
3. Completely replace the old code
4. Never keep two versions or add fallbacks to legacy code

## 3. Full Understanding Before Implementing

**NEVER** start implementing without fully understanding what needs to be done. Always:

1. Ask questions to clarify ambiguous requirements
2. Confirm the scope and boundaries of the implementation
3. Validate assumptions before coding
4. Proceed only when everything is fully clear

### Essential questions to consider:

* What is the expected behavior in error cases?
* Are there integrations with other parts of the system?
* Are there specific performance or security requirements?
* What is the complete user flow?
* Are there edge cases to consider?

> **Golden rule**: If there is any doubt, ask BEFORE implementing. One extra question is better than a wrong implementation.

## 4. Database Changes

**NEVER** execute direct changes to the database. Follow this flow:

### Phase 1: Diagnosis (Mandatory before any change)

Before proposing any change, create query statements to understand the current state:

1. Generate SELECT queries to verify the current table structure
2. Query existing data that may be affected
3. Check relationships, constraints, and indexes
4. Present all diagnostic queries for the user to execute
5. **WAIT** for the user to return with the results

### Diagnostic query format:

```sql
-- DIAGNOSTIC QUERY: [description]
-- Run in SQL Editor and paste the result here

[SELECT QUERY HERE]
```

### Phase 2: Changes (Only after a complete overview)

Only after receiving and analyzing the query results:

1. Propose the necessary changes based on the diagnosis
2. Present the alteration queries for the user to execute
3. **WAIT** for execution confirmation

### Alteration query format:

```sql
-- CHANGE: [description of what will be modified]
-- Run in SQL Editor

[ALTERATION QUERY HERE]
```

### Complete flow:

```
1. Identify the need for a database change
2. Generate diagnostic queries (SELECT)
3. Wait for the user to execute and return results
4. Analyze the current state
5. Propose alteration queries
6. Wait for the user to execute and confirm
7. Proceed with implementation
```

> **IMPORTANT**: Never skip the diagnostic phase. Always have a complete view of the current state before proposing changes.

## Rules Summary

| Situation                   | Action                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Received a new task         | Ask questions until you have full understanding                                       |
| Implemented something new   | Document it                                                                           |
| Changed something existing  | Update documentation                                                                  |
| Found legacy code           | Rewrite from scratch                                                                  |
| Need to change the database | 1st Diagnose → 2nd Wait for results → 3rd Propose changes → 4th Wait for confirmation |
