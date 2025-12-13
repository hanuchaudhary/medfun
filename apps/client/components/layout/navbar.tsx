"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@/hooks/use-wallet";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import WalletModal from "./wallet-sheet";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Plus } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [hasShownInitialModal, setHasShownInitialModal] =
    useState<boolean>(false);
  const [isManualConnection, setIsManualConnection] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { connected, publicKey, connect, disconnect, connecting } = useWallet();
  const { ready, authenticated, login } = usePrivy();
  useEffect(() => {
    const fetchWalletAddress = async () => {
      let addressStr: string | undefined;
      if (publicKey) {
        addressStr = publicKey.toString();
      }

      setWalletAddress(addressStr || "");
    };

    fetchWalletAddress();
  }, [publicKey]);

  useEffect(() => {
    console.log(publicKey);
    if (connected && isManualConnection && !hasShownInitialModal) {
      setShowWalletModal(true);
      setHasShownInitialModal(true);
      setIsManualConnection(false);
    }
  }, [connected, isManualConnection, hasShownInitialModal]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowWalletModal(false);
      setHasShownInitialModal(false);
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const handleWalletClick = async () => {
    if (connected) {
      setShowWalletModal(true);
    } else {
      if (authenticated) {
        // User is already authenticated, just show the wallet modal
        setShowWalletModal(true);
        return;
      }

      setIsManualConnection(true);
      try {
        await login();
      } catch (error) {
        console.error("Wallet connection error:", error);
        toast.error("Failed to open wallet selection", {
          description: "Please try again",
          duration: 4000,
        });
        setIsManualConnection(false);
      }
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getButtonText = () => {
    if (connected && walletAddress) {
      return formatAddress(walletAddress);
    }

    if (connecting) {
      return "Connecting...";
    }

    return "Connect Wallet";
  };

  const navLinks = [
    { href: "/coins", label: "Tokens" },
    { href: "/profile", label: "Profile" },
    { href: "/create", label: "Create" },
    // { href: "/migrate", label: "Dev" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="">
        <div className="relative w-full">
          <div className="flex items-center justify-end py-2 px-6">
            <nav className="hidden md:flex items-center gap-3 h-full">
              <ThemeToggle />
              <Button
                className="bg-primary hover:bg-primary/90 rounded-sm text-sm text-background font-semibold py-3 px-6"
                onClick={connecting ? undefined : handleWalletClick}
                disabled={connecting}
              >
                {getButtonText()}
              </Button>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90 text-background font-semibold">
                  <Plus className="h-5 w-5" />
                  Create coin
                </Button>
              </Link>
            </nav>

            <div className="flex md:hidden items-center gap-2 mr-4">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-accent transition-colors z-50"
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-2 z-50">
                  <motion.span
                    className={`w-6 h-0.5 bg-primary transition-transform duration-200 ${
                      isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                    }`}
                  />
                  <motion.span
                    className={`w-6 h-0.5 bg-primary transition-transform duration-200 ${
                      isMobileMenuOpen ? "rotate-135 -translate-y-1" : ""
                    }`}
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                onClick={handleMobileMenuClose}
              />

              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-[73px] left-0 right-0 bg-background border-b z-50 md:hidden overflow-y-auto max-h-[calc(100vh-73px)]"
              >
                <nav className="flex flex-col">
                  <div className="flex flex-col divide-y">
                    {navLinks.map((link, index) => {
                      const isActive = pathname === link.href;
                      return (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          <Link
                            href={link.href}
                            onClick={handleMobileMenuClose}
                            className={`flex items-center px-6 py-5 text-base font-medium transition-colors ${
                              isActive
                                ? "text-primary bg-accent"
                                : "text-muted-foreground hover:text-primary hover:bg-accent"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-auto p-6 border-t"
                  >
                    <Button
                      className="w-full bg-primary border-none rounded-none py-6 text-base"
                      onClick={() => {
                        if (!connecting) {
                          handleWalletClick();
                        }
                        handleMobileMenuClose();
                      }}
                      disabled={connecting}
                    >
                      {getButtonText()}
                    </Button>
                  </motion.div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
      <WalletModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        disconnect={handleDisconnect}
      />
    </>
  );
}
