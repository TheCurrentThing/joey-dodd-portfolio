import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";

gsap.registerPlugin(ScrollTrigger);

export default function AboutStrip() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        const els = sectionRef.current.querySelectorAll(".about-animate");
        gsap.fromTo(
          els,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 px-6 md:px-10 bg-secondary"
      aria-label="About Joey Dodd"
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Portrait */}
          <div className="about-animate order-2 md:order-1 overflow-hidden rounded-md">
            <img
              src="https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_2.png"
              alt="Artist portrait in studio"
              className="w-full h-80 md:h-[500px] object-cover object-top"
              loading="lazy"
            />
          </div>

          {/* Bio */}
          <div className="order-1 md:order-2 flex flex-col gap-6">
            <div className="about-animate">
              <p className="font-mono text-label uppercase tracking-widest text-tertiary text-sm mb-3">
                About
              </p>
              <h2 className="font-serif text-foreground text-h2 md:text-4xl mb-6">
                Crafting worlds, one stroke at a time.
              </h2>
            </div>
            <p className="about-animate font-sans text-neutral-200 text-body-lg font-light leading-relaxed">
              Joey Dodd is a visual artist and illustrator specializing in
              character design, concept art, and world-building. With a passion
              for storytelling through imagery, Joey brings imagination to life
              with a distinctive blend of organic texture and cinematic
              atmosphere.
            </p>
            <p className="about-animate font-sans text-neutral-300 text-body-lg font-light leading-relaxed">
              Working across traditional and digital mediums, each piece is
              crafted with intention — balancing technical precision with
              emotional resonance.
            </p>
            <div className="about-animate pt-2">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 font-sans font-normal uppercase tracking-widest text-label text-tertiary hover:text-foreground transition-colors duration-300"
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
