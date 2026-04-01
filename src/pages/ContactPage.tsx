import { useState } from "react";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  PaperPlaneTilt,
} from "@phosphor-icons/react";

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

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Message is required.";
    }

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
    <div className="min-h-screen bg-gray-900 pt-24">
      <div className="mx-auto max-w-screen-xl px-6 py-16 md:px-10 md:py-24">
        <div className="mb-16">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-gray-400">
            Let&apos;s Talk
          </p>
          <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">Contact</h1>
          <p className="max-w-2xl text-lg text-gray-300">
            Have a project in mind or want to collaborate? This page now opens
            your default email client directly, which removes the old Anima-only
            submission dependency from the build.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 md:gap-24">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-white">Get in touch</h2>
              <div className="flex flex-col gap-6">
                <ContactLink
                  href="mailto:joey@joeydodd.art"
                  icon={<EnvelopeSimple size={22} weight="regular" className="text-white" />}
                  label="Email"
                  value="joey@joeydodd.art"
                  ariaLabel="Send email to Joey Dodd"
                />
                <ContactLink
                  href="https://instagram.com"
                  icon={<InstagramLogo size={22} weight="regular" className="text-white" />}
                  label="Instagram"
                  value="@joeydodd.art"
                  ariaLabel="Joey Dodd on Instagram"
                />
                <ContactLink
                  href="https://linkedin.com"
                  icon={<LinkedinLogo size={22} weight="regular" className="text-white" />}
                  label="LinkedIn"
                  value="Joey Dodd"
                  ariaLabel="Joey Dodd on LinkedIn"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
                Availability
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">
                Open for select commissions
              </p>
              <p className="mt-4 leading-7 text-gray-300">
                Use the form to draft an email with your project type, timeline,
                and references. That keeps the contact flow lightweight while the
                CMS stays focused on portfolio content.
              </p>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl border border-gray-800 bg-gray-950 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                  <PaperPlaneTilt size={32} weight="regular" className="text-white" />
                </div>
                <h3 className="text-3xl font-semibold text-white">Message Sent</h3>
                <p className="max-w-sm text-lg text-gray-300">
                  Your default email client should now be open with the message
                  prefilled.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-6 rounded-2xl border border-gray-800 bg-gray-950 p-8"
                aria-label="Contact form"
              >
                <FormField
                  id="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                <FormField
                  id="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  type="email"
                />
                <FormField
                  id="subject"
                  label="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required={false}
                />
                <FormTextarea
                  id="message"
                  label="Message"
                  value={formData.message}
                  onChange={handleChange}
                  error={errors.message}
                />
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-gray-200"
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

function ContactLink({
  href,
  icon,
  label,
  value,
  ariaLabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  ariaLabel: string;
}) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group inline-flex items-center gap-4 text-gray-200 transition-colors duration-300 hover:text-white"
      aria-label={ariaLabel}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800 transition-colors duration-300 group-hover:bg-gray-700">
        {icon}
      </span>
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gray-400">{label}</p>
        <p className="text-lg text-white">{value}</p>
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.25em] text-gray-400">
        {label}{" "}
        {required && (
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        className="rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-lg text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
        aria-required={required}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-400" role="alert">
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.25em] text-gray-400">
        {label}{" "}
        <span className="text-red-400" aria-hidden="true">
          *
        </span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={6}
        value={value}
        onChange={onChange}
        className="resize-none rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-lg text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
        aria-required="true"
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
