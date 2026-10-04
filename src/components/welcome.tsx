import { Mark } from "@/components/mark";
import { Quill } from "@/components/quill";

export function Splash() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <Quill mood="greet" className="h-36" label="Quill" />
      <div className="mt-4 flex items-center gap-2">
        <Mark />
        <p className="text-xs font-semibold tracking-widest text-pine uppercase">Axiom</p>
      </div>
      <h1 className="mt-2 font-serif text-4xl">Daily practice for how AI works.</h1>
    </main>
  );
}
