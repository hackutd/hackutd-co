import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — HackUTD",
  description:
    "The terms that apply when you create an account, apply to, or attend a HackUTD event.",
};

export default function TermsOfService() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-neutral-600">Last updated August 27, 2026</p>

      <h2>Agreement</h2>
      <p>
        These terms apply when you create an account on our portal, apply to a
        HackUTD event, or attend one. By doing any of those, you agree to them.
        If you do not agree, please do not apply.
      </p>
      <p>
        How we handle your information is described separately in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Eligibility</h2>
      <p>
        Our events are for students aged 18 and over. We may ask you to show
        student status or photo ID at check-in. We may decline or revoke an
        application at our discretion, including where these terms or our code
        of conduct have been broken.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information, and keep it up to date</li>
        <li>
          Your account is yours alone — do not share access or apply on someone
          else&apos;s behalf
        </li>
        <li>
          Your QR code identifies you at the event; do not lend it to anyone
        </li>
        <li>
          Tell us promptly if you think someone else has access to your account
        </li>
      </ul>

      <h2>Applications and admission</h2>
      <p>
        Submitting an application does not guarantee admission. Space is limited
        and we cannot admit everyone who applies. We are not obliged to explain
        individual decisions.
      </p>
      <p>
        Accepting a place and then not attending takes a spot from someone else.
        If you can no longer come, tell us so we can offer it on.
      </p>

      <h2>Code of conduct</h2>
      <p>
        Everyone at our events — participants, mentors, volunteers, sponsors,
        and organizers — is expected to behave respectfully. We do not tolerate
        harassment, discrimination, intimidation, or any behavior that makes
        someone unwelcome.
      </p>
      {/* DECIDE BEFORE LAUNCH: if the event is an MLH Member Event, link the MLH
          Code of Conduct here and state that it applies in addition to ours. */}
      <p>
        Organizers may take any action they judge appropriate, including
        removing someone from the venue and from future events. Report concerns
        to any organizer, or email{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a>.
      </p>

      <h2>Your projects</h2>
      <p>
        <strong>You own what you build.</strong> We claim no ownership of your
        project, code, or ideas.
      </p>
      <p>
        By entering a project for judging you agree that we and our sponsors may
        show it — name, description, screenshots, and demo — to publicize the
        event and announce results. Work must be substantially created during
        the event, and you must have the right to use anything you include.
      </p>

      <h2>Photography</h2>
      <p>
        We take photos and video at our events for publicity. If you would
        rather not appear in them, tell an organizer at check-in and we will do
        our best to accommodate you.
      </p>

      <h2>Acceptable use of the portal</h2>
      <ul>
        <li>
          Do not attempt to gain access to accounts, data, or systems that are
          not yours
        </li>
        <li>Do not disrupt or overload the portal, or scrape it automatically</li>
        <li>Do not upload malware, or anything unlawful or infringing</li>
        <li>Do not misrepresent who you are</li>
      </ul>
      <p>
        If you find a security vulnerability, please report it to{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a> rather than
        exploiting it. We appreciate it.
      </p>

      <h2>Availability</h2>
      <p>
        The portal is provided as-is. We run it on a best-effort basis around
        the event calendar and cannot promise it will always be available or
        error-free.
      </p>

      <h2>Liability</h2>
      <p>
        You attend our events at your own risk. To the fullest extent the law
        allows, HackUTD, its organizers, and its volunteers are not liable for
        any indirect or consequential loss arising from your use of the portal
        or attendance at an event, including lost or damaged property. Nothing
        here limits liability that cannot lawfully be limited.
      </p>
      <p>
        HackUTD is a student organization. These terms are between you and
        HackUTD.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; the date at the top will change when we do.
        Continuing to use the portal after a change means you accept the updated
        terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a>.
      </p>
    </>
  );
}
