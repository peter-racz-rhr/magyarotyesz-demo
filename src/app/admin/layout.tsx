import type { Metadata } from "next";

// Not linked from the app and kept out of search engines.
export const metadata: Metadata = {
  title: "Admin · magyarotyesz",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
