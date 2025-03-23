"use client";

import { useEffect } from "react";
import "./globals.css";
import { Public_Sans } from "next/font/google";
import { ActiveLink, Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import MainContentWrapper from "@/components/MainContentWrapper";

const publicSans = Public_Sans({ subsets: ["latin"] });

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 240 41"
    className="h-8 flex-shrink-0 self-start"
  >
    <path
      fill="currentColor"
      d="M61.514 11.157a3.943 3.943 0 0 0-2.806 1.158l-3.018 3.01a3.951 3.951 0 0 0-1.147 3.095l.019.191a3.894 3.894 0 0 0 1.128 2.314c.435.434.914.709 1.496.9.03.175.047.352.047.53 0 .797-.31 1.546-.874 2.107l-.186.186c-1.008-.344-1.848-.847-2.607-1.604a6.888 6.888 0 0 1-1.927-3.67l-.034-.193-.153.124a3.675 3.675 0 0 0-.294.265l-3.018 3.01a3.957 3.957 0 0 0 2.807 6.757 3.959 3.959 0 0 0 2.806-1.158l3.019-3.01a3.958 3.958 0 0 0 0-5.599 3.926 3.926 0 0 0-1.462-.92 3.252 3.252 0 0 1 .924-2.855 6.883 6.883 0 0 1 2.664 1.656 6.906 6.906 0 0 1 1.926 3.67l.035.193.153-.124c.104-.083.202-.173.296-.267l3.018-3.01a3.956 3.956 0 0 0-2.808-6.756h-.004Z"
    />
    <path
      fill="currentColor"
      d="M59.897.149h-39.49C9.153.149 0 9.279 0 20.5c0 11.222 9.154 20.351 20.406 20.351h39.49c11.253 0 20.407-9.13 20.407-20.35C80.303 9.277 71.149.148 59.897.148ZM40.419 32.056c-.651.134-1.384.158-1.882-.36-.183.42-.612.199-.943.144-.03.085-.057.16-.085.246-1.1.073-1.925-1.046-2.449-1.89-1.04-.562-2.222-.904-3.285-1.492-.062.968.15 2.17-.774 2.794-.047 1.862 2.824.22 3.088 1.608-.204.022-.43-.033-.594.124-.749.726-1.608-.55-2.471-.023-1.16.582-1.276 1.059-2.71 1.179-.08-.12-.047-.2.02-.273.404-.468.433-1.02 1.122-1.22-.71-.111-1.303.28-1.901.59-.778.317-.772-.717-1.968.054-.132-.108-.069-.206.007-.289.304-.37.704-.425 1.155-.405-2.219-1.233-3.263 1.508-4.288.145-.308.081-.424.358-.618.553-.167-.183-.04-.405-.033-.62-.2-.094-.453-.139-.394-.459-.391-.132-.665.1-.957.32-.263-.203.178-.5.26-.712.234-.407.769-.084 1.04-.377.772-.437 1.847.273 2.729.153.68.085 1.52-.61 1.179-1.305-.726-.926-.598-2.137-.614-3.244-.09-.645-1.643-1.467-2.092-2.163-.555-.627-.987-1.353-1.42-2.068-1.561-3.014-1.07-6.886-3.037-9.685-.89.49-2.048.259-2.816-.399-.414.377-.432.87-.465 1.392-.994-.99-.87-2.863-.075-3.966a5.276 5.276 0 0 1 1.144-1.11c.098-.07.131-.14.129-.25.786-3.524 6.144-2.845 7.838-.348 1.229 1.537 1.6 3.57 2.994 4.997 1.875 2.047 4.012 3.85 5.742 6.03 1.637 1.992 2.806 4.328 3.826 6.683.416.782.42 1.74 1.037 2.408.304.403 1.79 1.5 1.467 1.888.186.403 1.573.959 1.092 1.35h.002Zm26.026-12.024-3.018 3.01a6.955 6.955 0 0 1-2.875 1.728l-.056.016-.02.053a6.865 6.865 0 0 1-1.585 2.446l-3.019 3.01a6.936 6.936 0 0 1-4.932 2.035 6.936 6.936 0 0 1-4.932-2.035 6.95 6.95 0 0 1 0-9.838l3.018-3.01a6.882 6.882 0 0 1 2.871-1.721l.055-.017.02-.053a6.932 6.932 0 0 1 1.59-2.454l3.019-3.01a6.936 6.936 0 0 1 4.932-2.035c1.865 0 3.616.723 4.932 2.035a6.898 6.898 0 0 1 2.04 4.92c0 1.86-.724 3.607-2.04 4.918v.002Z"
    />
  </svg>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>مساعد المحامي</title>
        <link rel="shortcut icon" href="/images/chatbot-logo.jpg" />
        <meta
          name="description"
          content="هذا هو المساعد الافتراضي لمساعد المحامي."
        />
        <meta property="og:title" content="مساعد المحامي" />
        <meta
          property="og:description"
          content="البداية لمساعد المحامي."
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="مساعد المحامي" />
        <meta
          name="twitter:description"
          content="البداية لمساعد المحامي."
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
            {/* Updated Header Section */}
            <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
              <div className="flex gap-4 flex-col md:flex-row md:items-center justify-end">
                {/* Move "محادثة" before "مساعد محامي الضمان الاجتماعي" */}
                <nav className="flex gap-1 flex-col md:flex-row">
                  <ActiveLink href="/"> محادثة</ActiveLink>
                </nav>
                <h1 className="text-2xl font-bold text-center">مساعد محامي الضمان الاجتماعي</h1>
              </div>
              <div className="flex justify-center items-center gap-2">
                <Navbar />
              </div>
            </div>
            <div className="bg-background mx-4 relative grid rounded-t-2xl border border-input border-b-0">
              <div className="absolute inset-0">
                <MainContentWrapper>{children}</MainContentWrapper>
              </div>
            </div>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}