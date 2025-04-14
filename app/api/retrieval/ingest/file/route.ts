import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter, CharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { config } from "@/utils/config";
import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";
import { Document } from "@langchain/core/documents";

// Change runtime from edge to nodejs
export const runtime = "nodejs";

// Custom function to split text based on a separator pattern
function splitTextOnPattern(text: string, separator: string): string[] {
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedSeparator, 'g');
  return text.split(regex).filter(chunk => chunk.trim() !== '');
}

// Sanitize text content to remove invalid Unicode sequences and normalize text
function sanitizeText(text: string): string {
  return text
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text content from a DOCX file using mammoth library
async function extractDocxContent(buffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const nodeBuffer = Buffer.from(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
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

// Extract text content from a PDF file using pdf-parse
async function extractPdfContent(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = require('pdf-parse');
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF file: ${error.message}`);
  }
}

// Processes and ingests documents uploaded via file upload into the Supabase vector store
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
    
    const chunkingMethod = formData.get("chunkingMethod") as string || "window";
    const windowSize = parseInt(formData.get("windowSize") as string || "1000", 10);
    const overlapSize = parseInt(formData.get("overlapSize") as string || "100", 10);
    const splitterTerm = formData.get("splitterTerm") as string || "\n\n";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

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
      try {
        fileContent = sanitizeText(await extractPdfContent(buffer));
        console.log('Extracted PDF content length:', fileContent.length);
        
        if (!fileContent) {
          throw new Error('No content was extracted from the PDF file');
        }
      } catch (pdfError: any) {
        console.error('PDF processing error:', pdfError);
        return NextResponse.json({ 
          error: `PDF processing error: ${pdfError.message}` 
        }, { status: 400 });
      }
    } else if (file.name.endsWith('.txt')) {
      fileContent = sanitizeText(await file.text());
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .txt, .docx, or .pdf file." },
        { status: 400 }
      );
    }

    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: "No valid text content could be extracted from the file" },
        { status: 400 }
      );
    }

    const client = createServerSupabaseClient();
    
    const metadata = {
      source: file.name,
      uploadDate: new Date().toISOString(),
      chunkingMethod: chunkingMethod,
      chunkingOptions: chunkingMethod === 'window' 
        ? { windowSize, overlapSize }
        : { splitterTerm }
    };

    let docs;
    
    if (chunkingMethod === "window") {
      const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
        chunkSize: windowSize,
        chunkOverlap: overlapSize,
      });
      
      docs = await splitter.createDocuments(
        [fileContent],
        [metadata]
      );
    } else {
      const chunks = splitTextOnPattern(fileContent, splitterTerm);
      console.log(`Custom splitter created ${chunks.length} chunks using pattern: ${splitterTerm}`);
      
      docs = chunks.map(chunk => {
        return new Document({
          pageContent: chunk,
          metadata: {
            ...metadata,
            chunkingMethod: "splitter",
            splitterTerm: splitterTerm,
          },
        });
      });
      
      if (!docs.length) {
        console.log('Custom splitting failed to split, falling back to CharacterTextSplitter');
        const fallbackSplitter = new CharacterTextSplitter({
          separator: splitterTerm,
          keepSeparator: false,
        });
        docs = await fallbackSplitter.createDocuments(
          [fileContent],
          [metadata]
        );
      }
    }
    
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
      message: `Successfully processed and stored ${docs.length} chunks from ${file.name} using ${chunkingMethod} method`,
      chunks: docs.length
    }, { status: 200 });
    
  } catch (e: any) {
    console.error("Error processing file:", e);
    return NextResponse.json({ 
      error: e.message || "An error occurred while processing the file" 
    }, { status: 500 });
  }
}