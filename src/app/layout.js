import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata = {
  title: "Tamowil Delivery - Admin Dashboard",
  description: "Tamowil Delivery Express Shipment Management Admin Panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning={true}>
    <head><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script></head>

      <body suppressHydrationWarning={true}>
        <AppProvider>
          <div className="liquid-bg-container">
            <div className="blob blob-cyan"></div>
            <div className="blob blob-purple"></div>
            <div className="blob blob-green"></div>
          </div>
          <div className="blur-overlay"></div>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
