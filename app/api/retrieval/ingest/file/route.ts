import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";
import { config } from "@/utils/config";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import mammoth from 'mammoth';

// Use Node.js runtime instead of Edge Runtime to support JSZip's use of setImmediate
export const runtime = "nodejs";

/**
 * Extract text from a DOCX file using mammoth
 */
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    // Use mammoth to convert docx to HTML and then get the text value
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer
    });
    
    return result.value || '';
  } catch (e) {
    console.error('Error extracting DOCX content:', e);
    throw new Error(`Failed to extract text from DOCX: ${(e as Error).message}`);
  }
}

/**
 * This handler takes a .docx file, extracts the text content,
 * splits it into chunks, and embeds those chunks into a vector store for later retrieval.
 */
export async function POST(req: NextRequest) {
  if (config.features.demoMode) {
    return NextResponse.json(
      {
        error: [
          "File upload is not supported in demo mode.",
          "Please set up your own version of the repo here: https://github.com/langchain-ai/langchain-nextjs-template",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    // Process the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Check if file is a .docx file
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: "Only .docx files are supported" }, 
        { status: 400 }
      );
    }
    
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
    
    // Get file buffer for processing
    const bytes = await file.arrayBuffer();
    
    // Extract text content from the DOCX file
    let extractedText;
    try {
      extractedText = await extractTextFromDocx(bytes);
      console.log(`Extracted ${extractedText.length} characters of text content`);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract any text from the document" },
          { status: 400 }
        );
      }
    } catch (extractError) {
      console.error("Error extracting DOCX content:", extractError);
      // If extraction fails, attempt a fallback approach
      try {
        // Create a simple placeholder text using the filename
        extractedText = `Document: ${file.name}. This document was uploaded but its content could not be properly extracted. Please try converting the document to plain text before uploading for best results.`;
      } catch (fallbackError) {
        return NextResponse.json({ 
          error: `Failed to extract content: ${(extractError as Error).message}` 
        }, { status: 500 });
      }
    }
    
    // Create a document from the extracted text
    const doc = new Document({
      pageContent: extractedText,
      metadata: { 
        source: file.name,
        type: 'docx' 
      }
    });
    
    // Create a Supabase client
    const client = createServerSupabaseClient();

    // Split the document into chunks
    console.log("Splitting document into chunks");
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    const splitDocuments = await splitter.splitDocuments([doc]);
    console.log(`Created ${splitDocuments.length} document chunks`);

    // Store the document chunks in the vector store
    console.log("Storing documents in vector store");
    try {
      await SupabaseVectorStore.fromDocuments(
        splitDocuments,
        new OpenAIEmbeddings(),
        {
          client,
          tableName: "documents",
          queryName: "match_documents",
        },
      );
    } catch (storageError) {
      console.error("Error storing documents in vector store:", storageError);
      return NextResponse.json({ 
        error: `Failed to store document in vector store: ${(storageError as Error).message}` 
      }, { status: 500 });
    }

    console.log("Document processing complete");
    return NextResponse.json({ 
      ok: true,
      message: "File uploaded and processed successfully",
      documentName: file.name,
      chunkCount: splitDocuments.length
    }, { status: 200 });
  } catch (e: any) {
    console.error("Error processing file:", e);
    return NextResponse.json({ 
      error: `File processing error: ${(e as Error).message}`,
      stack: config.features.isDevelopment ? (e as Error).stack : undefined
    }, { status: 500 });
  }
}