import Link from "next/link";

export default function PageIntrouvable() {
  return (
    <div className="flex min-h-ecran flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-balance text-[26px] font-extrabold leading-tight text-foreground">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-3 max-w-[44ch] text-[15px] leading-[1.5] text-muted-foreground">
        Le lien est peut-être ancien ou incomplet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-marque-rouge-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-marque-rouge-600"
      >
        Revenir à l&apos;accueil
      </Link>
    </div>
  );
}
