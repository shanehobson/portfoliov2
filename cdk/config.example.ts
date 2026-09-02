// Copy this file to `config.local.ts` (gitignored) and fill in real values.
export const localConfig = {
  account: "000000000000",
  /**
   * Profile name in ~/.aws/credentials. The media sync scripts and the deploy
   * script read this automatically; a bare `npx cdk` does not, so run it with
   * AWS_PROFILE exported — see the Deploy section of README.md.
   */
  profile: "default",
} as const;
