# Datenschutzerklärung — Build Brief
### Phase 5.3 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

A German-language privacy policy page, legally required before German-resident users are invited to consent to research participation (Category B or C). This is not optional and not cosmetic — it is the documented basis for processing under GDPR Art. 6(1)(a) and the TTDSG. Without it, the research consent flow must not be activated with real users.

Jurisdiction: Germany. Supervisory authority: BfDI (Bundesbeauftragter für den Datenschutz und die Informationsfreiheit). Cookie law: TTDSG (Telekommunikation-Telemedien-Datenschutz-Gesetz).

---

## New Page: `app/datenschutz/page.tsx`

Static page. No authentication required. Linked from the footer, the research consent flow, and the registration form.

```tsx
export default function DatenschutzPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <DatenschutzContent />
    </main>
  )
}
```

---

## New Component: `components/legal/DatenschutzContent.tsx`

The full policy text. German throughout. Structured as headed sections for readability and legal completeness.

```tsx
export function DatenschutzContent() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      {/* Content below */}
    </article>
  )
}
```

---

## Policy Content

The following is the complete Datenschutzerklärung text. Cursor must render this verbatim inside the component. Every section heading is an `<h2>`, sub-headings `<h3>`.

---

```
Datenschutzerklärung
Stand: Mai 2026

1. Verantwortlicher

Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO):

Sean Fortune
Mind Mechanism
E-Mail: future@theoneleggedpoet.com

Bei Fragen zum Datenschutz wenden Sie sich bitte an die oben genannte
E-Mail-Adresse.

─────────────────────────────────────────────────────────────

2. Grundsatz: Ihre Daten gehören Ihnen

Mind Mechanism ist auf das Prinzip der Datensouveränität ausgelegt. Ihre
persönlichen Vokabeln und Notizen werden auf Ihrem Gerät verschlüsselt,
bevor sie auf unsere Server übertragen werden. Der Betreiber kann diese
verschlüsselten Inhalte nicht lesen. Der Verschlüsselungsschlüssel
verbleibt ausschließlich in Ihrem Browser.

Sie können Ihre vollständigen Daten jederzeit exportieren (DSGVO Art. 20)
und Ihr Konto sowie alle gespeicherten Daten jederzeit löschen lassen
(DSGVO Art. 17).

─────────────────────────────────────────────────────────────

3. Erhobene Daten und Verarbeitungszwecke

3.1 Kontodaten (Kategorie A — Betriebsdaten)

Beim Anlegen eines Kontos erheben wir:
- E-Mail-Adresse
- Selbst gewählter Benutzername
- Zeitstempel der Kontoerstellung

Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. b (Vertragserfüllung)
Speicherdauer: Bis zur Löschung des Kontos

3.2 Nutzungsdaten (Kategorie B — Verhaltensbasierte Forschungsdaten)

Mit Ihrer ausdrücklichen Einwilligung erheben wir anonymisierte Daten
zur Nutzung des Sequenzers:

- Welche Sprachknoten Sie in einer Übungseinheit auswählen
- Sitzungsdauer und -zeitpunkt (auf Kalenderwochen gerundet)
- Ihre 28-tägige Affinitätsprofil-Auswertung

Diese Daten werden anonymisiert gespeichert. Ihr Benutzerkonto ist mit
diesen Daten durch einen einwegverschlüsselten Hash verknüpft — nicht
durch Ihren Namen, Ihre E-Mail-Adresse oder Ihre Firebase-Nutzer-ID.

Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. a (Einwilligung)
Die Einwilligung ist freiwillig, jederzeit widerrufbar und hat keinen
Einfluss auf die Nutzbarkeit der Plattform.

3.3 Akustische Analysedaten (Kategorie C — Sprachaufnahmen)

Mit gesonderter Einwilligung können Sprachmuster lokal auf Ihrem Gerät
analysiert werden. Die Rohdaten der Aufnahmen verlassen Ihr Gerät nicht.
Nur aggregierte, anonymisierte Analyseergebnisse werden übertragen.

Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. a (Einwilligung)
Widerruf: Jederzeit in den Einstellungen unter „Forschungseinwilligung"

3.4 Persönliches Vokabular (Kategorie D — Lokal und verschlüsselt)

Ihre persönlichen Definitionen und Kontextnotizen werden mit AES-256-GCM
auf Ihrem Gerät verschlüsselt. Der Betreiber hat zu keiner Zeit Zugriff
auf diese Inhalte. Der Schlüssel wird ausschließlich im IndexedDB Ihres
Browsers gespeichert.

Verarbeitungsgrundlage: Art. 6 Abs. 1 lit. b (Vertragserfüllung)
Der Betreiber verarbeitet keine Klartextinhalte aus Kategorie D.

─────────────────────────────────────────────────────────────

4. Der Learner's Passport

Mind Mechanism stellt jedem Nutzer einen sogenannten Learner's Passport
zur Verfügung — ein verschlüsselter, nutzergesteuerter Datensilo. Dieser
enthält:

- Ihren persönlichen Wortschatz (verschlüsselt)
- Ihre Übungsfortschritte
- Ihr Einwilligungsprotokoll
- Verifizierte Zertifikate von Institutionen (nur auf Ihre Zustimmung hin)

Ihr Passport ID (Format: MM-XXXX-XXXX-XXXX) ist ein öffentlicher
Bezeichner, der aus Ihrem Verschlüsselungsschlüssel abgeleitet wird. Er
identifiziert den Passport, nicht die Person.

Institutionen können Zugriff auf Teile Ihres Passports beantragen. Sie
entscheiden, ob Sie diesen Zugriff gewähren oder ablehnen. Jeder Zugriff
ist zeitlich begrenzt und vollständig protokolliert.

─────────────────────────────────────────────────────────────

5. Blockchain-Verankerung von Einwilligungen

Einwilligungsereignisse (Erteilung und Widerruf für Kategorie B und C)
werden auf der Polygon PoS-Blockchain verankert. Dabei wird kein
personenbezogenes Datum übertragen.

Was auf der Blockchain gespeichert wird:
Ein doppelt gehashter Bezeichner (SHA-256 des anonymisierten Nutzer-Hashs
kombiniert mit Einwilligungskategorie, Handlung und Kalenderwoche). Dieser
Wert kann nicht auf Ihre Identität zurückgeführt werden.

Zweck: Unabhängige Überprüfbarkeit Ihrer Einwilligungsentscheidungen,
die nicht vom Betreiber verändert werden kann.

Rechtsgrundlage: Berechtigtes Interesse (DSGVO Art. 6 Abs. 1 lit. f) —
Sicherstellung der Integrität des Einwilligungsprotokolls.

Hinweis: Die Einordnung des Blockchain-Eintrags als nicht-personenbezogenes
Datum gemäß DSGVO Art. 4 Nr. 1 ist Gegenstand laufender rechtlicher
Prüfung. Die Funktion ist in der Produktionsumgebung erst nach
Abschluss dieser Prüfung aktiviert.

─────────────────────────────────────────────────────────────

6. Dienstleister und Drittanbieter

6.1 Firebase / Google Cloud (Firestore, Authentication)
Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4
Zweck: Kontoauthentifizierung und verschlüsselte Datenspeicherung
Standardvertragsklauseln: abgeschlossen
Datenschutzerklärung: https://firebase.google.com/support/privacy

6.2 Vercel (Hosting)
Anbieter: Vercel Inc., 340 Pine Street Suite 603, San Francisco, CA 94104
Zweck: Bereitstellung der Webanwendung
Datenschutzerklärung: https://vercel.com/legal/privacy-policy

6.3 Polygon PoS (Blockchain)
Eine öffentliche, dezentrale Blockchain. Transaktionen sind dauerhaft
und öffentlich einsehbar. Die übertragenen Daten enthalten keine
personenbezogenen Informationen (siehe Abschnitt 5).

─────────────────────────────────────────────────────────────

7. Lokaler Speicher (TTDSG)

Wir nutzen folgende Technologien für die Funktionsfähigkeit der
Anwendung:

- localStorage / sessionStorage: Sitzungszustand, Theme-Einstellung
- IndexedDB: Verschlüsselungsschlüssel (Passport Key), Anwendungsdaten
- Keine Tracking-Cookies von Drittanbietern
- Keine Werbecookies

Rechtsgrundlage: TTDSG § 25 Abs. 2 Nr. 2 (technisch notwendig)

Eine Einwilligung nach TTDSG § 25 Abs. 1 ist für diese Nutzung nicht
erforderlich, da die Speicherung ausschließlich zur Bereitstellung der
vom Nutzer ausdrücklich gewünschten Funktionen dient.

─────────────────────────────────────────────────────────────

8. Ihre Rechte (DSGVO Art. 15–22)

Sie haben das Recht auf:

- Auskunft (Art. 15): Welche Daten wir über Sie gespeichert haben
- Berichtigung (Art. 16): Korrektur unrichtiger Daten
- Löschung (Art. 17): Vollständige Löschung Ihres Kontos und aller Daten
- Einschränkung (Art. 18): Verarbeitung einschränken
- Datenübertragbarkeit (Art. 20): Export Ihrer vollständigen Daten als
  maschinenlesbares JSON — jederzeit abrufbar unter „Mein Protokoll"
- Widerspruch (Art. 21): Verarbeitung auf Grundlage berechtigten Interesses
- Widerruf der Einwilligung (Art. 7 Abs. 3): Jederzeit, ohne Angabe von
  Gründen, ohne Nachteile für die Plattformnutzung

Zur Ausübung Ihrer Rechte wenden Sie sich an: future@theoneleggedpoet.com

─────────────────────────────────────────────────────────────

9. Beschwerderecht

Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu
beschweren:

Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)
Graurheindorfer Str. 153
53117 Bonn
https://www.bfdi.bund.de

─────────────────────────────────────────────────────────────

10. Änderungen dieser Erklärung

Bei wesentlichen Änderungen werden angemeldete Nutzer per E-Mail
informiert. Das Datum der letzten Aktualisierung steht oben.

─────────────────────────────────────────────────────────────

Mind Mechanism — Datenschutzerklärung
Stand: Mai 2026
```

