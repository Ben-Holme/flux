"use client";

import { useState } from "react";
import type { Entry } from "contentful";
import type { HeroSkeleton, SectionSkeleton } from "@/types/contentful";
import type { Document } from "@contentful/rich-text-types";
import Image from "next/image";
import Link from "next/link";
import VideoModal from "@/components/video-modal";
import HeroScene from "@/components/hero-scene";
import RichText from "@/components/rich-text";

const VIDEOS = [
  { name: "gameplay trailer", id: "okXJWVGoaeo" },
  { name: "lore trailer", id: "NlMpYQtuqao" },
];

function isHeroEntry(item: unknown): item is Entry<HeroSkeleton> {
  return (
    !!item &&
    typeof item === "object" &&
    "sys" in item &&
    "fields" in item &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item as any).sys?.contentType?.sys?.id === "title"
  );
}

function isSectionEntry(item: unknown): item is Entry<SectionSkeleton> {
  return (
    !!item &&
    typeof item === "object" &&
    "sys" in item &&
    "fields" in item &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item as any).sys?.contentType?.sys?.id === "section"
  );
}

function getAssetUrl(field: unknown): string | null {
  if (!field || typeof field !== "object" || !("fields" in field)) return null;
  const f = field as { fields: { file?: { url?: string } } };
  const url = f.fields.file?.url;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

function getAssetTitle(field: unknown): string {
  if (!field || typeof field !== "object" || !("fields" in field)) return "";
  const f = field as { fields: { title?: unknown } };
  return typeof f.fields.title === "string" ? f.fields.title : "";
}

interface HomePageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockItems: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts: any[];
}

