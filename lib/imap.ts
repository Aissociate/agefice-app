/**
 * Stub WebContainer-compatible.
 *
 * Le module original utilise ImapFlow + mailparser (TCP brut), incompatible
 * avec Bolt.new / WebContainer. La récupération IMAP est désactivée — déployer
 * sur un environnement Node complet pour réactiver.
 */

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
}

export interface FetchedAttachment {
  nom: string;
  type: string;
  taille: number;
  chemin: string;
  url: string;
}

export interface FetchedMessage {
  uid: number;
  from: string;
  subject: string;
  text: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
  attachments: FetchedAttachment[];
}

export async function getImapConfig(): Promise<ImapConfig | null> {
  return null;
}

export async function fetchInboxReplies(
  _cfg: ImapConfig,
  _since: Date
): Promise<FetchedMessage[]> {
  return [];
}

export async function importRepliesToConversations(
  _clientId: string,
  _messages: FetchedMessage[],
  _clientEmail?: string | null
): Promise<number> {
  return 0;
}
