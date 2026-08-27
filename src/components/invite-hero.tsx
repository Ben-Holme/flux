"use client";

import { useState } from "react";
import { Eyebrow, Heading, Text, Flow } from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";
import VideoModal from "@/components/video-modal";

const VIDEOS = [
  { name: "gameplay trailer", id: "okXJWVGoaeo" },
  { name: "lore trailer", id: "NlMpYQtuqao" },
];

const YT_ICON = (
  <svg viewBox="0 0 576 512" fill="currentColor">
    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
  </svg>
);

export function InviteHero() {
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

      <section className="bg-void relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[480px] md:h-full">
          <HeroVideo />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#000", opacity: 0.35 }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#00a2ff", mixBlendMode: "color", opacity: 0.3 }}
        />

        <div className="relative mx-auto box-content flex min-h-screen max-w-[1200px] items-center px-6 max-md:min-h-0 max-md:flex-col max-md:items-stretch">
          <div className="h-[380px] md:hidden" />
          <Flow className="ml-auto max-w-lg pt-[120px] pb-12 max-md:ml-0 max-md:pt-0">
            <Eyebrow deco>Unyha · Early Access Invite</Eyebrow>
            <Heading level="h1">The Golden City</Heading>
            <Text>
              That&apos;s what they call Midaen in the taverns now — a mountain mining town
              that&apos;s swallowed a kingdom&apos;s coin and has nothing to show for it.
              Best-funded wall in the land, and not a stone laid.
            </Text>
            <Text>
              The North Warden has been taking the coin for himself, it seems. It wouldn&apos;t be
              the first time.
            </Text>
            <Text>
              But some say it went north for something else entirely — past the last honest road.
            </Text>
            <Text>
              <strong>Into orc lands.</strong>
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => openVideo(VIDEOS[0].id)}>
                {YT_ICON}
                Gameplay Trailer
              </Button>
              <Button href="/register">Sign Up</Button>
            </div>
          </Flow>
        </div>
      </section>
    </>
  );
}
