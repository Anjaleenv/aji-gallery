import "./globals.css";
import { Providers } from "./providers";
import { SiteLayout } from "@/components/SiteLayout";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const description =
  "Building the Future — construction, masonry, and custom builds.";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Aji Construction",
    template: "%s | Aji Construction",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Aji Construction",
    title: "Aji Construction",
    description,
    locale: "en_IN",
    images: [
      {
        url: "/preview.jpg",
        width: 1200,
        height: 630,
        alt: "Aji Construction",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aji Construction",
    description,
    images: ["/preview.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteLayout>{children}</SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
