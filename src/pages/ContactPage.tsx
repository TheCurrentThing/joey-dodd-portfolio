import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { REFERENCE_MEDIA } from "../lib/referenceMedia";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll(".header-animate"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
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
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required.";
    if (!formData.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email.";
    }
    if (!formData.message.trim()) nextErrors.message = "Message is required.";
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    const subject = encodeURIComponent(
      formData.subject || `Portfolio inquiry from ${formData.name}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );

    window.location.href = `mailto:joey@joeydodd.art?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (errors[event.target.name]) {
      setErrors((current) => ({ ...current, [event.target.name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-secondary pt-24">
      <div className="mx-auto max-w-screen-xl px-6 py-16 md:px-10 md:py-24">
        <div ref={headerRef} className="mb-16">
          <p className="header-animate mb-3 font-mono text-sm uppercase tracking-widest text-tertiary">
            Let&apos;s Talk
          </p>
          <h1 className="header-animate mb-6 font-serif text-h1 text-foreground md:text-5xl">
            Contact
          </h1>
          <p className="header-animate max-w-xl font-sans text-body-lg font-light text-neutral-300">
            Have a project in mind or want to collaborate? I&apos;d love to hear from
            you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 md:gap-24">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-6 font-serif text-h3 text-foreground">
                Get in touch
              </h2>
              <div className="flex flex-col gap-6">
                <a
                  href="mailto:joey@joeydodd.art"
                  className="group inline-flex items-center gap-4 text-neutral-200 transition-colors duration-300 hover:text-tertiary"
                  aria-label="Send email to Joey Dodd"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-800 transition-colors duration-300 group-hover:bg-neutral-700">
                    <EnvelopeSimple
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="mb-1 font-mono text-xs uppercase tracking-widest text-tertiary">
                      Email
                    </p>
                    <p className="font-sans text-body-lg text-foreground">
                      joey@joeydodd.art
                    </p>
                  </div>
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-4 text-neutral-200 transition-colors duration-300 hover:text-tertiary"
                  aria-label="Joey Dodd on Instagram"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-800 transition-colors duration-300 group-hover:bg-neutral-700">
                    <InstagramLogo
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="mb-1 font-mono text-xs uppercase tracking-widest text-tertiary">
                      Instagram
                    </p>
                    <p className="font-sans text-body-lg text-foreground">
                      @joeydodd.art
                    </p>
                  </div>
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-4 text-neutral-200 transition-colors duration-300 hover:text-tertiary"
                  aria-label="Joey Dodd on LinkedIn"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-800 transition-colors duration-300 group-hover:bg-neutral-700">
                    <LinkedinLogo
                      size={22}
                      weight="regular"
                      className="text-tertiary"
                    />
                  </span>
                  <div>
                    <p className="mb-1 font-mono text-xs uppercase tracking-widest text-tertiary">
                      LinkedIn
                    </p>
                    <p className="font-sans text-body-lg text-foreground">
                      Joey Dodd
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-md">
              <img
                src={REFERENCE_MEDIA.contactImage}
                alt="Art table with sketchbooks and tools"
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/20">
                  <PaperPlaneTilt
                    size={32}
                    weight="regular"
                    className="text-tertiary"
                  />
                </div>
                <h3 className="font-serif text-h3 text-foreground">
                  Message Sent!
                </h3>
                <p className="max-w-sm font-sans text-body-lg font-light text-neutral-300">
                  Thank you for reaching out. I&apos;ll get back to you as soon as
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
                <Field
                  id="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  className="field-animate"
                />
                <Field
                  id="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  type="email"
                  className="field-animate"
                />
                <Field
                  id="subject"
                  label="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="field-animate"
                />
                <Field
                  id="message"
                  label="Message"
                  value={formData.message}
                  onChange={handleChange}
                  error={errors.message}
                  required
                  multiline
                  placeholder="Tell me about your project..."
                  className="field-animate"
                />
                <div className="field-animate">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-8 py-4 font-sans text-label font-normal uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
                  >
                    Send Message
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

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  multiline = false,
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  error?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-widest text-tertiary"
      >
        {label}{" "}
        {required && (
          <span className="text-warning" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          rows={6}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="resize-none rounded-md border border-border bg-neutral-800 px-4 py-3 font-sans text-body-lg text-foreground placeholder:text-neutral-500 transition-colors duration-300 focus:border-tertiary focus:outline-none"
          aria-required={required}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder || (id === "name" ? "Your name" : "your@email.com")}
          className="rounded-md border border-border bg-neutral-800 px-4 py-3 font-sans text-body-lg text-foreground placeholder:text-neutral-500 transition-colors duration-300 focus:border-tertiary focus:outline-none"
          aria-required={required}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="font-sans text-sm text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
