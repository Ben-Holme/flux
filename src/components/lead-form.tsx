"use client";

import { useState } from "react";
import Button from "@/components/button";

export default function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agreed) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 10000);
    setName("");
    setEmail("");
    setAgreed(false);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <p className="font-heading text-xl text-parchment">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-ash">We&apos;ll be in touch when the time comes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <p className="mb-6 text-xs tracking-[0.3em] text-white/60 uppercase font-heading">
        Stay in the loop
      </p>
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-white/20 bg-black/40 px-4 py-3 text-sm text-parchment placeholder-white/30 outline-none focus:border-gold/60"
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-white/20 bg-black/40 px-4 py-3 text-sm text-parchment placeholder-white/30 outline-none focus:border-gold/60"
        />
      </div>
      <label className="mb-6 flex items-start gap-3 text-xs text-ash">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
          className="mt-0.5 accent-gold"
        />
        I agree to receive updates about Unyha and accept the Privacy Policy.
      </label>
      <Button type="submit" variant="outline">
        NOTIFY ME
      </Button>
    </form>
  );
}
