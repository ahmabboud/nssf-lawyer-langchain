import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter, CharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { config } from "@/utils/config";
import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";
import { Document } from "@langchain/core/documents";

export const runtime = "edge";

// Before running, follow set-up instructions at
// https://js.langchain.com/v0.2/docs/integrations/vectorstores/supabase

/**
 * Custom function to split text based on a separator pattern
 * This avoids using RegexTextSplitter which may not be available in the current package version
 */
function splitTextOnPattern(text: string, separator: string): string[] {
  // Escape special regex characters if present in the separator
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Create a regular expression using the escaped separator
  const regex = new RegExp(escapedSeparator, 'g');
  // Split the text on the separator
  return text.split(regex).filter(chunk => chunk.trim() !== '');
}

/**
 * This handler takes input text, splits it into chunks, and embeds those chunks
 * into a vector store for later retrieval. See the following docs for more information:
 *
 * https://js.langchain.com/v0.2/docs/how_to/recursive_text_splitter
 * https://js.langchain.com/v0.2/docs/integrations/vectorstores/supabase
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;
  const chunkingMethod = body.chunkingMethod || "window";
  const windowSize = parseInt(body.windowSize, 10) || 1000;
  const overlapSize = parseInt(body.overlapSize, 10) || 100;
  const splitterTerm = body.splitterTerm || "\n\n";

  if (config.features.demoMode) {
    return NextResponse.json(
      {
        error: [
          "Ingest is not supported in demo mode.",
          "Please set up your own version of the repo here: https://github.com/langchain-ai/langchain-nextjs-template",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    const client = createServerSupabaseClient();
    
    let splitDocuments;
    
    // Choose the splitter based on the chunking method
    if (chunkingMethod === "window") {
      const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
        chunkSize: windowSize,
        chunkOverlap: overlapSize,
      });
      splitDocuments = await splitter.createDocuments([text]);
    } else {
      // Use custom splitting function for pattern-based splitting
      const chunks = splitTextOnPattern(text, splitterTerm);
      console.log(`Custom splitter created ${chunks.length} chunks using pattern: ${splitterTerm}`);
      
      // Convert chunks to Document objects
      splitDocuments = chunks.map(chunk => {
        return new Document({
          pageContent: chunk,
          metadata: {
            chunkingMethod: "splitter",
            splitterTerm: splitterTerm,
          },
        });
      });
      
      // If no documents were created, fall back to character splitter
      if (!splitDocuments.length) {
        console.log('Custom splitting failed to split, falling back to CharacterTextSplitter');
        const fallbackSplitter = new CharacterTextSplitter({
          separator: splitterTerm,
          keepSeparator: false,
        });
        splitDocuments = await fallbackSplitter.createDocuments([text]);
      }
    }

    const vectorstore = await SupabaseVectorStore.fromDocuments(
      splitDocuments,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    return NextResponse.json({ 
      ok: true,
      message: `Successfully processed ${splitDocuments.length} chunks using ${chunkingMethod} method`,
      chunks: splitDocuments.length
    }, { status: 200 });
  } catch (e: any) {
    console.error("Error in text ingest:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
