import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <main className="phone-screen mx-auto min-h-dvh w-full max-w-xl px-5 py-10">
      <p className="text-xs font-semibold tracking-widest text-pine uppercase">Axiom</p>
      <h1 className="mt-2 font-serif text-4xl">Privacy</h1>
      <p className="mt-4 text-sm text-muted">
        This is the policy for the Axiom website and the iOS and Android apps. The store filings use this page.
      </p>
      <h2 className="mt-8 font-serif text-2xl">What we store</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
        <li>Your email, a password hash, and the name you choose.</li>
        <li>Learning progress: lessons, streak, hearts, placement, language, colors, and companion.</li>
        <li>A workspace membership, if you create or join one, and the desk’s questions, notes, and sponsor cards.</li>
      </ul>
      <h2 className="mt-8 font-serif text-2xl">What we do not do</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
        <li>We do not sell personal information.</li>
        <li>We do not use a third-party advertising network or an advertising identifier.</li>
        <li>Sponsor cards are written by the workspace. Claiming one is stored so it can be limited to once a day.</li>
      </ul>
      <h2 className="mt-8 font-serif text-2xl">Where it lives</h2>
      <p className="mt-2 text-sm">
        The published app keeps this in a hosted Postgres database. The private preview keeps it in memory and drops it on restart.
      </p>
      <h2 className="mt-8 font-serif text-2xl">Delete your account</h2>
      <p className="mt-2 text-sm">
        Signed-in users can delete the account from the You tab. That removes the login and the learning record tied to it. This cannot be undone.
      </p>
      <p className="mt-8">
        <Link to="/login" className="font-semibold text-pine">
          Back
        </Link>
      </p>
    </main>
  );
}
