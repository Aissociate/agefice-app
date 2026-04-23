import Anthropic from "@anthropic-ai/sdk";

export interface SectionBlog {
  titre: string;
  contenu: string;
}

export interface BlogPostGenere {
  titre: string;
  accroche: string;
  introduction: string;
  sections: SectionBlog[];
  conclusion: string;
  mots_cles: string[];
  hashtags: string[];
  photo_suggestion: string;
}

interface Params {
  sujet: string;
  ton: string;
  longueur: string;
  publicCible: string;
}

export async function generateBlogPost(params: Params): Promise<BlogPostGenere> {
  const { sujet, ton, longueur, publicCible } = params;
  const nombreSections = longueur === "court" ? 2 : longueur === "long" ? 5 : 3;

  const prompt = `Tu es un expert en rédaction de contenu marketing pour organismes de formation professionnelle.

Génère un post de blog professionnel en JSON sur :
- Sujet : ${sujet}
- Ton : ${ton}
- Public cible : ${publicCible}
- Nombre de sections : ${nombreSections}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte autour) :
{
  "titre": "Titre accrocheur",
  "accroche": "Phrase d'accroche courte et percutante (1-2 phrases)",
  "introduction": "Introduction engageante (2-3 paragraphes)",
  "sections": [
    {"titre": "Titre section 1", "contenu": "Contenu détaillé de la section..."},
    {"titre": "Titre section 2", "contenu": "Contenu détaillé de la section..."}
  ],
  "conclusion": "Conclusion avec call-to-action",
  "mots_cles": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "photo_suggestion": "keyword in English for stock photo (e.g. business training professional)"
}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as BlogPostGenere;
}
