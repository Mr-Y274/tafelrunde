import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap py-24">
      <p className="kicker">404</p>
      <h1 className="title mt-3">Dieser Stuhl ist leer.</h1>
      <Link className="btn btn-solid mt-6" href="/">
        Zur Tür
      </Link>
    </main>
  );
}
