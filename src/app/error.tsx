"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PageEnErreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-ecran flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-balance text-[26px] font-extrabold leading-tight text-foreground">
        Quelque chose n&apos;a pas marché
      </h1>
      <p className="mt-3 max-w-[44ch] text-[15px] leading-[1.5] text-muted-foreground">
        Réessaie dans un instant. Si ça recommence, reviens à l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-marque-rouge-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-bordure-forte px-6 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50"
        >
          Revenir à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
