import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMutation } from "@animaapp/playground-react-sdk";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  PaperPlaneTilt,
} from "@phosphor-icons/react";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    create,
    isPending,
    error: mutationError,
  } = useMutation("ContactSubmission");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll(".header-animate"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        );
      }
      if (formRef.current) {
        const fields = formRef.current.querySelectorAll(".field-animate");
        gsap.fromTo(
          fields,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.4,
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    try {
      await create({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setSubmitted(true);
    } catch {
      // error handled via mutationError
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-secondary pt-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <div ref={headerRef} className="mb-16">
          <p className="header-animate font-mono text-label uppercase tracking-widest text-tertiary text-sm mb-3">
            Let's Talk
          </p>
          <h1 className="header-animate font-serif text-foreground text-h1 md:text-5xl mb-6">
            Contact
          </h1>
          <p className="header-animate font-sans text-neutral-300 text-body-lg font-light max-w-xl">
            Have a project in mind or want to collaborate? I'd love to hear from
            you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
          {/* Contact Info */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="font-serif text-foreground text-h3 mb-6">
                Get in touch
              </h2>
              <div className="flex flex-col gap-6">
                <a
                  href="mailto:joey@joeydodd.art"
                  className="inline-flex items-center gap-4 text-neutral-200 hover:text-tertiary transition-colors duration-300 group"
                  aria-label="Send email to Joey Dodd"
                >
                  <span className="w-12 h-12 rounded-md bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors duration-300">
                    <EnvelopeSimple
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-1">
                      Email
                    </p>
                    <p className="font-sans text-foreground text-body-lg">
                      joey@joeydodd.art
                    </p>
                  </div>
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 text-neutral-200 hover:text-tertiary transition-colors duration-300 group"
                  aria-label="Joey Dodd on Instagram"
                >
                  <span className="w-12 h-12 rounded-md bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors duration-300">
                    <InstagramLogo
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-1">
                      Instagram
                    </p>
                    <p className="font-sans text-foreground text-body-lg">
                      @joeydodd.art
                    </p>
                  </div>
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 text-neutral-200 hover:text-tertiary transition-colors duration-300 group"
                  aria-label="Joey Dodd on LinkedIn"
                >
                  <span className="w-12 h-12 rounded-md bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors duration-300">
                    <LinkedinLogo
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-1">
                      LinkedIn
                    </p>
                    <p className="font-sans text-foreground text-body-lg">
                      Joey Dodd
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div className="rounded-md overflow-hidden">
              <img
                src="https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_3.png"
                alt="Art table with sketchbooks and tools"
                className="w-full h-64 object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center">
                  <PaperPlaneTilt
                    size={32}
                    weight="regular"
                    className="text-tertiary"
                  />
                </div>
                <h3 className="font-serif text-foreground text-h3">
                  Message Sent!
                </h3>
                <p className="font-sans text-neutral-300 text-body-lg font-light max-w-sm">
                  Thank you for reaching out. I'll get back to you as soon as
                  possible.
                </p>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-6"
                aria-label="Contact form"
              >
                <div className="field-animate flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="font-mono text-label uppercase tracking-widest text-tertiary text-xs"
                  >
                    Name{" "}
                    <span className="text-warning" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="bg-neutral-800 border border-border text-foreground font-sans text-body-lg px-4 py-3 rounded-md focus:outline-none focus:border-tertiary transition-colors duration-300 placeholder:text-neutral-500"
                    aria-required="true"
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p
                      id="name-error"
                      className="font-sans text-warning text-body text-sm"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="field-animate flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="font-mono text-label uppercase tracking-widest text-tertiary text-xs"
                  >
                    Email{" "}
                    <span className="text-warning" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="bg-neutral-800 border border-border text-foreground font-sans text-body-lg px-4 py-3 rounded-md focus:outline-none focus:border-tertiary transition-colors duration-300 placeholder:text-neutral-500"
                    aria-required="true"
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="font-sans text-warning text-body text-sm"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="field-animate flex flex-col gap-2">
                  <label
                    htmlFor="subject"
                    className="font-mono text-label uppercase tracking-widest text-tertiary text-xs"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="bg-neutral-800 border border-border text-foreground font-sans text-body-lg px-4 py-3 rounded-md focus:outline-none focus:border-tertiary transition-colors duration-300 placeholder:text-neutral-500"
                  />
                </div>

                <div className="field-animate flex flex-col gap-2">
                  <label
                    htmlFor="message"
                    className="font-mono text-label uppercase tracking-widest text-tertiary text-xs"
                  >
                    Message{" "}
                    <span className="text-warning" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project..."
                    className="bg-neutral-800 border border-border text-foreground font-sans text-body-lg px-4 py-3 rounded-md focus:outline-none focus:border-tertiary transition-colors duration-300 placeholder:text-neutral-500 resize-none"
                    aria-required="true"
                    aria-describedby={
                      errors.message ? "message-error" : undefined
                    }
                  />
                  {errors.message && (
                    <p
                      id="message-error"
                      className="font-sans text-warning text-body text-sm"
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

                {mutationError && (
                  <p
                    className="font-sans text-warning text-body text-sm"
                    role="alert"
                  >
                    Something went wrong: {mutationError.message}
                  </p>
                )}

                <div className="field-animate">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 bg-cta-primary-bg text-cta-primary-fg font-sans font-normal uppercase tracking-widest text-label px-8 py-4 rounded-md hover:bg-tertiary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Sending..." : "Send Message"}
                    <PaperPlaneTilt size={18} weight="regular" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
