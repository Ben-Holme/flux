import type { Metadata } from "next";
import DSContent from "./content";

export const metadata: Metadata = {
  title: "Design System — Unyha",
};

export default function DesignSystemPage() {
  return <DSContent />;
}
