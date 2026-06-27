"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Form = { email: string; password: string };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>();

  async function onSubmit(values: Form) {
    setError(null);
    const { error } = await signIn.email({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    if (error) {
      setError(error.message ?? "We couldn't sign you in. Check your email and password.");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* Brand panel — the class stage in miniature */}
      <div className="brand-gradient relative hidden flex-col justify-between p-10 text-white lg:flex">
        <Brand tone="light" />
        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-bold leading-[1.1]">
            Take attendance
            <br />
            in seconds.
          </h1>
          <p className="max-w-sm text-white/70">
            Project a code on the screen, students scan it with their phone. No paper, no
            roll-call, no signing in for absent friends.
          </p>
        </div>
        <p className="text-xs text-white/50">University of Jordan · Summer Course</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              For professors and course staff. Don't have an account? Ask the course admin to add
              you.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@ju.edu.jo"
                {...register("email", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password", { required: true })}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
