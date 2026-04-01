import { useState } from "react";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import AmbientBackdrop from "../components/AmbientBackdrop";
import ArtDirectedImage from "../components/ArtDirectedImage";
import { ART_FALLBACKS } from "../lib/art";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
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
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    if (errors[event.target.name]) {
      setErrors((current) => ({
        ...current,
        [event.target.name]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen overflow-hidden pt-24">
      <section className="relative px-4 py-10 md:py-14">
        <AmbientBackdrop intensity="strong" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[0.36em] text-[#ddb779]">Let&apos;s Talk</p>
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(3rem,7vw,5.8rem)] leading-[0.96] text-white">
            Contact
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300 md:text-xl">
            A direct, lightweight inquiry flow wrapped in the same moody visual language as the portfolio.
          </p>
        </div>
      </section>

      <section className="relative px-4 pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0f] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
              <ArtDirectedImage
                src={ART_FALLBACKS[1]}
                fallback={ART_FALLBACKS[1]}
                alt="Atmospheric studio texture"
                className="aspect-[5/4]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.82))]" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-[#ddb779]">Availability</p>
                <h2 className="mt-3 max-w-sm font-serif text-3xl text-white">
                  Open for selected commissions and collaborations.
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ContactCard
                href="mailto:joey@joeydodd.art"
                icon={<EnvelopeSimple size={22} weight="regular" />}
                label="Email"
                value="joey@joeydodd.art"
              />
              <ContactCard
                href="https://instagram.com"
                icon={<InstagramLogo size={22} weight="regular" />}
                label="Instagram"
                value="@joeydodd.art"
              />
              <ContactCard
                href="https://linkedin.com"
                icon={<LinkedinLogo size={22} weight="regular" />}
                label="LinkedIn"
                value="Joey Dodd"
                className="md:col-span-2"
              />
            </div>
          </div>

          {submitted ? (
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10">
              <AmbientBackdrop intensity="soft" />
              <div className="relative flex h-full flex-col items-start justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#e0bc7b] text-black">
                  <PaperPlaneTilt size={32} weight="regular" />
                </div>
                <h2 className="mt-8 font-serif text-4xl text-white">Message Sent</h2>
                <p className="mt-5 max-w-md text-lg leading-8 text-neutral-300">
                  Your default email client should now be open with the message prefilled.
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10"
              aria-label="Contact form"
            >
              <AmbientBackdrop intensity="soft" />
              <div className="relative">
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ddb779]">Inquiry Form</p>
                  <h2 className="mt-3 font-serif text-3xl text-white">Bring me into the room early.</h2>
                </div>
                <div className="grid gap-5">
                  <FormField
                    id="name"
                    label="Name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Your name"
                  />
                  <FormField
                    id="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    type="email"
                    placeholder="you@example.com"
                  />
                  <FormField
                    id="subject"
                    label="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required={false}
                    placeholder="Project inquiry"
                  />
                  <FormTextarea
                    id="message"
                    label="Message"
                    value={formData.message}
                    onChange={handleChange}
                    error={errors.message}
                    placeholder="Tell me about the project, the tone, and the timeline."
                  />
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-[#e0bc7b] px-8 py-4 text-sm uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#ecc98a]"
                    >
                      Send Message
                      <PaperPlaneTilt size={18} weight="regular" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  href,
  icon,
  label,
  value,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06] ${className || ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-[#ddb779]">
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">{label}</p>
          <p className="mt-2 text-base text-white">{value}</p>
        </div>
      </div>
    </a>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = true,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
        {label}
        {required && <span className="ml-2 text-[#ddb779]">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-black/30 px-4 py-4 text-white placeholder:text-neutral-500 focus:border-[#ddb779] focus:outline-none"
        aria-required={required}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FormTextarea({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
        {label}
        <span className="ml-2 text-[#ddb779]">*</span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={7}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-[1.1rem] border border-white/10 bg-black/30 px-4 py-4 text-white placeholder:text-neutral-500 focus:border-[#ddb779] focus:outline-none"
        aria-required="true"
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
