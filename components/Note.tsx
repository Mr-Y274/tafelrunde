export function Note({ banner, log }: { banner: string; log: string[] }) {
  return (
    <div>
      <p className="banner text-lg" aria-live="polite">
        {banner}
      </p>
      <ul className="mt-4 max-h-40 space-y-1 overflow-auto text-sm opacity-70">
        {[...log].reverse().map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
