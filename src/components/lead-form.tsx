"use client";

import { useState } from "react";
import styles from "./lead-form.module.css";

export default function LeadForm() {
  const [state, setState] = useState<Record<string, string>>({});
  const [thanks, setThanks] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, consent: e.target.checked ? "on" : "" }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.didPost !== state.email) {
      setState((prev) => ({ ...prev, didPost: prev.email }));
      setThanks(true);
      setTimeout(() => setThanks(false), 10000);
    }
  };

  return (
    <div className={styles.wrapper} id="form">
      <div className={styles.thanks} style={{ opacity: thanks ? 1 : 0 }}>
        <h2 style={{ padding: "0 24px" }}>Thanks, we&apos;ll be in touch!</h2>
      </div>
      <h2 style={{ maxWidth: "700px" }}>
        Join us, sign up, &amp; get early access!
      </h2>
      <form name="contact" onSubmit={handleSubmit}>
        <p>
          We&apos;re still early in the process of finalizing Unyha for a first beta release. But
          you can sign up below to stay updated with our progress, join discussions, give feedback,
          and get early access to play!
        </p>
        <div style={{ height: "40px" }} />
        <input
          type="text"
          name="name"
          placeholder="Your name"
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          required
          placeholder="E-mail"
          onChange={handleChange}
        />
        <label>
          <input type="checkbox" name="consent" required onChange={handleCheckbox} />
          <div className={styles.checker} />
          <div>
            I have read and agree to&nbsp;
            <a target="_blank" href="/privacy-policy" rel="noopener noreferrer">
              the privacy terms
            </a>
            .
          </div>
        </label>
        <button
          style={{ visibility: thanks ? "hidden" : "visible" }}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
}
