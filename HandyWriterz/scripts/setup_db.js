/**
 * Database Setup Script
 * 
 * This script helps set up the database schema for HandyWriterz using the Supabase CLI.
 * It will read the migration file and apply it to your Supabase project.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const MIGRATION_FILE = path.join(__dirname, '..', 'migrations', 'create_admin_tables.sql');

console.log('💾 HandyWriterz Database Setup');
console.log('------------------------------');
console.log('This script will help you set up the database schema for HandyWriterz.');
console.log('Make sure you have the Supabase CLI installed and you are logged in.');
console.log('You can install it with: npm install -g supabase');
console.log('And log in with: supabase login');
console.log('\n');

function checkSupabaseCLI() {
  return new Promise((resolve, reject) => {
    exec('supabase --version', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Supabase CLI not found. Please install it first.');
        console.log('Run: npm install -g supabase');
        reject(new Error('Supabase CLI not installed'));
      } else {
        console.log(`✅ Supabase CLI detected: ${stdout.trim()}`);
        resolve();
      }
    });
  });
}

function confirmAction(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function getProjectRef() {
  return new Promise((resolve) => {
    rl.question('Enter your Supabase project reference (from settings): ', (ref) => {
      resolve(ref.trim());
    });
  });
}

function applyMigration(projectRef) {
  return new Promise((resolve, reject) => {
    console.log('📂 Reading migration file...');
    
    try {
      const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
      console.log(`✅ Successfully read migration file: ${MIGRATION_FILE}`);
      
      console.log('🔄 Applying migration to database...');
      
      // Create a temporary file with the SQL
      const tempFile = path.join(__dirname, 'temp_migration.sql');
      fs.writeFileSync(tempFile, sql);
      
      // Run the migration using Supabase CLI
      exec(`supabase db push --project-ref ${projectRef} --file ${tempFile}`, (error, stdout, stderr) => {
        // Clean up temp file
        fs.unlinkSync(tempFile);
        
        if (error) {
          console.error('❌ Error applying migration:', stderr);
          reject(new Error('Migration failed'));
        } else {
          console.log('✅ Migration applied successfully!');
          resolve();
        }
      });
    } catch (err) {
      console.error('❌ Error reading migration file:', err);
      reject(err);
    }
  });
}

async function createAdminUser(projectRef) {
  const createAdmin = await confirmAction('Do you want to create an admin user?');
  
  if (!createAdmin) {
    return;
  }
  
  const email = await new Promise((resolve) => {
    rl.question('Enter email for admin user: ', (email) => {
      resolve(email.trim());
    });
  });
  
  const password = await new Promise((resolve) => {
    rl.question('Enter password for admin user (min 8 characters): ', (password) => {
      resolve(password.trim());
    });
  });
  
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    return;
  }
  
  return new Promise((resolve, reject) => {
    // Create a SQL script to create the user
    const createUserSQL = `
    -- Create admin user
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES ('${email}', crypt('${password}', gen_salt('bf')), now(), now(), now())
    ON CONFLICT (email) DO NOTHING;

    -- Get the user ID
    DO $$
    DECLARE
      user_id uuid;
    BEGIN
      SELECT id INTO user_id FROM auth.users WHERE email = '${email}';
      
      -- Create a profile with admin role
      INSERT INTO public.profiles (id, name, role, status, created_at, updated_at)
      VALUES (user_id, split_part('${email}', '@', 1), 'admin', 'active', now(), now())
      ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();
    END
    $$;
    `;
    
    // Create a temporary file with the SQL
    const tempFile = path.join(__dirname, 'create_admin.sql');
    fs.writeFileSync(tempFile, createUserSQL);
    
    console.log('🔄 Creating admin user...');
    
    // Run the SQL using Supabase CLI
    exec(`supabase db execute --project-ref ${projectRef} --file ${tempFile}`, (error, stdout, stderr) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      if (error) {
        console.error('❌ Error creating admin user:', stderr);
        reject(new Error('Failed to create admin user'));
      } else {
        console.log('✅ Admin user created successfully!');
        console.log(`   Email: ${email}`);
        console.log(`   Password: (as provided)`);
        resolve();
      }
    });
  });
}

async function seedSampleData(projectRef) {
  const seedData = await confirmAction('Do you want to seed some sample data?');
  
  if (!seedData) {
    return;
  }
  
  // Create a SQL script with sample data
  const sampleDataSQL = `
  -- Sample service settings
  INSERT INTO public.service_settings 
    (service_type, title, description, display_options, seo)
  VALUES
    ('adult-health-nursing', 'Adult Health Nursing', 'Resources and content for adult health nursing professionals', 
      '{"showBanner": true, "showFeaturedPosts": true, "showCategories": true, "showTags": true, "codeBlockStyle": "default", "postsPerPage": 10}',
      '{"metaTitle": "Adult Health Nursing Resources | HandyWriterz", "metaDescription": "Professional resources for adult health nursing practitioners", "keywords": ["nursing", "healthcare", "adult health"]}'),
    ('mental-health-nursing', 'Mental Health Nursing', 'Resources and content for mental health nursing professionals', 
      '{"showBanner": true, "showFeaturedPosts": true, "showCategories": true, "showTags": true, "codeBlockStyle": "default", "postsPerPage": 10}',
      '{"metaTitle": "Mental Health Nursing Resources | HandyWriterz", "metaDescription": "Professional resources for mental health nursing practitioners", "keywords": ["nursing", "mental health", "healthcare"]}'),
    ('child-nursing', 'Child Nursing', 'Resources and content for pediatric nursing professionals', 
      '{"showBanner": true, "showFeaturedPosts": true, "showCategories": true, "showTags": true, "codeBlockStyle": "default", "postsPerPage": 10}',
      '{"metaTitle": "Child Nursing Resources | HandyWriterz", "metaDescription": "Professional resources for pediatric nursing practitioners", "keywords": ["nursing", "pediatric", "healthcare", "children"]}'),
    ('crypto', 'Cryptocurrency Analysis', 'Resources and content for cryptocurrency and blockchain analysis', 
      '{"showBanner": true, "showFeaturedPosts": true, "showCategories": true, "showTags": true, "codeBlockStyle": "github", "postsPerPage": 10}',
      '{"metaTitle": "Cryptocurrency Analysis | HandyWriterz", "metaDescription": "Professional analysis of cryptocurrency markets and blockchain technology", "keywords": ["crypto", "blockchain", "bitcoin", "analysis"]}'),
    ('ai', 'Artificial Intelligence', 'Resources and content for AI and machine learning', 
      '{"showBanner": true, "showFeaturedPosts": true, "showCategories": true, "showTags": true, "codeBlockStyle": "vscode", "postsPerPage": 10}',
      '{"metaTitle": "AI Research and Resources | HandyWriterz", "metaDescription": "Professional resources for artificial intelligence and machine learning", "keywords": ["AI", "machine learning", "deep learning"]}')
  ON CONFLICT (service_type) DO NOTHING;

  -- Sample categories
  INSERT INTO public.categories
    (name, slug, service, description)
  VALUES
    ('Clinical Practice', 'clinical-practice', 'adult-health-nursing', 'Resources related to clinical practice in adult nursing'),
    ('Health Promotion', 'health-promotion', 'adult-health-nursing', 'Content focused on health promotion strategies'),
    ('Patient Assessment', 'patient-assessment', 'mental-health-nursing', 'Resources for mental health patient assessment'),
    ('Therapeutic Interventions', 'therapeutic-interventions', 'mental-health-nursing', 'Content about therapeutic mental health interventions'),
    ('Pediatric Development', 'pediatric-development', 'child-nursing', 'Resources about pediatric development stages'),
    ('Family-Centered Care', 'family-centered-care', 'child-nursing', 'Content focused on family-centered care approaches'),
    ('Market Analysis', 'market-analysis', 'crypto', 'Cryptocurrency market analysis and trends'),
    ('Blockchain Technology', 'blockchain-technology', 'crypto', 'Resources about blockchain technology and applications'),
    ('Machine Learning', 'machine-learning', 'ai', 'Content about machine learning algorithms and applications'),
    ('Natural Language Processing', 'nlp', 'ai', 'Resources for NLP technologies and implementation')
  ON CONFLICT DO NOTHING;
  `;
  
  // Create a temporary file with the SQL
  const tempFile = path.join(__dirname, 'sample_data.sql');
  fs.writeFileSync(tempFile, sampleDataSQL);
  
  console.log('🔄 Seeding sample data...');
  
  return new Promise((resolve, reject) => {
    // Run the SQL using Supabase CLI
    exec(`supabase db execute --project-ref ${projectRef} --file ${tempFile}`, (error, stdout, stderr) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      if (error) {
        console.error('❌ Error seeding sample data:', stderr);
        reject(new Error('Failed to seed sample data'));
      } else {
        console.log('✅ Sample data seeded successfully!');
        resolve();
      }
    });
  });
}

async function main() {
  try {
    await checkSupabaseCLI();
    
    const proceed = await confirmAction('Do you want to proceed with database setup?');
    if (!proceed) {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
    
    const projectRef = await getProjectRef();
    if (!projectRef) {
      console.error('❌ Project reference is required');
      rl.close();
      return;
    }
    
    await applyMigration(projectRef);
    await createAdminUser(projectRef);
    await seedSampleData(projectRef);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start the application and login with your admin user.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
main(); 