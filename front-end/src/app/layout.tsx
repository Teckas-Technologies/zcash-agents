import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css"
import "@near-wallet-selector/modal-ui/styles.css"
import "@near-wallet-selector/account-export/styles.css"
import "./globals.css";

import { config } from "@/config/wagmi"
import queryClient from "@/constants/queryClient"
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { WalletSelectorProvider } from "@/providers/WalletSelectorProvider";
import { SolanaWalletProvider } from "@/providers/SolanaWalletProvider";
import { DEV_MODE } from "@/utils/environment";
import { InitDefuseSDK } from "@/Components/InitDefuseSDK";
import { WebAuthnProvider } from "@/features/webauthn/providers/WebAuthnProvider";
import { SentryTracer } from "@/Components/SentryTracer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Near X Zcash AI Agents",
  description: "We are providing specialized ai agents for trade, deposit, swap & withdraw on top of NEAR Intents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <InitDefuseSDK />

        <ThemeProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <WalletSelectorProvider>
                <SolanaWalletProvider>
                  <WebAuthnProvider>
                    {children}
                  </WebAuthnProvider>

                  <SentryTracer />
                </SolanaWalletProvider>
              </WalletSelectorProvider>
              {DEV_MODE && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
