// Copy this file to `config.local.ts` (gitignored) and fill in real values.
export const localConfig = {
  account: "000000000000",
  hostedZoneId: "Z000000000000000000000",
  /**
   * Profile name in ~/.aws/credentials. The media sync scripts and the deploy
   * script read this automatically; a bare `npx cdk` does not, so run it with
   * AWS_PROFILE exported — see the Deploy section of README.md.
   */
  profile: "default",

  /* ---- Contact form ------------------------------------------------- */
  /** Domain SES signs mail for. Must be the hosted zone above. */
  sendingDomain: "example.com",
  /** Envelope From. Any address on `sendingDomain`; no mailbox required. */
  fromEmail: "contact@example.com",
  /**
   * Contact form recipients. While the SES account is in the sandbox
   * (`aws sesv2 get-account` → `ProductionAccessEnabled: false`) every one of
   * these must be a verified SES identity in the stack's region, or the send
   * fails. Kept here rather than in tracked source so personal inboxes stay
   * out of git.
   */
  toEmails: ["to@example.com"],
} as const;
