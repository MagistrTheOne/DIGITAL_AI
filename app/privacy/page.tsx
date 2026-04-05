import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocChrome } from "@/components/legal/LegalDocChrome";
import { LegalSection } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Privacy Policy — NULLXES",
  description:
    "How NULLXES collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocChrome active="privacy">
      <header className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: April 6, 2026</p>
        <p className="mt-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
          This Privacy Policy explains how NULLXES (&quot;we,&quot;
          &quot;us&quot;) processes personal data when you visit our websites,
          use our applications, or otherwise interact with our AI digital
          workforce platform (the &quot;Services&quot;). It should be read
          together with our{" "}
          <Link
            href="/terms"
            className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
          >
            Terms of Service
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 space-y-0">
        <LegalSection id="summary" n="1" title="Summary">
          <p>
            We process data to run accounts, authenticate users, deliver AI
            sessions, bill subscriptions, secure the platform, and comply with
            law. We do not sell personal data to data brokers. Enterprise
            customers may receive additional disclosures or a Data Processing
            Agreement (DPA) under contract.
          </p>
        </LegalSection>

        <LegalSection id="controller" n="2" title="Who is responsible">
          <p>
            NULLXES acts as a controller for personal data described here,
            except where we process personal data on behalf of a business
            customer—in that case the customer is typically the controller for
            workspace and employee configuration data, and NULLXES acts as a
            processor as set out in customer agreements.
          </p>
        </LegalSection>

        <LegalSection id="collect" n="3" title="Personal data we collect">
          <p>Depending on how you use the Services, we may process:</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-neutral-600">
            <li>
              <strong className="text-neutral-200">Account data:</strong> name,
              email, organization, role, authentication identifiers.
            </li>
            <li>
              <strong className="text-neutral-200">Billing data:</strong> plan,
              payment status, and transaction references (payment card data is
              handled by our payment processor).
            </li>
            <li>
              <strong className="text-neutral-200">Service &amp; technical
              data:</strong> logs, device/browser type, IP address, approximate
              location derived from IP, session metadata, performance and
              diagnostic telemetry.
            </li>
            <li>
              <strong className="text-neutral-200">Content you submit:</strong>{" "}
              prompts, messages, files, and configuration related to AI employees
              and workflows.
            </li>
            <li>
              <strong className="text-neutral-200">Communications:</strong>{" "}
              information you send when you contact support or submit forms.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="purposes" n="4" title="Purposes and legal bases">
          <p>We use personal data to:</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-neutral-600">
            <li>
              Provide, operate, and improve the Services (contract / legitimate
              interests in a secure, reliable product).
            </li>
            <li>
              Authenticate users, prevent fraud and abuse, and enforce our
              Terms (legitimate interests / legal obligation).
            </li>
            <li>
              Process payments and maintain financial records (contract / legal
              obligation).
            </li>
            <li>
              Send service-related notices and, where permitted, product
              updates; you may opt out of non-essential marketing where
              applicable (consent or legitimate interests).
            </li>
            <li>Comply with law and respond to lawful requests.</li>
          </ul>
          <p className="pt-2">
            Where GDPR or UK GDPR applies, you may have rights described in
            Section 10. Legal bases are indicated in general terms; your specific
            situation may vary.
          </p>
        </LegalSection>

        <LegalSection id="cookies" n="5" title="Cookies and similar technologies">
          <p>
            We use cookies and similar technologies for session management,
            security, preferences, and analytics. You can control many cookies
            through browser settings. Essential cookies may be required for the
            Services to function.
          </p>
        </LegalSection>

        <LegalSection id="sharing" n="6" title="How we share personal data">
          <p>
            We share data with subprocessors that help us run the Services—for
            example cloud hosting, databases, email delivery, authentication,
            analytics, and payment processing. They are contractually required
            to protect data and use it only for the services they provide to us.
            We may disclose data if required by law, to protect rights and
            safety, or in connection with a merger or acquisition subject to
            appropriate safeguards.
          </p>
          <p className="pt-2">
            We do not sell personal data for money. We do not allow subprocessors
            to use your personal data for independent advertising unrelated to
            delivering the Services.
          </p>
        </LegalSection>

        <LegalSection id="transfers" n="7" title="International transfers">
          <p>
            We may process data in the United States and other countries where we
            or our subprocessors operate. Where required, we use appropriate
            safeguards such as Standard Contractual Clauses or equivalent
            mechanisms. Enterprise customers may request transfer terms in a DPA.
          </p>
        </LegalSection>

        <LegalSection id="retention" n="8" title="Retention">
          <p>
            We retain personal data for as long as your account is active and as
            needed to provide the Services, resolve disputes, enforce agreements,
            and meet legal, tax, and accounting requirements. Backup copies may
            persist for a limited period after deletion. Aggregated or anonymized
            data may be retained without time limit.
          </p>
        </LegalSection>

        <LegalSection id="security" n="9" title="Security">
          <p>
            We implement technical and organizational measures designed to protect
            personal data, including access controls, encryption in transit where
            appropriate, and monitoring. No method of transmission or storage is
            completely secure; we encourage strong passwords and MFA where
            available.
          </p>
        </LegalSection>

        <LegalSection id="rights" n="10" title="Your privacy rights">
          <p>
            Depending on your location, you may have the right to access,
            correct, delete, or export personal data; to restrict or object to
            certain processing; and to withdraw consent where processing is
            consent-based. You may lodge a complaint with a supervisory
            authority. To exercise rights, contact us at the email below. We
            will respond within the timeframes required by applicable law (often
            within 30 days, with extensions where permitted).
          </p>
        </LegalSection>

        <LegalSection id="children" n="11" title="Children">
          <p>
            The Services are not directed to children under 13 (or the minimum
            age in your jurisdiction). We do not knowingly collect personal data
            from children. Contact us if you believe we have collected such data.
          </p>
        </LegalSection>

        <LegalSection id="automated" n="12" title="Automated processing">
          <p>
            AI features may produce outputs automatically based on inputs. We do
            not use solely automated decision-making that produces legal or
            similarly significant effects on individuals in the GDPR sense,
            unless we notify you separately and provide required rights.
          </p>
        </LegalSection>

        <LegalSection id="us-states" n="13" title="U.S. state privacy notices">
          <p>
            Residents of certain U.S. states may have additional rights (for
            example, to know, delete, or opt out of certain sharing). Where the
            law defines &quot;sale&quot; or &quot;sharing&quot; for
            cross-context behavioral advertising, we do not engage in those
            activities as described in typical state laws. You may contact us to
            exercise state-specific rights.
          </p>
        </LegalSection>

        <LegalSection id="changes" n="14" title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will post the
            revised version and update the &quot;Last updated&quot; date.
            Material changes will be communicated as required by law or through
            the Services.
          </p>
        </LegalSection>

        <LegalSection id="contact" n="15" title="Contact">
          <p>
            Privacy questions and requests:{" "}
            <a
              href="mailto:devpos@nullxes.com?subject=NULLXES%20Privacy%20inquiry"
              className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              devpos@nullxes.com
            </a>
            . You may also reach{" "}
            <a
              href="mailto:ceo@nullxes.com?subject=NULLXES%20Privacy%20inquiry"
              className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              ceo@nullxes.com
            </a>{" "}
            for commercial or executive matters.
          </p>
        </LegalSection>
      </div>
    </LegalDocChrome>
  );
}
