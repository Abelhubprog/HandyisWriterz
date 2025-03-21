import { supabase, adminSupabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Schema for service pages
const serviceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  is_published: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  meta_description: z.string().nullable(),
  featured_image: z.string().url().nullable()
});

async function fixDatabase() {
  try {
    console.log('Starting database fix...');

    // 1. Check and create required tables
    const { data: tables, error: tablesError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) throw tablesError;

    const requiredTables = [
      'services',
      'categories',
      'admin_users',
      'content_stats',
      'comments',
      'document_stats'
    ];

    for (const table of requiredTables) {
      if (!tables?.find(t => t.table_name === table)) {
        console.log(`Creating table: ${table}`);
        await createTable(table);
      }
    }

    // 2. Fix service pages
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    if (servicesError) throw servicesError;

    // Validate and fix each service
    for (const service of services || []) {
      try {
        const validatedService = serviceSchema.parse(service);
        
        // Update service with validated data
        await supabase
          .from('services')
          .update({
            ...validatedService,
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);

        // Ensure content stats exist
        const { data: stats } = await supabase
          .from('content_stats')
          .select('id')
          .eq('content_id', service.id)
          .single();

        if (!stats) {
          await supabase
            .from('content_stats')
            .insert({
              content_id: service.id,
              likes: 0,
              anonymous_likes: 0,
              shares: 0,
              comments_count: 0
            });
        }
      } catch (error) {
        console.error(`Error fixing service ${service.id}:`, error);
      }
    }

    // 3. Fix categories
    await fixCategories();

    // 4. Fix user roles
    await fixUserRoles();

    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

async function createTable(tableName: string) {
  const tableQueries: Record<string, string> = {
    services: `
      CREATE TABLE services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ,
        created_by UUID NOT NULL,
        category_id UUID REFERENCES categories(id),
        meta_description TEXT,
        featured_image TEXT
      );
    `,
    categories: `
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
    `,
    admin_users: `
      CREATE TABLE admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clerk_user_id TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
    content_stats: `
      CREATE TABLE content_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        likes INTEGER DEFAULT 0,
        anonymous_likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        UNIQUE(content_id)
      );
    `,
    comments: `
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
    `,
    document_stats: `
      CREATE TABLE document_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(document_id)
      );
    `
  };

  const query = tableQueries[tableName];
  if (!query) {
    throw new Error(`No query defined for table: ${tableName}`);
  }

  await adminSupabase.raw(query);
}

async function fixCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) throw error;

  // Ensure default categories exist
  const defaultCategories = ['General', 'Academic', 'Business', 'Technical'];
  
  for (const name of defaultCategories) {
    if (!categories?.find(c => c.name === name)) {
      await supabase
        .from('categories')
        .insert({
          name,
          slug: name.toLowerCase(),
          description: `${name} content category`
        });
    }
  }
}

async function fixUserRoles() {
  // Ensure admin_users table exists and has proper indexes
  await adminSupabase.raw(`
    CREATE INDEX IF NOT EXISTS idx_admin_users_clerk_id ON admin_users(clerk_user_id);
  `);
}

// Run the fix
fixDatabase().catch(console.error);