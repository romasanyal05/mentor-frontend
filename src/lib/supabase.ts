import { createClient } from "@supabase/supabase-js"

 const supabaseUrl =
  "https://qeujtiyqrkzmvnpfdhqi.supabase.co"
 const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldWp0aXlxcmt6bXZucGZkaHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTc2NzUsImV4cCI6MjA4OTkzMzY3NX0.79KAeYyVSfmMTHcMwlxP7bvSIX1U6hzCxuMcT0bf9Vs"
  export const supabase = createClient(supabaseUrl,supabaseKey)
