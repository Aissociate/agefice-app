import Anthropic from "@anthropic-ai/sdk";

export interface Avantage {
  emoji: string;
  titre: string;
  description: string;
}
export interface Temoignage {
  nom: string;
  poste: string;
  texte: string;
}
export interface FaqItem {
  question: string;
  reponse: string;
}

export interface LandingContenu {
  headline: string;
  subheadline: string;
  cta_texte: string;
  cta_sous_texte: string;
  proposition_valeur: string;
  avantages: Avantage[];
  preuve_sociale: string;
  temoignage: Temoignage;
  urgence: string;
  faq: FaqItem[];
  meta_description: string;
}

export interface GenerateParams {
  sujet: string;
  publicCible: string;
  offre: string;
  template: string;
  angle: string;
  palette: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  formation:   "formation professionnelle",
  lead_magnet: "lead magnet / capture d'emails",
  service:     "service B2B",
  evenement:   "événement / webinaire",
};

export async function generateLandingPage(params: GenerateParams): Promise<LandingContenu> {
  const { sujet, publicCible, offre, template, angle, palette } = params;

  const prompt = `Tu es expert en copywriting, conversion web et marketing digital.

Génère le contenu d'une landing page de type "${TEMPLATE_LABELS[template] ?? template}" en JSON strict.

Contexte :
- Sujet / produit : ${sujet}
- Public cible : ${publicCible || "chefs d'entreprise"}
- Offre principale : ${offre || sujet}
- Angle / différenciateur de cette variante : ${angle}
- Palette : ${palette}

Règles copywriting :
- Headline : bénéfice principal, max 10 mots, percutant
- CTA : verbe d'action + bénéfice (ex: "Démarrer gratuitement")
- Avantages : 4 items concrets, orientés résultats
- Témoignage : crédible, chiffré si possible
- Urgence : FOMO ou limite de places/temps (ne pas laisser vide)
- FAQ : 3 objections réelles du public cible

Réponds UNIQUEMENT avec ce JSON (zéro texte autour, zéro markdown) :
{
  "headline": "string",
  "subheadline": "string",
  "cta_texte": "string",
  "cta_sous_texte": "string",
  "proposition_valeur": "string (2-3 phrases)",
  "avantages": [
    {"emoji": "🎯", "titre": "string", "description": "string (1 phrase)"}
  ],
  "preuve_sociale": "string (chiffre clé ex: '200+ entreprises formées')",
  "temoignage": {"nom": "string", "poste": "string", "texte": "string"},
  "urgence": "string",
  "faq": [
    {"question": "string", "reponse": "string"}
  ],
  "meta_description": "string (max 155 caractères)"
}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as LandingContenu;
}