export default function HomePageClient({ blockItems, posts }: HomePageClientProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState(VIDEOS[0].id);

  const openVideo = (id: string) => {
    setVideoId(id);
    setShowVideo(true);
  };

  return (
    <>
      <VideoModal
        isOpen={showVideo}
        videoId={videoId}
        videos={VIDEOS}
        onClose={() => setShowVideo(false)}
        onSelect={openVideo}
      />

      {/* ── Intro ──────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center bg-void px-6 py-24 text-center">
        {/* Unyha logo SVG */}
        <svg width="120" viewBox="0 0 240 245" className="mb-8 opacity-90">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M112.407 240.037V0.310547L127.767 14.7955V82.2457L140.335 70.3944V26.6468L155.696 41.1318V76.3942L127.767 102.731V131.992C127.271 132.131 126.793 132.29 126.356 132.466C123.05 133.797 122.791 134.342 123.885 137.633C124.674 140.005 125.866 141.273 127.242 141.204C127.424 141.195 127.6 141.189 127.767 141.187V179.86C126.397 192.946 125.307 205.024 125.289 207.403C125.228 215.738 123.249 228.365 121.861 229.28C121.112 229.774 119.074 229.937 117.331 229.643C114.456 229.156 114.129 229.591 113.785 234.361C113.617 236.71 113.043 238.99 112.407 240.037Z"
            fill="white"
          />
          <path
            d="M168.263 80.6368L183.624 66.1519L183.624 158.329L168.263 172.814V136.966L155.695 148.818L155.695 184.665L140.335 199.15L140.335 106.975L155.695 92.4898L155.695 128.333L168.263 116.482L168.263 80.6368Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M239.48 199.362V201.606C238.746 201.207 238.034 201.909 237.839 203.136C237.645 204.361 236.574 205.43 235.462 205.51C234.323 205.592 234.712 205.889 236.349 206.189C238.76 206.631 238.889 206.904 237.104 207.767C235.408 208.586 235.358 208.875 236.866 209.114C237.921 209.281 238.305 209.939 237.719 210.574C237.133 211.211 237.433 212.013 238.386 212.358C239.653 212.816 239.587 213.084 238.138 213.356C237.048 213.56 236.225 213.298 236.309 212.774C236.392 212.249 235.715 211.702 234.807 211.558C233.898 211.414 233.523 211.77 233.975 212.349C234.427 212.929 233.935 213.266 232.883 213.1C231.831 212.933 231.397 213.143 231.921 213.566C232.443 213.989 231.675 215.092 230.216 216.018C228.57 217.061 228.115 218.002 229.019 218.496C229.829 218.939 229.823 221.522 229.007 224.313C228.502 226.037 228.223 227.389 228.214 228.028L225.693 225.651C228.154 221.895 228.573 219.837 227.064 219.013C226.367 218.633 225.141 218.558 224.12 218.798V136.967L211.552 148.818L211.552 212.317L196.192 197.832L196.192 96.7296L239.48 55.9084V143.054C237.577 142.783 237.686 142.965 239.48 144.093V151.164C238.879 151.569 238.852 151.962 239.48 152.609V156.953C237.506 156.73 237.357 156.957 238.655 157.69C238.931 157.846 239.207 157.991 239.48 158.125V180.746C239.299 180.897 239.105 181.039 238.9 181.169C236.585 182.636 236.535 182.901 238.522 183.215C238.886 183.273 239.211 183.301 239.48 183.303V186.961C238.993 187.332 238.549 187.638 238.22 187.82C237.361 188.297 237.066 189.21 237.565 189.849C238.016 190.427 238.64 190.591 239.48 190.339V193.285C239.152 193.005 238.818 192.803 238.591 192.767C238.212 192.707 237.838 193.064 237.76 193.559C237.681 194.054 238.361 194.578 239.27 194.722C239.344 194.733 239.414 194.742 239.48 194.747V195.95C238.367 195.563 237.428 195.648 237.346 196.165C237.259 196.713 237.932 197.28 238.841 197.424C239.117 197.467 239.332 197.54 239.48 197.631V199.362ZM211.552 128.333L224.12 116.482V90.8781L211.552 102.729V128.333Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M56.5509 192.563L71.9114 178.078V115.897L84.4791 104.045V212.316L98.8575 198.757C98.156 197.164 98.1097 193.143 98.7814 189.182C100.087 181.481 99.72 178.567 97.3947 178.174C95.5011 177.853 91.5527 183.157 92.3505 184.947C92.73 185.801 92.2479 186.64 91.2761 186.812C90.0896 187.021 89.8525 185.109 90.5515 180.986C91.8994 173.036 93.4007 146.137 92.638 143.609C92.158 142.024 92.396 141.935 93.9041 143.13C95.8362 144.661 99.2132 145.538 99.8397 144.767V132.545V69.0756L56.5509 109.897L56.5509 192.563Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.694336 201.842V52.9823L16.0549 67.4673V204.14C13.9897 204.398 12.5714 204.008 11.0848 202.778C8.42729 200.581 6.59014 200.268 3.86714 201.549C2.3774 202.25 1.33984 202.364 0.694336 201.842Z"
            fill="white"
          />
        </svg>

        <div className="mb-8 font-heading text-sm tracking-[0.4em] text-white/50 uppercase">
          Medieval Goth
          <br />
          Autochronicle
          <br />
          Online RPG
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => openVideo(VIDEOS[0].id)}
            className="flex items-center gap-3 bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-void transition-opacity hover:opacity-80"
          >
            <svg className="h-4 w-4" viewBox="0 0 576 512" fill="currentColor">
              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
            </svg>
            Gameplay Trailer
          </button>
          <a
            href="https://store.steampowered.com/app/2712710/Unyha/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-white/30 px-7 py-3 text-sm tracking-widest text-parchment/80 transition-colors hover:border-white/60 hover:text-parchment"
          >
            <svg className="h-4 w-4" viewBox="0 0 496 512" fill="currentColor">
              <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.6-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.9-32.4 70.2-73.5l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.9-5.4-26.7-5.2-38.9-.6l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.8 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z" />
            </svg>
            Wishlist on Steam
          </a>
        </div>
      </section>

      {/* ── Block list (heroes + sections from Contentful) ──── */}
      {blockItems.map((item, i) => {
        if (isHeroEntry(item)) {
          return (
            <HeroScene
              key={item.sys.id}
              scene={item.fields.scene as number}
              preHeading={item.fields.preHeading as string | undefined}
              copy={item.fields.copy as Document | undefined}
              onShowLoreVideo={
                item.fields.scene === 1 ? () => openVideo(VIDEOS[1].id) : undefined
              }
            />
          );
        }
        if (isSectionEntry(item)) {
          const imgUrl = getAssetUrl(item.fields.image);
          const imgAlt = getAssetTitle(item.fields.image);
          const isReversed = i % 2 !== 0;
          return (
            <div
              key={item.sys.id}
              className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 lg:flex-row lg:items-center"
              style={isReversed ? { flexDirection: "row-reverse" } : undefined}
            >
              {imgUrl && (
                <div className="relative h-72 w-full flex-1 overflow-hidden lg:h-96">
                  <Image src={imgUrl} alt={imgAlt} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                {item.fields.preHeading && (
                  <p className="mb-3 text-xs font-heading tracking-[0.3em] text-gold uppercase">
                    {item.fields.preHeading as string}
                  </p>
                )}
                {item.fields.title && (
                  <h2 className="mb-4 font-heading text-3xl text-parchment">
                    {item.fields.title as string}
                  </h2>
                )}
                {item.fields.content && (
                  <RichText document={item.fields.content as Document} />
                )}
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* ── News preview ────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="border-t border-border bg-surface py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <svg
                  width="285"
                  height="12"
                  viewBox="0 0 285 12"
                  fill="none"
                  className="mb-3"
                >
                  <path
                    opacity="0.3"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 0L6 0L6 9.5L8 9.5L8 2.5L14 2.5V5.5L284.04 5.5V7.5L12 7.5L12 4.5L10 4.5L10 11.5L4 11.5L4 2L2 2L2 11.5H0L0 0Z"
                    fill="url(#news-line)"
                  />
                  <defs>
                    <linearGradient
                      id="news-line"
                      x1="1"
                      y1="6.25"
                      x2="284.04"
                      y2="6.25"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="white" />
                      <stop offset="1" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className="mb-1 text-xs font-heading tracking-[0.3em] text-gold uppercase">
                  Latest
                </p>
                <h2 className="font-heading text-3xl text-parchment">News</h2>
              </div>
              <Link
                href="/devlog"
                className="text-sm tracking-widest text-ash transition-colors hover:text-parchment"
              >
                MORE NEWS →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const thumb = getAssetUrl(post.fields?.image);
                const thumbAlt = getAssetTitle(post.fields?.image);
                return (
                  <Link
                    key={post.sys.id}
                    href={`/devlog/${post.fields?.slug}`}
                    className="group flex flex-col border border-border bg-surface-raised transition-colors hover:border-gold/40"
                  >
                    {thumb && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={thumb}
                          alt={thumbAlt}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="mb-1 text-xs font-heading tracking-wider text-gold uppercase">
                        {post.fields?.categry?.fields?.name ?? "news"}
                      </p>
                      <h3 className="mb-2 font-heading text-base leading-snug text-parchment">
                        {post.fields?.title}
                      </h3>
                      {post.fields?.short && (
                        <p className="mt-auto line-clamp-2 text-sm leading-6 text-ash">
                          {post.fields.short}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/devlog"
                className="border border-white/20 px-8 py-3 text-sm tracking-widest text-parchment/70 transition-colors hover:border-white/50 hover:text-parchment"
              >
                MORE NEWS
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Final hero (The Black Mine) with lead form ─────── */}
      <HeroScene scene={3} />
    </>
  );
}
