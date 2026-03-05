import { ThemeProvider } from "@/src/components/theme/ThemeProvider";
import "./globals.css";
import { Toaster } from "sonner";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}