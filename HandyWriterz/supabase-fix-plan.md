# Supabase Backend Fix Plan

## Current Issues Identified

1. **Duplicate Migration Files**
   - Multiple initial schema files with different timestamps
   - Redundant migrations across different directories
   - Inconsistent naming conventions

2. **Migration Order Issues**
   - Unclear execution order of migrations
   - Potential conflicts between migrations
   - Missing dependencies between migrations

3. **Schema Management**
   - Multiple schema definition locations (schema.sql, migrations)
   - Potential inconsistencies between schema versions
   - UUID extension dependency issues

## Fix Plan

### Phase 1: Clean Up and Organize

1. **Consolidate Migration Files**
   - Remove duplicate migrations from migrations/ directory
   - Keep only the latest versions in migrations_fixed/
   - Establish consistent naming convention with timestamps

2. **Create Base Schema**
   - Consolidate core schema from various files
   - Include all necessary extensions
   - Define tables in proper dependency order

3. **Organize RLS Policies**
   - Separate RLS policies into dedicated migration
   - Ensure policies are created after tables
   - Add proper error handling for existing policies

### Phase 2: Migration Sequence

1. **Core Schema Migration (20250302000000)**
   - Database extensions
   - Base tables (profiles, admin_users, orders, etc.)
   - Foreign key relationships
   
2. **RLS Policies Migration (20250302000001)**
   - Table-specific policies
   - Admin access rules
   - Public access constraints

3. **Functions Migration (20250302000002)**
   - User management functions
   - Administrative functions
   - Utility functions

4. **Data Migration (20250302000003)**
   - Seed data
   - Default admin user
   - Sample content if needed

### Phase 3: Testing and Verification

1. **Database Connection**
   - Test connection string
   - Verify permissions
   - Check CORS settings

2. **Schema Verification**
   - Validate table structures
   - Check foreign key constraints
   - Verify RLS policies

3. **Function Testing**
   - Test administrative functions
   - Verify user management
   - Check utility functions

### Phase 4: Documentation

1. **Migration Documentation**
   - Clear instructions for running migrations
   - Order of execution
   - Troubleshooting guide

2. **Schema Documentation**
   - Table relationships
   - Column descriptions
   - Policy explanations

## Implementation Steps

1. Create new consolidated migration files in migrations_fixed/
2. Test each migration in isolation
3. Run complete migration sequence
4. Verify database state
5. Update documentation

## Rollback Plan

1. Backup current database state
2. Keep migrations_backup for reference
3. Document rollback procedures
4. Test rollback process

## Next Steps

Would you like to proceed with this plan? We can:
1. Start implementing the changes in code mode
2. Modify the plan if needed
3. Add or remove specific components based on your requirements

Please let me know if you'd like any adjustments to this plan before we proceed with the implementation.