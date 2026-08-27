import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — HackUTD",
  description:
    "How HackUTD collects, uses, shares, and retains information from applicants and attendees.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-neutral-600">Last updated August 27, 2026</p>

      <h2>Who we are</h2>
      <p>
        HackUTD is a student-run organization at The University of Texas at
        Dallas. This policy covers information we collect through our
        application and event portal and through this website. Questions go to{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a>.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Account information.</strong> Your email address, and how you
        signed in (email link or Google). If you sign in with Google, we receive
        your Google profile picture.
      </p>
      <p>
        <strong>Application information.</strong> What you enter on the
        application form. Depending on the questions we ask in a given year,
        this typically includes:
      </p>
      <ul>
        <li>Your name and phone number</li>
        <li>Age and country of residence</li>
        <li>School, major, and expected graduation</li>
        <li>Links you choose to share, such as LinkedIn or GitHub</li>
        <li>Your résumé, if you upload one</li>
        <li>Gender, race, and ethnicity</li>
        <li>Dietary restrictions and shirt size</li>
      </ul>
      <p>
        <strong>Event information.</strong> When you check in, and when your
        badge is scanned at meals, workshops, and activities during the event,
        plus any points you earn.
      </p>
      <p>
        <strong>Review information.</strong> Scores and notes our organizers
        record about your application while deciding admissions.
      </p>
      <p>
        <strong>Notification settings.</strong> If you turn on push
        notifications, your browser gives us a subscription token so we can send
        them.
      </p>

      <h2>Why we collect it</h2>
      <ul>
        <li>To review applications and decide who to admit</li>
        <li>To email you about your application, the event, and logistics</li>
        <li>To run check-in, meals, workshops, and activities on the day</li>
        <li>
          To order the right amount and kind of food, and the right shirt sizes
        </li>
        <li>
          To understand who our events reach, and report that to our university
          and funders in aggregate
        </li>
        <li>To keep the event safe and enforce our Terms of Service</li>
      </ul>

      <h2>Sensitive information</h2>
      <p>
        Gender, race, ethnicity, and dietary restrictions are{" "}
        <strong>optional</strong>. You can leave them blank and still apply and
        attend.
      </p>
      <p>
        We ask for gender, race, and ethnicity only to understand and report on
        who our events reach, and we report them in aggregate — never tied to
        your name. Dietary restrictions are used solely to order food you can
        eat, and are shared with caterers as counts rather than as named lists
        wherever possible.
      </p>
      <p>
        These answers are never part of an admissions decision, and reviewers
        scoring your application do not see them.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We do not sell your information. We share it only with the service
        providers that make our events work, and only as much as they need:
      </p>
      <ul>
        <li>
          <strong>SuperTokens</strong> — sign-in and session management
        </li>
        <li>
          <strong>SendGrid</strong> — sending email
        </li>
        <li>
          <strong>Google Cloud</strong> — hosting our portal and storing
          uploaded résumés
        </li>
        <li>
          <strong>Neon</strong> — our database
        </li>
        <li>
          <strong>Vercel</strong> — hosting our websites
        </li>
      </ul>
      {/* DECIDE BEFORE LAUNCH: if résumés or attendee lists go to sponsors, say
          so explicitly here and make it opt-in on the application form. Delete
          this paragraph if nothing is shared with sponsors. */}
      <p>
        <strong>Sponsors.</strong> We share aggregate statistics about our
        attendees with sponsors. We share your résumé or contact details with a
        sponsor only if you have explicitly opted in to that.
      </p>
      <p>
        We may also disclose information if the law requires it, or if we
        reasonably need to in order to protect the safety of our participants.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep application and event data for the cycle it belongs to, and
        clear it when we reset the portal for the following year. Résumés are
        deleted with that reset. We keep your account and email address until
        you ask us to delete it.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          You can see and edit your application from the portal until you submit
          it
        </li>
        <li>
          You can delete your account from your profile page in the portal,
          which removes your application and résumé
        </li>
        <li>
          You can turn push notifications off in the portal or in your browser
          settings
        </li>
        <li>
          You can email us to ask what we hold about you, to correct it, or to
          have it deleted
        </li>
      </ul>
      <p>
        If you are somewhere with laws giving you additional rights over your
        personal data — for example the GDPR in the UK and EU — those rights
        apply, and you can exercise them by emailing{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a>.
      </p>

      <h2>Security</h2>
      <p>
        Access to applicant data is limited to organizers who need it. Sign-in
        is handled by a dedicated authentication provider, and résumés are
        stored in access-controlled cloud storage. No system is perfectly
        secure, so please do not put information in your application that you
        would not want an organizer to read.
      </p>

      <h2>Children</h2>
      <p>
        Our events are intended for participants aged 18 and over. We do not
        knowingly collect information from children under 13. If you believe a
        child has given us information, email{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a> and we will
        delete it.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page if our practices change, and the date at the
        top will change with it. Significant changes will also be announced by
        email to applicants.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, requests, or complaints:{" "}
        <a href="mailto:hello@hackutd.co">hello@hackutd.co</a>.
      </p>
    </>
  );
}
