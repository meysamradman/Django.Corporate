# Real Estate Model Strategy (CRM-First, Performance-Critical)

## Scope
- Product type: Real-estate CRM (not public self-submit marketplace)
- Scale target: 50,000+ listings now, up to 500,000 listings
- Primary requirement: fast filters and stable admin workflows
- Stack: Django + PostgreSQL + React Admin/Vite + Next.js Web

## Final Architectural Decision
Use a **hybrid model**:

1. Core searchable fields stay in `Property` (typed DB columns + indexes)
2. Boolean amenities stay in `features` (ManyToMany)
3. Multi-option/secondary specs stay in `extra_attributes` (JSON)
4. Do **not** move core filters to fully dynamic EAV now

This is intentionally different from Divar's full dynamic submit-engine because our use-case is CRM and performance-first.

## Data Placement Rules

### A) Keep in `Property` (direct columns)
Use for high-frequency filtering, sorting, range queries, analytics.

- Location: `province`, `city`, `region`
- Commercial/search core: `property_type`, `state`, `price`, `built_area`, `land_area`
- Counts: `bedrooms`, `bathrooms`, `kitchens`, `living_rooms`
- Building core: `year_built`, `floor_number`, `floors_in_building`
- Parking/storage core: `parking_spaces`, `storage_rooms`
- Document core: `document_type`, `has_document`
- Elevator core: `has_elevator`
- Note: `has_elevator` is a direct column (not in `features`) because it is a top-tier filter in the Iranian real-estate market.
- Status core: `is_published`, `is_public`, `is_active`, `status`

Why: fastest possible WHERE/order/range with btree/partial indexes.

### B) Keep in `features` (ManyToMany boolean amenities)
Use for yes/no amenities with low cardinality.

Examples:
- balcony
- pool
- sauna
- jacuzzi
- lobby
- roof_garden
- terrace
- smart_home
- remote_door
- renovated (optional: can stay here)

Rule: if value is only "has / has not", `features` is valid.

### C) Keep in `extra_attributes` (JSON)
Use for multi-option fields that are not top-tier filters.

Examples:
- `cooling_system`
- `heating_system`
- `warm_water_provider`
- `floor_type`
- `toilet_type`
- `kitchen_type`
- `building_facade`
- `building_direction`
- `occupancy_status`
- `cabinet_material` (single or multi)
- `exchangeable` (optional)
- `has_loan` (optional)

Rule: if field has many options and is mostly for details/admin entry, keep in JSON.

## Performance Policy (Non-Negotiable)

1. Never run heavy filter joins on JSON at listing scale by default.
2. Keep all public/main filters on indexed direct columns.
3. Add/keep partial indexes for high-traffic booleans and public listings.
4. Treat `extra_attributes` filters as optional/advanced only.
5. If one JSON key becomes hot filter, **promote it** to direct column.

## "New Building" Age Policy

- UI bucket `new` = age `0..1` years
- Backend computes from `year_built` and current shamsi year
- Manual age range has priority over bucket

## Constants Source of Truth

Single source must be backend constants.
Frontend must consume via API (preferred) or generated/shared mapping.

Recommended API shape:
- `GET /api/real-estate/constants/`
- return:
  - `document_types`
  - `cooling_system_options`
  - `heating_system_options`
  - `toilet_type_options`
  - `kitchen_type_options`
  - `building_facade_options`
  - `building_direction_options`
  - `occupancy_status_options`
  - `cabinet_material_options`

## Admin Form Strategy

Create/Edit Property form sections:

1. Core fields (direct columns)
2. Amenities (features toggle/checkbox)
3. Other specs (select inputs bound to `extra_attributes`)

Validation rules:
- enforce valid enum values for each JSON key
- sanitize unknown keys in `extra_attributes`
- keep backward compatibility for existing records

## Web Filter Strategy

Public filter priority:
1. Core columns only (fast path)
2. Optional advanced filters on `features`
3. Avoid default JSON-key filtering on high traffic endpoints

## When to Introduce Dynamic Attribute Models (EAV)

Only add `AttributeDefinition/AttributeOption/PropertyAttributeValue` if ALL are true:
- many category-specific schemas are required,
- non-dev users must create new fields frequently,
- current hybrid model blocks business growth.

Until then, hybrid model is the correct architecture.

## Implementation Checklist

1. Keep current core fields in `Property` (no downgrade to generic attributes)
2. Finalize and document JSON keys for `extra_attributes`
3. Expose backend constants endpoint for admin/web selects
4. Ensure admin create/edit maps correctly to core + features + extra_attributes
5. Keep filters optimized on core fields and indexed paths
6. Add tests:
   - create/edit payload validation
   - filter correctness (core + age bucket/range)
   - constants endpoint schema stability

## Decision Summary

- For this CRM, current direction is correct.
- Do not imitate Divar's full dynamic form engine now.
- Keep hybrid design for best speed, lower complexity, and easier maintenance.


