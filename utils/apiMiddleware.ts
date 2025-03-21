import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabaseClient";
import { validateConfig } from "./config";

export class APIError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
    this.name = 'APIError';
  }
}

type HandlerFunction = (req: NextRequest, session?: any) => Promise<Response>;

export async function withErrorHandling(handler: HandlerFunction) {
  // Validate environment configuration
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 }
    );
  }

  return async (req: NextRequest) => {
    try {
      // Get session for protected routes
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new APIError('Authentication error', 401);
      }

      if (!session) {
        throw new APIError('Unauthorized', 401);
      }

      return await handler(req, session);
    } catch (error) {
      console.error('API error:', error);
      
      if (error instanceof APIError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}