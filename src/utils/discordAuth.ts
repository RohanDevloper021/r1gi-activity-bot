/**
 * Utility to extract Application ID (Client ID) from a Discord Bot Token
 * Discord bot tokens are structured as: [BASE64_USER_ID].[TIMESTAMP].[HMAC]
 */
export function extractClientIdFromToken(token: string): string | null {
  if (!token) return null;
  const parts = token.trim().split('.');
  if (parts.length < 2) return null;

  try {
    const decoded = Buffer.from(parts[0], 'base64').toString('utf8');
    // Discord snowflake IDs are 17-20 digit numeric strings
    if (/^\d{17,20}$/.test(decoded)) {
      return decoded;
    }
  } catch (err) {
    // Ignore decode error
  }
  return null;
}

/**
 * Generate bot invite URL with required permissions
 * Scopes: bot, applications.commands
 * Permissions: Manage Roles (268435456), Send Messages (2048), Embed Links (16384),
 * View Channel (1024), Read Message History (65536)
 * Total permissions integer: 268453888 (or 8 for Administrator if preferred)
 */
export function generateBotInviteUrl(clientId: string): string {
  const permissions = '268453888';
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
}
