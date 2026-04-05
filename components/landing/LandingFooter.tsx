import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <p className="font-semibold text-white">NULLXES</p>
        <p className="mt-2 text-sm text-neutral-500">
          AI digital workforce platform.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-neutral-400">
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
          <Link href="/trust" className="transition hover:text-white">
            Trust
          </Link>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
          <a href="#contact" className="transition hover:text-white">
            Contact
          </a>
        </div>
        <p className="mt-12 text-xs text-neutral-600">
          © 2026 NULLXES. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
