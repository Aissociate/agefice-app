# AGEFICE App

Application Next.js de gestion des dossiers de financement AGEFICE pour
l'organisme de formation **AIssociate** (certifié Qualiopi n°814211-1).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Prisma 7** avec `@prisma/adapter-libsql` + `@libsql/client` (SQLite via libSQL)
- React Hook Form + Zod, date-fns, lucide-react, recharts
- Anthropic SDK pour la prospection IA

## Lancer le projet

### En local (Node ≥ 20)

```bash
npm install        # déclenche prisma generate + prisma db push
npm run seed       # optionnel : données de démo
npm run dev        # http://localhost:3000
```

### Sur [Bolt.new](https://bolt.new)

1. Pousse ce repo sur GitHub.
2. Ouvre `https://bolt.new/github.com/<ton-user>/<ton-repo>`.
3. Bolt installe les deps automatiquement (le `postinstall` initialise la base).
4. Configure les variables d'env dans l'UI Bolt (voir `.env.example`).

## Limites Bolt.new / WebContainer

WebContainer n'exécute pas de binaires natifs ni de sockets TCP bruts.
Les modules suivants sont **stubbés** pour rester compatibles :

| Module | Remplacement |
|---|---|
| `lib/htmlToPdf.ts` (Puppeteer) | `throw` — désactivé |
| `lib/imap.ts` (ImapFlow) | retourne `[]` — désactivé |
| `lib/mailer.ts` (Nodemailer SMTP) | `throw` — désactivé |

Pour réactiver email/PDF en production, déployer sur Vercel/VPS et brancher un
service HTTP (Resend, Postmark, `@sparticuz/chromium`…).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de dev Next.js |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run seed` | Insère les données de démo |
| `npm run db:setup` | Push schéma + seed |
| `npm run db:studio` | Ouvre Prisma Studio |

## Structure

- `app/(dashboard)/` — pages authentifiées (clients, dossiers, formations…)
- `app/api/` — routes API (App Router)
- `lib/db.ts` — client Prisma (`prisma`, pas `db`)
- `prisma/schema.prisma` — modèles SQLite
