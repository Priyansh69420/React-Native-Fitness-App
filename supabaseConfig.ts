import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dojvycwbetqfeutcvsqe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvanZ5Y3diZXRxZmV1dGN2c3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NTYzMDYsImV4cCI6MjA1OTIzMjMwNn0.rCEozdv294yyrE3XyVZiNmi_q5xP2wKjHO3961GVg1U";

export const supabase = createClient(supabaseUrl, supabaseKey);
