import { WizardForm } from "@/components/app/WizardForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Intent Wizard</h1>
        <p className="text-muted-foreground">Transform your ideas into structured TaskSpecs</p>
      </div>
      
      <WizardForm />
    </main>
  );
}