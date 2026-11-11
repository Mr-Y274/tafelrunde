"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap py-24">
      <p className="kicker">Unterbrechung</p>
      <h1 className="font-display mt-3 text-5xl">Der Tisch wackelt.</h1>
      <p className="mt-4 max-w-md text-paper/80">{error.message}</p>
      <button className="btn btn-solid mt-6" onClick={reset}>
        Nochmal
      </button>
    </main>
  );
}
