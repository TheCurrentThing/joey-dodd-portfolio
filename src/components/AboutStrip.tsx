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
              alt="Digital tablet and stylus on an artist's desk"
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
                Built on fundamentals, shaped by industry experience.
              </h2>
            </div>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-200">
              Joey Dodd is a senior illustrator and concept artist specializing
              in character design, visual storytelling, and world-building. He
              spent over 15 years as a senior designer at Hasbro, contributing
              to the development of globally recognized brands and building a
              deep understanding of design, production, and visual storytelling
              at scale.
            </p>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-300">
              Joey studied at the American Academy of Art College in Chicago,
              where he developed a strong foundation in drawing, composition,
              and form, skills that continue to define his work today. Working
              professionally as an independent artist, he has created published
              work for major comic publishers including Marvel Comics and DC
              Comics.
            </p>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-300">
              His portfolio spans character design, illustration, product art,
              and conceptual development, blending strong fundamentals with
              imaginative execution. His work has also reached collectors
              through Sotheby's, placing it within one of the most respected
              art markets in the world.
            </p>
            <p className="about-animate font-sans text-body-lg font-light leading-relaxed text-neutral-300">
              In 2024, Joey created INK on Bitcoin, the top-selling NFT art
              collection of the year, establishing a strong presence in the
              emerging digital and collectible art space. Alongside his
              professional work, Joey is building a structured lesson platform
              focused on teaching foundational art skills to the next
              generation, helping students develop real ability, not shortcuts.
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
