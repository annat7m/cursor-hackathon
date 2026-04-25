import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Browser VM Launcher",
  description: "Spin up disposable Linux environments in your browser."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="topbar">
            <div className="brand">
              <div className="brandTitle">Browser VM Launcher</div>
              <div className="brandSub">Choose a template → Start → use Linux in your browser</div>
            </div>
            <div className="pill">Hackathon MVP</div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}

