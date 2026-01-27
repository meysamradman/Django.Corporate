Django Architecture Guidelines (2025 Standard)
To ensure scalability, maintainability, and testability, this project adheres to a strict Service Layer architecture. This document defines the responsibilities of each layer.

1. Application Layers
A. The Presentation Layer (Views & APIs)
Role: Handle HTTP Protocol, Request Parsing, and Response Formatting. Responsibility:

Receive HTTP request.
Parse input data (query params, body).
Call the appropriate Service to perform the business action.
Pass data to Serializers for validation (input) or formatting (output).
Return HTTP Response.
FORBIDDEN: Direct database writes (save(), create(), update()), complex conditionals, or business rule validation.
B. The Service Layer (Services)
Role: The Heart of Business Logic. Responsibility:

Encapsulate all business rules and workflows.
Handle transaction management (@transaction.atomic).
Orchestrate interactions between multiple models or external APIs (e.g., AI providers).
Return simple Python objects or model instances to the View.
FORBIDDEN: Directly accessing request or response objects (keep services HTTP-agnostic).
C. The Data Layer (Models & Managers)
Role: Database Schema and Query Logic. Responsibility:

Define database structure.
Custom Managers/QuerySets for complex filters (e.g., ActiveProjectManager).
Model properties for computed values.
FORBIDDEN: Logic that involves other apps or external services.
D. The Transformation Layer (Serializers)
Role: Data Validation and Transformation. Responsibility:

Validate input data structure and types.
Format output data for API responses.
FORBIDDEN: Side effects (sending emails, calling external APIs) or complex business logic overrides.
2. Implementation Rules
Services
Located in src/<app_name>/services/.
Functional approach preferred (e.g., create_blog_post(...)) or stateless classes.
Must be typed with Python type hints.
Views
Located in src/<app_name>/views/ or src/<app_name>/api/.
Should be "Thin". Ideally 5-10 lines of code per method.
Workflow Example
View: Receives POST /api/blog/.
Serializer: Validates that title and 
content
 are present.
View: Calls BlogService.create_post(validated_data).
Service:
Starts transaction.
Creates 
Blog
 instance.
Triggers AI processing (optional).
Sends notification.
Returns instance.
View: Serializes instance and returns 201 Created.
3. References & Industry Standards (2025)
This architecture is based on modern "Django Styleguide" best practices, specifically aligned with HackSoftware's Django Styleguide and Domain-Driven Design (DDD) principles.

Key Research Findings:
HackSoftware Django Styleguide: Advocates for a strict Service Layer to handle business logic, preventing "Fat Views" and "Fat Models". This is the gold standard for scalable Django apps in 2024/2025.
Separation of Concerns: Moving logic to services enhances testability (isolation from HTTP) and reusability (logic can be called from APIs, Celery tasks, or Management commands).
Atomic Operations: Services are the correct place for transaction.atomic() to orchestrate multi-model updates.
External Resources:
HackSoftware Django Styleguide
Django Service Layer Pattern (Medium/LeapCell)
Domain-Driven Design in Django

