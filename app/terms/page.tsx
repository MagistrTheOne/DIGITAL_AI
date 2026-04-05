import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocChrome } from "@/components/legal/LegalDocChrome";
import { LegalSection } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Terms of Service — NULLXES",
  description:
    "Terms of Service for the NULLXES AI digital workforce platform.",
};

export default function TermsPage() {
  return (
    <LegalDocChrome active="terms">
      <header className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: April 6, 2026</p>
        <p className="mt-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
          These Terms of Service (&quot;Terms&quot;) govern access to and use of
          websites, applications, APIs, and related services offered by NULLXES
          (&quot;NULLXES,&quot; &quot;we,&quot; &quot;us&quot;) (collectively,
          the &quot;Services&quot;). By creating an account, clicking to accept,
          or using the Services, you agree to these Terms on behalf of yourself
          or the organization you represent.
        </p>
      </header>

      <div className="mt-10 space-y-0">
        <LegalSection id="agreement" n="1" title="Agreement">
          <p>
            If you use the Services on behalf of a company or other legal entity,
            you represent that you have authority to bind that entity. If you do
            not agree to these Terms, do not use the Services. You must be at
            least the age of majority in your jurisdiction to enter into these
            Terms.
          </p>
        </LegalSection>

        <LegalSection id="definitions" n="2" title="Definitions">
          <p>
            <strong className="text-neutral-200">Customer</strong> means the
            person or entity that registers for the Services.{" "}
            <strong className="text-neutral-200">Customer Data</strong> means
            data, content, prompts, files, or other materials that Customer or
            its users submit to the Services.{" "}
            <strong className="text-neutral-200">Documentation</strong> means
            our published product documentation and acceptable use materials.
          </p>
        </LegalSection>

        <LegalSection id="services" n="3" title="The Services">
          <p>
            NULLXES provides a control plane for configuring and operating AI
            digital employees, including session-based experiences that may
            involve voice, avatar, and workflow features. We may modify,
            suspend, or discontinue features with reasonable notice where
            practicable. Certain features depend on third-party models,
            infrastructure, or integrations; their availability is not
            guaranteed.
          </p>
        </LegalSection>

        <LegalSection id="accounts" n="4" title="Accounts and access">
          <p>
            You are responsible for credentials, accurate registration
            information, and activity under your account. You must notify us
            promptly of unauthorized use. We may suspend access for security,
            suspected abuse, or non-payment according to these Terms or your
            subscription terms.
          </p>
        </LegalSection>

        <LegalSection id="payment" n="5" title="Fees, billing, and taxes">
          <p>
            Paid plans are billed as described at checkout or in your order.
            Payments may be processed by our payment partner (for example Polar);
            their terms may also apply to the transaction. Fees are exclusive of
            applicable taxes unless stated otherwise. Failure to pay may result
            in suspension or termination of paid features.
          </p>
        </LegalSection>

        <LegalSection id="acceptable-use" n="6" title="Acceptable use">
          <p>You agree not to, and not to allow others to:</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-neutral-600">
            <li>
              Violate law, infringe intellectual property, or harm individuals or
              systems (including malware, scraping that overloads the Services,
              or attempting to bypass security).
            </li>
            <li>
              Use the Services to generate or distribute unlawful, defamatory,
              harassing, or discriminatory content, or content that violates
              third-party rights.
            </li>
            <li>
              Reverse engineer the Services except where applicable law
              prohibits this restriction.
            </li>
            <li>
              Resell or sublicense the Services without our written consent,
              except as expressly permitted for your internal users.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="customer-data" n="7" title="Customer Data">
          <p>
            As between the parties, Customer retains its rights in Customer
            Data. Customer grants NULLXES a non-exclusive license to host,
            process, transmit, and display Customer Data solely to provide,
            secure, and improve the Services and as described in our{" "}
            <Link
              href="/privacy"
              className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
            >
              Privacy Policy
            </Link>
            . Customer represents that it has necessary rights and consents for
            Customer Data. We may remove Customer Data if required by law or if
            it violates these Terms.
          </p>
        </LegalSection>

        <LegalSection id="ip" n="8" title="NULLXES intellectual property">
          <p>
            The Services, software, branding, and Documentation are owned by
            NULLXES or its licensors. Except for the limited rights granted in
            these Terms, no rights are transferred to you. Feedback you provide
            may be used by NULLXES without obligation or compensation.
          </p>
        </LegalSection>

        <LegalSection id="ai-outputs" n="9" title="AI outputs and reliance">
          <p>
            Outputs generated through AI features may be inaccurate, incomplete,
            or unsuitable for a given use case. You are responsible for human
            review where appropriate and for compliance with laws applicable to
            your use of outputs. NULLXES does not warrant that outputs are fit
            for any particular purpose.
          </p>
        </LegalSection>

        <LegalSection id="third-parties" n="10" title="Third-party services">
          <p>
            The Services may integrate with third-party products. Those
            services are governed by their own terms. NULLXES is not responsible
            for third-party services or for data processed outside the Services
            at your direction.
          </p>
        </LegalSection>

        <LegalSection id="confidentiality" n="11" title="Confidentiality">
          <p>
            Each party may receive non-public information of the other
            (&quot;Confidential Information&quot;). The recipient will use
            reasonable care to protect Confidential Information and use it only
            for the purposes of these Terms, subject to standard exceptions
            (public domain, independently developed, required by law).
          </p>
        </LegalSection>

        <LegalSection id="warranty" n="12" title="Disclaimer of warranties">
          <p>
            THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE.&quot; TO THE MAXIMUM EXTENT PERMITTED BY LAW, NULLXES
            DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
            INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. NULLXES DOES NOT WARRANT UNINTERRUPTED OR ERROR-
            FREE OPERATION.
          </p>
        </LegalSection>

        <LegalSection id="liability" n="13" title="Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE
            FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY
            DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, GOODWILL, OR DATA. NULLXES
            AGGREGATE LIABILITY ARISING OUT OF THESE TERMS WILL NOT EXCEED THE
            GREATER OF (A) THE AMOUNTS YOU PAID TO NULLXES FOR THE SERVICES IN
            THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS
            (US$100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY LAW.
          </p>
        </LegalSection>

        <LegalSection id="indemnity" n="14" title="Indemnification">
          <p>
            Customer will defend and indemnify NULLXES against third-party
            claims arising from Customer Data, Customer&apos;s use of the
            Services in violation of these Terms, or Customer&apos;s violation
            of law, subject to NULLXES promptly notifying Customer and
            cooperating in the defense.
          </p>
        </LegalSection>

        <LegalSection id="term" n="15" title="Term, suspension, and termination">
          <p>
            These Terms apply from first use until terminated. You may stop using
            the Services at any time. We may suspend or terminate access for
            material breach, non-payment, legal risk, or extended inactivity as
            described in product policies. Upon termination, your right to use
            the Services ceases; we may delete Customer Data after a reasonable
            period consistent with our Privacy Policy and backups, except where
            retention is required by law.
          </p>
        </LegalSection>

        <LegalSection id="export" n="16" title="Export and sanctions">
          <p>
            You may not use the Services in violation of export control or
            sanctions laws. You represent that you are not prohibited from
            receiving U.S. or applicable-origin services.
          </p>
        </LegalSection>

        <LegalSection id="law" n="17" title="Governing law and venue">
          <p>
            These Terms are governed by the laws of the State of Delaware, USA,
            excluding conflict-of-law rules. Courts in Delaware will have
            exclusive jurisdiction, except that either party may seek injunctive
            relief in any court of competent jurisdiction. If you are a consumer
            in a jurisdiction that mandatorily applies local law, those
            mandatory rules apply to the extent required.
          </p>
        </LegalSection>

        <LegalSection id="changes" n="18" title="Changes and notices">
          <p>
            We may update these Terms by posting a revised version and updating
            the &quot;Last updated&quot; date. Material changes will be
            communicated through the Services or email where appropriate.
            Continued use after the effective date constitutes acceptance. Legal
            notices to NULLXES may be sent to the contact below.
          </p>
        </LegalSection>

        <LegalSection id="misc" n="19" title="General">
          <p>
            These Terms constitute the entire agreement regarding the Services
            and supersede prior understandings on that subject. If a provision is
            unenforceable, the remainder stays in effect. Failure to enforce a
            provision is not a waiver. You may not assign these Terms without our
            consent; we may assign in connection with a merger or sale. Nothing
            creates a partnership or agency except as stated.
          </p>
        </LegalSection>

        <LegalSection id="contact" n="20" title="Contact">
          <p>
            Questions about these Terms:{" "}
            <a
              href="mailto:devpos@nullxes.com?subject=NULLXES%20Terms%20inquiry"
              className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              devpos@nullxes.com
            </a>
            . Commercial and executive inquiries:{" "}
            <a
              href="mailto:ceo@nullxes.com?subject=NULLXES%20Terms%20inquiry"
              className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              ceo@nullxes.com
            </a>
            .
          </p>
        </LegalSection>
      </div>
    </LegalDocChrome>
  );
}