---

## Footer Link

### File: wherever the app footer component lives

Add a link to `/datenschutz` in the footer alongside any existing legal links:

```tsx
<Link href="/datenschutz" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
  Datenschutz
</Link>
```

## Research Consent Flow Link

### File: `components/research/ResearchConsentFlow.tsx`

On the consent screen, add a link to the Datenschutzerklärung:

```tsx
<p className="text-xs text-gray-400 mt-4">
  Weitere Informationen:{' '}
  <Link href="/datenschutz" target="_blank" className="underline underline-offset-2">
    Datenschutzerklärung
  </Link>
</p>
```

## Registration Form Link

### File: `app/register/page.tsx`

Add to the registration form below the submit button:

```tsx
<p className="text-xs text-gray-400 mt-3 text-center">
  Mit der Registrierung stimmen Sie unserer{' '}
  <Link href="/datenschutz" className="underline underline-offset-2">
    Datenschutzerklärung
  </Link>{' '}
  zu.
</p>
```

---

## Files to Create

```
app/datenschutz/page.tsx
components/legal/DatenschutzContent.tsx
```

## Files to Modify

```
components/layout/Footer.tsx          — add Datenschutz link
components/research/ResearchConsentFlow.tsx  — add Datenschutz link
app/register/page.tsx                 — add Datenschutz consent notice
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/lexiconAnchor.ts
```

---

## What This Unblocks

Once this page is live, the research consent flow can be activated with German-resident users. This is the final legal prerequisite identified in `AUDITABILITY_NOTE.md` for inviting real users to consent to Category B and C research participation.

The dataset begins growing. Phase 4.4 (academic publication) moves from theoretical to calendared.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 5.3 of PASSPORT_ROADMAP.md*
*Jurisdiction: Germany — BfDI — TTDSG*
*This policy should be reviewed by a qualified German data protection lawyer before production activation of Category B/C research consent.*
