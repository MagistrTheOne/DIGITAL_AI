"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldClass =
  "border-neutral-700 bg-neutral-900/70 text-neutral-100 placeholder:text-neutral-600 focus-visible:border-neutral-500 focus-visible:ring-white/20";

const TOPICS = [
  { value: "general", label: "General" },
  { value: "partnerships", label: "Partnerships" },
  { value: "enterprise", label: "Enterprise" },
  { value: "govtech", label: "GovTech" },
  { value: "other", label: "Other" },
] as const;

export function LandingContactPanel() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [topic, setTopic] = React.useState<string>("general");
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          website: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setTopic("general");
      setMessage("");
      setHoneypot("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Try again or email us directly.");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 xl:max-w-7xl xl:gap-20 lg:items-center">
      <div className="space-y-8 lg:space-y-10">
        <div className="text-left">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Reach the team
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.25rem] lg:leading-[1.05] xl:text-6xl">
            Contact
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-neutral-400 sm:text-lg">
            Leadership, engineering, and partnerships — reach us directly. For
            enterprise and GovTech, use the pricing mailto links or write here.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="border-white/10 bg-neutral-950/80 text-neutral-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">CEO</CardTitle>
              <CardDescription className="text-neutral-500">
                Strategy and partnerships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:ceo@nullxes.com?subject=NULLXES%20inquiry"
                className="text-sm font-medium text-white underline decoration-white/35 underline-offset-4 transition hover:decoration-white"
              >
                ceo@nullxes.com
              </a>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-neutral-950/80 text-neutral-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Engineering
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Product and technical intake
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:devpos@nullxes.com?subject=NULLXES%20inquiry"
                className="text-sm font-medium text-white underline decoration-white/35 underline-offset-4 transition hover:decoration-white"
              >
                devpos@nullxes.com
              </a>
            </CardContent>
          </Card>
        </div>

        <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
          We read every message. Typical response within a few business days.
          Submissions from the form are delivered to our leadership inbox by
          email so nothing gets lost in a queue.
        </p>
      </div>

      <Card className="border-white/10 bg-neutral-950/85 text-neutral-100 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-lg text-white">Send a message</CardTitle>
          <CardDescription className="text-neutral-500">
            Include enough context for a useful first reply.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {status === "success" ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-neutral-300">
                Thanks — your message is on its way. If you do not hear back
                within a few business days, email{" "}
                <a
                  className="text-white underline decoration-white/35 underline-offset-4"
                  href="mailto:devpos@nullxes.com"
                >
                  devpos@nullxes.com
                </a>{" "}
                directly.
              </p>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-neutral-100 hover:bg-white/10"
                onClick={() => setStatus("idle")}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-neutral-400">
                    Name
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(fieldClass)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-neutral-400">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(fieldClass)}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-topic" className="text-neutral-400">
                  Topic
                </Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger
                    id="contact-topic"
                    className={cn("h-9 w-full", fieldClass)}
                  >
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-neutral-950 text-neutral-100">
                    {TOPICS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-neutral-400">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn("min-h-36 resize-y", fieldClass)}
                  placeholder="What you are trying to solve, timeline, and any constraints (security, region, volume) help us respond faster."
                />
              </div>

              <div className="hidden" aria-hidden>
                <Label htmlFor="contact-website">Website</Label>
                <Input
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {status === "error" && errorMessage ? (
                <p className="text-sm text-red-400/90" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-white text-neutral-950 hover:bg-neutral-200 sm:w-auto"
              >
                {status === "loading" ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
