/**
 * German privacy policy (Datenschutzerklärung) — text fixed per DATENSCHUTZ_BRIEF.md Phase 5.3.
 */
export function DatenschutzContent() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <h1 className="mb-2 font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Datenschutzerklärung
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Stand: Mai 2026</p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">1. Verantwortlicher</h2>
      <p>
        Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO):
      </p>
      <p>
        Sean Fortune
        <br />
        Mind Mechanism
        <br />
        E-Mail: future@theoneleggedpoet.com
      </p>
      <p>
        Bei Fragen zum Datenschutz wenden Sie sich bitte an die oben genannte
        E-Mail-Adresse.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">2. Grundsatz: Ihre Daten gehören Ihnen</h2>
      <p>
        Mind Mechanism ist auf das Prinzip der Datensouveränität ausgelegt. Ihre
        persönlichen Vokabeln und Notizen werden auf Ihrem Gerät verschlüsselt,
        bevor sie auf unsere Server übertragen werden. Der Betreiber kann diese
        verschlüsselten Inhalte nicht lesen. Der Verschlüsselungsschlüssel
        verbleibt ausschließlich in Ihrem Browser.
      </p>
      <p>
        Sie können Ihre vollständigen Daten jederzeit exportieren (DSGVO Art. 20)
        und Ihr Konto sowie alle gespeicherten Daten jederzeit löschen lassen
        (DSGVO Art. 17).
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">3. Erhobene Daten und Verarbeitungszwecke</h2>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">3.1 Kontodaten (Kategorie A — Betriebsdaten)</h3>
      <p>Beim Anlegen eines Kontos erheben wir:</p>
      <ul>
        <li>E-Mail-Adresse</li>
        <li>Selbst gewählter Benutzername</li>
        <li>Zeitstempel der Kontoerstellung</li>
      </ul>
      <p>
        Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. b (Vertragserfüllung)
        <br />
        Speicherdauer: Bis zur Löschung des Kontos
      </p>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">3.2 Nutzungsdaten (Kategorie B — Verhaltensbasierte Forschungsdaten)</h3>
      <p>
        Mit Ihrer ausdrücklichen Einwilligung erheben wir anonymisierte Daten
        zur Nutzung des Sequenzers:
      </p>
      <ul>
        <li>Welche Sprachknoten Sie in einer Übungseinheit auswählen</li>
        <li>Sitzungsdauer und -zeitpunkt (auf Kalenderwochen gerundet)</li>
        <li>Ihre 28-tägige Affinitätsprofil-Auswertung</li>
      </ul>
      <p>
        Diese Daten werden anonymisiert gespeichert. Ihr Benutzerkonto ist mit
        diesen Daten durch einen einwegverschlüsselten Hash verknüpft — nicht
        durch Ihren Namen, Ihre E-Mail-Adresse oder Ihre Firebase-Nutzer-ID.
      </p>
      <p>
        Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. a (Einwilligung)
        <br />
        Die Einwilligung ist freiwillig, jederzeit widerrufbar und hat keinen
        Einfluss auf die Nutzbarkeit der Plattform.
      </p>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">3.3 Akustische Analysedaten (Kategorie C — Sprachaufnahmen)</h3>
      <p>
        Mit gesonderter Einwilligung können Sprachmuster lokal auf Ihrem Gerät
        analysiert werden. Die Rohdaten der Aufnahmen verlassen Ihr Gerät nicht.
        Nur aggregierte, anonymisierte Analyseergebnisse werden übertragen.
      </p>
      <p>
        Rechtsgrundlage: DSGVO Art. 6 Abs. 1 lit. a (Einwilligung)
        <br />
        Widerruf: Jederzeit in den Einstellungen unter „Forschungseinwilligung&quot;
      </p>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">3.4 Persönliches Vokabular (Kategorie D — Lokal und verschlüsselt)</h3>
      <p>
        Ihre persönlichen Definitionen und Kontextnotizen werden mit AES-256-GCM
        auf Ihrem Gerät verschlüsselt. Der Betreiber hat zu keiner Zeit Zugriff
        auf diese Inhalte. Der Schlüssel wird ausschließlich im IndexedDB Ihres
        Browsers gespeichert.
      </p>
      <p>
        Verarbeitungsgrundlage: Art. 6 Abs. 1 lit. b (Vertragserfüllung)
        <br />
        Der Betreiber verarbeitet keine Klartextinhalte aus Kategorie D.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">4. Der Learner&apos;s Passport</h2>
      <p>
        Mind Mechanism stellt jedem Nutzer einen sogenannten Learner&apos;s Passport
        zur Verfügung — ein verschlüsselter, nutzergesteuerter Datensilo. Dieser
        enthält:
      </p>
      <ul>
        <li>Ihren persönlichen Wortschatz (verschlüsselt)</li>
        <li>Ihre Übungsfortschritte</li>
        <li>Ihr Einwilligungsprotokoll</li>
        <li>Verifizierte Zertifikate von Institutionen (nur auf Ihre Zustimmung hin)</li>
      </ul>
      <p>
        Ihr Passport ID (Format: MM-XXXX-XXXX-XXXX) ist ein öffentlicher
        Bezeichner, der aus Ihrem Verschlüsselungsschlüssel abgeleitet wird. Er
        identifiziert den Passport, nicht die Person.
      </p>
      <p>
        Institutionen können Zugriff auf Teile Ihres Passports beantragen. Sie
        entscheiden, ob Sie diesen Zugriff gewähren oder ablehnen. Jeder Zugriff
        ist zeitlich begrenzt und vollständig protokolliert.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">5. Blockchain-Verankerung von Einwilligungen</h2>
      <p>
        Einwilligungsereignisse (Erteilung und Widerruf für Kategorie B und C)
        werden auf der Polygon PoS-Blockchain verankert. Dabei wird kein
        personenbezogenes Datum übertragen.
      </p>
      <p>Was auf der Blockchain gespeichert wird:</p>
      <p>
        Ein doppelt gehashter Bezeichner (SHA-256 des anonymisierten Nutzer-Hashs
        kombiniert mit Einwilligungskategorie, Handlung und Kalenderwoche). Dieser
        Wert kann nicht auf Ihre Identität zurückgeführt werden.
      </p>
      <p>
        Zweck: Unabhängige Überprüfbarkeit Ihrer Einwilligungsentscheidungen,
        die nicht vom Betreiber verändert werden kann.
      </p>
      <p>
        Rechtsgrundlage: Berechtigtes Interesse (DSGVO Art. 6 Abs. 1 lit. f) —
        Sicherstellung der Integrität des Einwilligungsprotokolls.
      </p>
      <p>
        Hinweis: Die Einordnung des Blockchain-Eintrags als nicht-personenbezogenes
        Datum gemäß DSGVO Art. 4 Nr. 1 ist Gegenstand laufender rechtlicher
        Prüfung. Die Funktion ist in der Produktionsumgebung erst nach
        Abschluss dieser Prüfung aktiviert.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">6. Dienstleister und Drittanbieter</h2>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">6.1 Firebase / Google Cloud (Firestore, Authentication)</h3>
      <p>
        Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4
        <br />
        Zweck: Kontoauthentifizierung und verschlüsselte Datenspeicherung
        <br />
        Standardvertragsklauseln: abgeschlossen
        <br />
        Datenschutzerklärung:{' '}
        <a
          href="https://firebase.google.com/support/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 underline underline-offset-2 dark:text-violet-400"
        >
          https://firebase.google.com/support/privacy
        </a>
      </p>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">6.2 Vercel (Hosting)</h3>
      <p>
        Anbieter: Vercel Inc., 340 Pine Street Suite 603, San Francisco, CA 94104
        <br />
        Zweck: Bereitstellung der Webanwendung
        <br />
        Datenschutzerklärung:{' '}
        <a
          href="https://vercel.com/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 underline underline-offset-2 dark:text-violet-400"
        >
          https://vercel.com/legal/privacy-policy
        </a>
      </p>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">6.3 Polygon PoS (Blockchain)</h3>
      <p>
        Eine öffentliche, dezentrale Blockchain. Transaktionen sind dauerhaft
        und öffentlich einsehbar. Die übertragenen Daten enthalten keine
        personenbezogenen Informationen (siehe Abschnitt 5).
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">7. Lokaler Speicher (TTDSG)</h2>
      <p>
        Wir nutzen folgende Technologien für die Funktionsfähigkeit der
        Anwendung:
      </p>
      <ul>
        <li>localStorage / sessionStorage: Sitzungszustand, Theme-Einstellung</li>
        <li>IndexedDB: Verschlüsselungsschlüssel (Passport Key), Anwendungsdaten</li>
        <li>Keine Tracking-Cookies von Drittanbietern</li>
        <li>Keine Werbecookies</li>
      </ul>
      <p>
        Rechtsgrundlage: TTDSG § 25 Abs. 2 Nr. 2 (technisch notwendig)
      </p>
      <p>
        Eine Einwilligung nach TTDSG § 25 Abs. 1 ist für diese Nutzung nicht
        erforderlich, da die Speicherung ausschließlich zur Bereitstellung der
        vom Nutzer ausdrücklich gewünschten Funktionen dient.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">8. Ihre Rechte (DSGVO Art. 15–22)</h2>
      <p>Sie haben das Recht auf:</p>
      <ul>
        <li>Auskunft (Art. 15): Welche Daten wir über Sie gespeichert haben</li>
        <li>Berichtigung (Art. 16): Korrektur unrichtiger Daten</li>
        <li>Löschung (Art. 17): Vollständige Löschung Ihres Kontos und aller Daten</li>
        <li>Einschränkung (Art. 18): Verarbeitung einschränken</li>
        <li>
          Datenübertragbarkeit (Art. 20): Export Ihrer vollständigen Daten als
          maschinenlesbares JSON — jederzeit abrufbar unter „Mein Protokoll&quot;
        </li>
        <li>Widerspruch (Art. 21): Verarbeitung auf Grundlage berechtigten Interesses</li>
        <li>
          Widerruf der Einwilligung (Art. 7 Abs. 3): Jederzeit, ohne Angabe von
          Gründen, ohne Nachteile für die Plattformnutzung
        </li>
      </ul>
      <p>
        Zur Ausübung Ihrer Rechte wenden Sie sich an: future@theoneleggedpoet.com
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">9. Beschwerderecht</h2>
      <p>
        Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu
        beschweren:
      </p>
      <p>
        Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)
        <br />
        Graurheindorfer Str. 153
        <br />
        53117 Bonn
        <br />
        <a
          href="https://www.bfdi.bund.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 underline underline-offset-2 dark:text-violet-400"
        >
          https://www.bfdi.bund.de
        </a>
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">10. Änderungen dieser Erklärung</h2>
      <p>
        Bei wesentlichen Änderungen werden angemeldete Nutzer per E-Mail
        informiert. Das Datum der letzten Aktualisierung steht oben.
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <p className="text-center text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
        Mind Mechanism — Datenschutzerklärung
        <br />
        Stand: Mai 2026
      </p>
    </article>
  )
}
