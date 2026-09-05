import type { Metadata } from "next";
import { Flow, Heading, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <Flow as="article" className="mx-auto max-w-[800px] px-6 pt-[120px] pb-20">
      <Heading level="h1">Privacy Policy</Heading>
      <Text variant="muted">Last updated: September 2026</Text>

      <Heading level="h2">What we collect</Heading>
      <Text>
        When you create an account we collect your username, email address, and a hashed
        (non-recoverable) version of your password. If you choose to link Steam, we store
        your Steam ID. We also store in-game character data and website engagement data
        (spirit XP, achievements) associated with your account.
      </Text>

      <Heading level="h2">Why we collect it</Heading>
      <Text>
        Your data is used solely to operate the Unyha game and website. We do not sell your
        data, use it for advertising, or share it with third parties except as described below.
      </Text>

      <Heading level="h2">Third-party processors</Heading>
      <Text>
        We use the following services which may process your data as part of delivering Unyha:
        Vercel (hosting), Cloudflare (tunnel and DNS), Resend (transactional email), and
        Contentful (content management). Each operates under their own privacy policy and
        GDPR data processing agreements.
      </Text>

      <Heading level="h2">Your rights</Heading>
      <Text>
        Under GDPR you have the right to access, correct, export, or delete your personal data
        at any time. You can delete your account directly from your account page. For data
        access or export requests, contact us at{" "}
        <a href="mailto:benjamin.holme0@gmail.com" className="text-white/60 underline">
          benjamin.holme0@gmail.com
        </a>
        .
      </Text>

      <Heading level="h2">Cookies and local storage</Heading>
      <Text>
        We use browser local storage to track progress toward website achievements (e.g. wiki
        reading milestones). No advertising cookies or third-party trackers are used.
      </Text>

      <Heading level="h2">Data retention</Heading>
      <Text>
        Your data is retained for as long as your account is active. Deleting your account
        removes all associated data immediately and permanently.
      </Text>

      <Heading level="h2">Contact</Heading>
      <Text>
        Questions about this policy:{" "}
        <a href="mailto:benjamin.holme0@gmail.com" className="text-white/60 underline">
          benjamin.holme0@gmail.com
        </a>
      </Text>
    </Flow>
  );
}
