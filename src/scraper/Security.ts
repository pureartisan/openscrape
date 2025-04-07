export class Security {
  private readonly privateIPRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
    /^fc00::/,
    /^fd00::/,
    /^fe80::/,
    /^::ffff:0:0/,
  ];

  private readonly blockedProtocols = [
    "file:",
    "ftp:",
    "sftp:",
    "smb:",
    "nfs:",
  ];

  private readonly blockedDomains = ["localhost", "127.0.0.1", "::1"];

  private readonly allowedProtocols = ["http:", "https:"];

  assertAllowedUrl(url: string): string | undefined {
    try {
      const parsedUrl = new URL(url);

      // Check for blocked protocols
      if (this.blockedProtocols.includes(parsedUrl.protocol.toLowerCase())) {
        return "Invalid protocol";
      }

      // Check for blocked domains/hosts
      if (this.blockedDomains.includes(parsedUrl.hostname)) {
        return "Invalid domain";
      }

      // Check for private IP ranges
      for (const range of this.privateIPRanges) {
        if (range.test(parsedUrl.hostname)) {
          return "Invalid IP range";
        }
      }

      // Ensure the URL uses http or https
      if (!this.allowedProtocols.includes(parsedUrl.protocol.toLowerCase())) {
        return "Invalid protocol";
      }
    } catch (error) {
      // Invalid URL format
      return "Invalid URL format";
    }
  }
}
