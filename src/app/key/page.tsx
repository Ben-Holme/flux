"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Button from "@/components/button";

const UNYHA_LOGO = (
  <svg width="180" viewBox="0 0 240 245" fill="white">
    <path fillRule="evenodd" clipRule="evenodd" d="M112.407 240.037V0.310547L127.767 14.7955V82.2457L140.335 70.3944V26.6468L155.696 41.1318V76.3942L127.767 102.731V131.992C127.271 132.131 126.793 132.29 126.356 132.466C123.05 133.797 122.791 134.342 123.885 137.633C124.674 140.005 125.866 141.273 127.242 141.204C127.424 141.195 127.6 141.189 127.767 141.187V179.86C126.397 192.946 125.307 205.024 125.289 207.403C125.228 215.738 123.249 228.365 121.861 229.28C121.112 229.774 119.074 229.937 117.331 229.643C114.456 229.156 114.129 229.591 113.785 234.361C113.617 236.71 113.043 238.99 112.407 240.037Z" />
    <path d="M124.174 240.726L120.244 244.433C119.237 240.002 118.372 234.386 118.677 232.591C118.825 231.715 119.732 232.042 121.72 233.687C123.58 235.225 124.241 236.944 124.174 240.726Z" />
    <path d="M127.767 230.703V234.51C126.619 233.577 125.736 232.194 126.332 231.56C126.704 231.166 127.249 230.853 127.767 230.703Z" />
    <path d="M168.263 80.6368L183.624 66.1519L183.624 158.329L168.263 172.814V136.966L155.695 148.818L155.695 184.665L140.335 199.15L140.335 106.975L155.695 92.4898L155.695 128.333L168.263 116.482L168.263 80.6368Z" />
  </svg>
);

function KeyContent() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const steamUrl = "https://store.steampowered.com/";

  return (
    <>
      {/* Hero intro */}
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[url(/img/hero.png)] bg-cover bg-center">
        {UNYHA_LOGO}
        <div className="-mt-[20vh] text-center font-heading text-[1.3em] uppercase leading-[1.2] tracking-[0.2em] text-white">
          Medieval Goth<br />Autochronicle<br />Online RPG
        </div>
        <div className="-mt-16 text-center">
          <h2
            className="mb-2 mt-0 block font-heading text-base uppercase tracking-[0.2em] text-[#ffd98f]"
            style={{ textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }}
          >
            Your beta key
          </h2>
          <div className="rounded-xl bg-black/60 px-8 py-6 font-heading text-[30px] tracking-[0.5em] backdrop-blur-[15px]">
            {key || "No key provided in URL. Add ?key=YOUR_KEY to this page URL."}
          </div>
        </div>
      </div>

      {/* Detail section */}
      <div className="mx-auto max-w-[980px] px-6 pt-[140px] pb-20">
        <div
          className="mb-6 flex items-center gap-2 font-heading text-base uppercase tracking-[0.2em] text-[#ffd98f]"
          style={{ textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }}
        >
          <p className="mt-0">exclusive dev invitation</p>
          <svg width="285" height="12" viewBox="0 0 285 12" fill="none">
            <path opacity="0.3" fillRule="evenodd" clipRule="evenodd" d="M0 0L6 0L6 9.5L8 9.5L8 2.5L14 2.5V5.5L284.04 5.5V7.5L12 7.5L12 4.5L10 4.5L10 11.5L4 11.5L4 2L2 2L2 11.5H0L0 0Z" fill="url(#key-line)" />
            <defs>
              <linearGradient id="key-line" x1="1" y1="6.25" x2="284.04" y2="6.25" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="mb-[0.3em]">Welcome to the Unyha Dev Beta</h1>
        <p>
          You are invited to an early build of Unyha. This page is your private access handoff. Keep your key and the beta password private.
        </p>

        <div className="relative mt-7 mb-9 rounded-lg bg-[#111] p-7">
          <h2 className="mt-0 mb-[0.4em]">Your Invite Key</h2>
          <p className="mb-[0.6em] opacity-70">Use this when asked for your access key:</p>
          <p className="mt-0 break-all rounded-[6px] bg-accent/[0.09] px-4 py-3.5 text-[1.2rem] tracking-[0.06em]">
            {key || "No key provided in URL. Add ?key=YOUR_KEY to this page URL."}
          </p>
        </div>

        <h2>How to Join the Dev Beta on Steam</h2>
        <ol>
          <li>Open your Steam Library and select Unyha.</li>
          <li>Right-click the game, choose Properties, then open the Betas tab.</li>
          <li>In Private Betas, enter this password exactly: <strong>huddingelan1997</strong>.</li>
          <li>Select the dev beta branch from the dropdown list.</li>
          <li>Let Steam finish updating, then launch the game.</li>
        </ol>

        <div className="mt-7 flex flex-wrap justify-center gap-4">
          <Button href={steamUrl} variant="primary" external>Open Steam</Button>
          <Button href="/wiki">Open Wiki</Button>
          <Button href="/devlog">Read Devlog</Button>
        </div>

        <h2 className="mt-11">Invitation Message</h2>
        <p>
          Thanks for stepping into the dev beta. You are helping shape the direction of Unyha before release.
          Test freely, break things, and share what feels good and what does not.
        </p>
        <p>
          If you get stuck, begin with the <Link href="/wiki">Wiki</Link>. For updates and patch context, check the <Link href="/devlog">Devlog</Link>.
        </p>
      </div>
    </>
  );
}

export default function KeyPage() {
  return (
    <Suspense fallback={null}>
      <KeyContent />
    </Suspense>
  );
}
