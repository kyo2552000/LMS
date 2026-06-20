import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata: Metadata = {
  title: "EduLearn - Nền tảng học trực tuyến",
  description: "Nâng cao kỹ năng với các khóa học trực tuyến toàn diện của chúng tôi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
              <ChatBot />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

