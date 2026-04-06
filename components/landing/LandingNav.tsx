"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#pricing", label: "Pricing" },
  { href: "/trust", label: "Trust" },
  { href: "#contact", label: "Contact" },
] as const;

export function LandingNav({ authenticated = false }: { authenticated?: boolean }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300",
        scrolled
          ? "border-white/10 bg-neutral-900/80 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          : "border-transparent bg-black/30 backdrop-blur-sm",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/home"
          className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-white transition hover:text-neutral-200"
        >
          <Image
            src="/avatars/logo.jpg"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-md object-contain"
            priority
          />
          <span>NULLXES</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {authenticated ? (
            <Link
              href="/ai-digital"
              className="text-sm text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white/60"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={cn("text-sm", linkClass)}>
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white/60"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {authenticated ? (
            <Link
              href="/ai-digital"
              className="text-xs font-medium text-white underline decoration-white/30 underline-offset-4"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="text-xs font-medium text-white underline decoration-white/30 underline-offset-4"
            >
              Sign up
            </Link>
          )}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="border-white/20 bg-black/40 text-white hover:bg-white/10"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-white/10 bg-neutral-950 text-white"
            >
              <SheetHeader>
                <SheetTitle className="text-left text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1 px-2">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-3 text-base text-neutral-300 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setSheetOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                {!authenticated ? (
                  <Link
                    href="/sign-in"
                    className="rounded-lg px-3 py-3 text-base text-neutral-300 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setSheetOpen(false)}
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
