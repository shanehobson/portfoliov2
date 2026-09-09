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

  /* ---- Adopted resources -------------------------------------------- */
  /*
   * The distribution, its OAC and the certificate were created in the console
   * and adopted with `cdk import`; the stack references all three rather than
   * creating them. Their ids are not secrets — none of them is usable without
   * credentials for the account above — but they name real infrastructure, and
   * an account id is the one value in this file that appears verbatim in an
   * ARN. They live here so a public repo does not publish the inventory.
   *
   * Read them back with:
   *   aws cloudfront list-distributions \
   *     --query "DistributionList.Items[?Aliases.Items[0]=='example.com']"
   *   aws cloudfront list-origin-access-controls
   *   aws acm list-certificates --region us-east-1
   */
  distributionId: "E000000000000",
  distributionDomainName: "d000000000000.cloudfront.net",
  originAccessControlId: "E000000000000",
  /** Must be in us-east-1, whatever region the stack runs in. */
  certificateArn:
    "arn:aws:acm:us-east-1:000000000000:certificate/00000000-0000-0000-0000-000000000000",

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
