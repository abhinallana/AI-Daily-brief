import os
import pg8000.native
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def run_migration():
    print("Connecting to Supabase...")
    conn = pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        timeout=10
    )
    
    try:
        print("Creating feedback table...")
        # Note: In postgres 13+, gen_random_uuid() is built-in.
        conn.run("""
            CREATE TABLE IF NOT EXISTS feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                email TEXT,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                page TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        
        print("Adding CHECK constraint to require user_id or email...")
        # Check if constraint exists, if not add it
        try:
            conn.run("""
                ALTER TABLE feedback 
                ADD CONSTRAINT require_contact 
                CHECK (user_id IS NOT NULL OR (email IS NOT NULL AND email != ''));
            """)
        except Exception as e:
            # Constraint might already exist
            print(f"Note on constraint: {e}")
            
        print("Enabling Row Level Security...")
        conn.run("ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;")
        
        print("Setting up RLS policies...")
        # Drop existing policy if it exists to be safe
        try:
            conn.run("DROP POLICY IF EXISTS \"Allow public inserts\" ON feedback;")
        except:
            pass
            
        # Create insert policy
        conn.run("""
            CREATE POLICY "Allow public inserts" 
            ON feedback 
            FOR INSERT 
            WITH CHECK (true);
        """)
        
        print("Migration completed successfully!")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
