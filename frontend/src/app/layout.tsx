import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";



const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://NodePilot.com'),
  title: "NodePilot - AI-Powered Control Plane for Self-Hosted n8n Workflows",
  description: "Manage your self-hosted n8n workflows with AI assistance. Natural language workflow builder, BYOK encryption, enterprise audit trails, and one-click rollbacks. Free tier available.",
  keywords: [
    "n8n control plane",
    "self-hosted n8n management",
    "n8n AI assistant",
    "n8n workflow automation",
    "BYOK encryption n8n",
    "n8n audit trail",
    "n8n workflow rollback",
    "n8n enterprise security",
    "n8n dashboard",
    "n8n MCP integration",
    "n8n REST API control",
    "secure n8n management"
  ],
  authors: [{ name: "NodePilot" }],
  creator: "NodePilot",
  publisher: "NodePilot",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://NodePilot.com",
    siteName: "NodePilot Control Plane",
    title: "NodePilot - AI-Powered Control Plane for Self-Hosted n8n",
    description: "Manage your self-hosted n8n workflows with AI assistance. Natural language builder, BYOK encryption, audit trails, and instant rollbacks.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NodePilot Control Plane Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NodePilot - AI-Powered Control Plane for Self-Hosted n8n",
    description: "Manage self-hosted n8n workflows with AI, BYOK encryption, and enterprise security.",
    images: ["/og-image.png"],
    creator: "@NodePilot",
  },
  alternates: {
    canonical: "https://NodePilot.com",
  },
  verification: {
    google: "6cvl-ESf4pPTSdQRr-uOJmqSHugGLanSLNWLgn11Sgg",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-mono">
        {children}
      </body>
    </html>
  );
}
