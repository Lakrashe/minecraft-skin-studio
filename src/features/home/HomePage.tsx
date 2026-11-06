import { CharactersSection } from './CharactersSection';
import { FeaturesSection } from './FeaturesSection';
import { HeroSection } from './HeroSection';
import { AccuracySection, FaqSection, FinalCta } from './InfoSections';

/**
 * Landing page. Community sections (featured/trending skins, creators,
 * statistics, testimonials) are added in Phase 4 once real data exists
 * (decision D4) — no placeholder content.
 */
export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CharactersSection />
      <AccuracySection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
