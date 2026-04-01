import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "@phosphor-icons/react";
import { REFERENCE_MEDIA } from "../lib/referenceMedia";

gsap.registerPlugin(ScrollTrigger);

export default function AboutStrip() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        const elements = sectionRef.current.querySelectorAll(".about-animate");
        gsap.fromTo(
          elements,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-secondary px-6 py-24 md:px-10 md:py-32"
      aria-label="About Joey Dodd"
    >
      <div className="mx-auto max-w-screen-xl">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="about-animate order-2 overflow-hidden rounded-md md:order-1">
            <img
              src={REFERENCE_MEDIA.aboutPortrait}
              alt="Artist portrait in studio"
              className="h-80 w-full object-cover object-top md:h-[500px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 flex flex-col gap-6 md:order-2">
            <div className="about-animate">
              <p className="mb-3 font-mono text-sm uppercase tracking-widest text-tertiary">
                About
              </p>
              <h2 className="mb-6 font-serif text-h2 text-foreground md:text-4xl">
                Crafting worlds, one stroke at a time.
              </h2>
            </div>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-200">
              Joey Dodd is a visual artist and illustrator specializing in
              character design, concept art, and world-building. With a passion
              for storytelling through imagery, Joey brings imagination to life
              with a distinctive blend of organic texture and cinematic
              atmosphere.
            </p>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-300">
              Working across traditional and digital mediums, each piece is
              crafted with intention, balancing technical precision with
              emotional resonance.
            </p>
            <div className="about-animate pt-2">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 font-sans text-label font-normal uppercase tracking-widest text-tertiary transition-colors duration-300 hover:text-foreground"
              >
                View Full Portfolio
                <ArrowRight size={18} weight="regular" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
