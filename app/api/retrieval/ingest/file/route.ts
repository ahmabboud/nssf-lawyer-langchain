import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { config } from "@/utils/config";
import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";
import { Document } from "@langchain/core/documents";
import * as pdfjs from 'pdfjs-dist';

// Set worker path for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Change runtime from edge to nodejs
export const runtime = "nodejs";

/**
 * Sanitize text content to remove invalid Unicode sequences and normalize text
 */
function sanitizeText(text: string): string {
  return text
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract text content from a DOCX file using mammoth library
 */
async function extractDocxContent(buffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamically import mammoth to avoid edge runtime issues
    const mammoth = await import('mammoth');
    
    // Convert the ArrayBuffer to a Buffer that mammoth can work with
    const nodeBuffer = Buffer.from(buffer);
    
    // Use mammoth to convert DOCX to text using the buffer format
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    
    // Get the text content from the result
    const textContent = result.value;
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No readable content found in the DOCX file');
    }
    
    return textContent;
  } catch (error: any) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract text from DOCX file: ${error.message}`);
  }
}

/**
 * Processes and ingests documents uploaded via file upload into the Supabase vector store
 */
export async function POST(req: NextRequest) {
  if (config.features.demoMode) {
    return NextResponse.json(
      {
        error: [
          "File ingest is not supported in demo mode.",
          "Please set up your own version of the repo.",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get the file content based on its type
    let fileContent = '';
    const buffer = await file.arrayBuffer();
    
    if (file.name.endsWith('.docx')) {
      try {
        fileContent = sanitizeText(await extractDocxContent(buffer));
        console.log('Extracted DOCX content length:', fileContent.length);
        
        if (!fileContent) {
          throw new Error('No content was extracted from the DOCX file');
        }
      } catch (docxError: any) {
        console.error('DOCX processing error:', docxError);
        return NextResponse.json({ 
          error: `DOCX processing error: ${docxError.message}` 
        }, { status: 400 });
      }
    } else if (file.name.endsWith('.pdf')) {
      // Process PDF using pdf.js
      const typedArray = new Uint8Array(buffer);
      const pdfDoc = await pdfjs.getDocument({ data: typedArray }).promise;
      const textContents = [];
      
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(' ');
        textContents.push(sanitizeText(text));
      }
      
      fileContent = textContents.join('\n\n');
    } else if (file.name.endsWith('.txt')) {
      // Process .txt files
      fileContent = sanitizeText(await file.text());
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .txt, .docx, or .pdf file." },
        { status: 400 }
      );
    }

    // Ensure the content is not empty after sanitization
    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: "No valid text content could be extracted from the file" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const client = createServerSupabaseClient();
    
    // Split the document into chunks
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 1000,
      chunkOverlap: 100,
    });

    // Create document metadata with file info
    const metadata = {
      source: file.name,
      uploadDate: new Date().toISOString(),
    };

    // Create documents with content and metadata
    const docs = await splitter.createDocuments(
      [fileContent],
      [metadata]
    );

    // Store documents in the Supabase vector store
    await SupabaseVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    return NextResponse.json({ 
      success: true,
      message: `Successfully processed and stored ${docs.length} chunks from ${file.name}` 
    }, { status: 200 });
    
  } catch (e: any) {
    console.error("Error processing file:", e);
    return NextResponse.json({ 
      error: e.message || "An error occurred while processing the file" 
    }, { status: 500 });
  }
}