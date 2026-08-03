import { SignIn } from "@clerk/nextjs";

import { PublicHeader } from "@/components/public-header";

export default function SignInPage() {
  return (
    <main className="min-h-[100dvh] bg-muted/40">
      <PublicHeader />
      <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-4 py-12">
        <SignIn />
      </div>
    </main>
  );
}
