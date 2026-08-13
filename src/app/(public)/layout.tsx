import { TopNavBar } from "@/components/TopNavBar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNavBar />
      {children}
      <Footer />
      <ScrollToTop />
    </>
  );
}
