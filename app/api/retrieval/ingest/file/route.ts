import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

// Use only Node.js runtime
export const runtime = "nodejs";

/**
 * Extract text content from XML content
 */
function extractTextFromXML(xmlString: string): string {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Extract all text nodes
    const textNodes: string[] = [];
    function walkNodes(node: any) {
      if (node.nodeType === 3) { // TEXT_NODE
        textNodes.push(node.data);
      } else if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNodes(node.childNodes[i]);
        }
      }
    }
    
    walkNodes(xmlDoc);
    return textNodes.join(' ');
  } catch (e) {
    console.error('Error parsing XML:', e);
    return '';
  }
}

/**
 * Extract text from a DOCX file using JSZip
 */
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    // Load the DOCX file with JSZip
    const zip = new JSZip();
    const docx = await zip.loadAsync(buffer);
    
    // DOCX files store content in word/document.xml
    const contentXml = await docx.file('word/document.xml')?.async('string');
    
    if (!contentXml) {
      throw new Error('Could not find content in DOCX file');
    }
    
    // Extract text from XML
    return extractTextFromXML(contentXml);
  } catch (e) {
    console.error('Error extracting DOCX content:', e);
    throw new Error(`Failed to extract text from DOCX: ${e.message}`);
  }
}

/**
 * This handler takes a .docx file, extracts the text content,
 * splits it into chunks, and embeds those chunks into a vector store for later retrieval.
 */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO === "true") {
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
      return NextResponse.json({ 
        error: `Failed to extract content: ${extractError.message}` 
      }, { status: 500 });
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
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );

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
        error: `Failed to store document in vector store: ${storageError.message}` 
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
      error: `File processing error: ${e.message}`,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}