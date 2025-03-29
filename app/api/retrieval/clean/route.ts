import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config } from "@/utils/config";

export async function POST(req: Request) {
  try {
    // Use server client instead of trying to use cookies
    const serverSupabase = createServerSupabaseClient();
    
    // Extract the auth token from the request headers
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    let userId;
    
    // If we have a token in the header, use it to get the user
    if (token) {
      const { data: userData, error } = await serverSupabase.auth.getUser(token);
      if (error || !userData.user) {
        console.error("Auth token error:", error);
        return NextResponse.json({ error: "Unauthorized", details: "Invalid token" }, { status: 401 });
      }
      userId = userData.user.id;
    } else {
      // Fallback to checking cookie session with server client
      const { data: { session }, error: sessionError } = await serverSupabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Session error:", sessionError || "No session found");
        return NextResponse.json({ error: "Unauthorized", details: "No valid session found" }, { status: 401 });
      }
      
      userId = session.user.id;
    }
    
    console.log("User ID:", userId);
    
    // Check if user has admin role
    const { data: userData, error: userError } = await serverSupabase
      .from('user_management_view')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("User lookup error:", userError);
      return NextResponse.json({ 
        error: "Failed to verify user role", 
        details: userError.message 
      }, { status: 500 });
    }
    
    if (!userData) {
      console.error("No user found with ID:", userId);
      return NextResponse.json({ 
        error: "User not found", 
        details: `No user record found for ID: ${userId}` 
      }, { status: 404 });
    }
    
    console.log("User found:", userData.email, "with role:", userData.role);
    
    if (userData.role !== "admin") {
      console.error("User is not admin:", userData.role);
      return NextResponse.json({ 
        error: "Admin privileges required", 
        details: `Current role: ${userData.role}` 
      }, { status: 403 });
    }
    
    // Use the server client to delete all documents
    console.log("Deleting all documents...");
    const { error: deleteError } = await serverSupabase
      .from("documents")
      .delete()
      .neq("id", 0);
    
    if (deleteError) {
      console.error("Error deleting documents:", deleteError);
      return NextResponse.json({ 
        error: "Failed to delete documents", 
        details: deleteError.message 
      }, { status: 500 });
    }
    
    console.log("Documents deleted successfully");
    return NextResponse.json({ 
      message: "All documents deleted successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Internal server error", 
      details: errorMessage 
    }, { status: 500 });
  }
}