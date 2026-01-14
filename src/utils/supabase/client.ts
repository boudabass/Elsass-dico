import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irdsoeamklkngxbgscom.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHNvZWFta2xrbmd4YmdzY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTQzNTcsImV4cCI6MjA4Mzk5MDM1N30.lcDopujYrmV6bvBOIOZzltl6TZcNB7wrbnsTlgl0hzk';

export function createClient() {
    return createBrowserClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
}