import { redirect } from "next/navigation"
import { needsOnboarding } from "@/src/domains/onboarding/needs-onboarding"
import { SignInForm } from "@/src/domains/auth/sign-in-form"

export const dynamic = "force-dynamic"

export default async function SignInPage() {
  if (await needsOnboarding()) {
    redirect("/onboarding")
  }

  return (
    <div className="flex min-h-svh">
      <div className="hidden flex-1 flex-col justify-between bg-[#09090b] p-14 text-[#fafafa] lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff7ed"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">necroshift</span>
        </div>
        <div className="flex max-w-md flex-col gap-5">
          <h1 className="text-4xl font-semibold tracking-tight">Your on-call engineer, always awake.</h1>
          <p className="text-[#a1a1aa] text-base leading-relaxed">
            Necroshift centralizes your logs and crash reports, then investigates failures, drafts a fix in a
            sandbox, and opens a pull request — before you even wake up.
          </p>
        </div>
        <p className="text-[#71717a] text-sm">Self-hosted · Open source</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold">Sign in to Necroshift</h2>
            <p className="text-muted-foreground text-sm">Access your deployment&apos;s dashboard.</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  )
}
