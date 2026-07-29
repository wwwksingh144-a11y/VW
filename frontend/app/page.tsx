import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import AboutVision from "@/components/sections/AboutVision";
import Services from "@/components/sections/Services";
import Work from "@/components/sections/Work";
import FeaturedVideosSection from "@/components/sections/FeaturedVideosSection";
import Insights from "@/components/sections/Insights";
import Contact from "@/components/sections/Contact";
import { getCompletedVideos } from "@/app/actions/videos";
import { getSettings } from "@/app/actions/settings";

export const revalidate = 3600;

async function FeaturedVideosLoader() {
  let dbVideos: any[] = [];
  let settings: any = {};
  try {
    dbVideos = await getCompletedVideos();
    settings = await getSettings();
  } catch (err) {
    console.error("Failed to fetch data for homepage:", err);
  }
  return <FeaturedVideosSection dbVideos={dbVideos} settings={settings} />;
}

export default function Home() {
  return (
    <>
      <Hero />
      <AboutVision />
      <Services />
      <Work />
      <Suspense fallback={<FeaturedVideosSection dbVideos={[]} settings={{}} />}>
        <FeaturedVideosLoader />
      </Suspense>
      <Insights />
      <Contact />
    </>
  );
}
