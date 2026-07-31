import { TopNavBar } from "@/components/TopNavBar";
import { Footer } from "@/components/Footer";

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
    </>
  );
}
