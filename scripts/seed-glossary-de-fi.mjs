/**
 * Seed German (de) and Finnish (fi) system glossary words into Firestore.
 *
 * Usage:
 *   node scripts/seed-glossary-de-fi.mjs [--dry-run]
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var or serviceAccount.json in project root.
 * Safe to re-run — uses a composite key check to skip existing entries.
 *
 * NOTE: firebase-admin's readable-stream dependency is incompatible with Node 24.
 * Run with Node 18 or 20: `nvm use 20 && node scripts/seed-glossary-de-fi.mjs`
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Firebase ──────────────────────────────────────────────────────────────
let serviceAccount
const saPath = resolve(process.cwd(), 'serviceAccount.json')
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else if (existsSync(saPath)) {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
} else {
  console.error('No service account found. Set FIREBASE_SERVICE_ACCOUNT or place serviceAccount.json in project root.')
  process.exit(1)
}

if (!DRY_RUN) {
  initializeApp({ credential: cert(serviceAccount) })
}
const db = DRY_RUN ? null : getFirestore()

// ─── Word data ─────────────────────────────────────────────────────────────
// Each entry: { word, definition, language, clock_id }
// clock_id 0–8: ROOT, SACRAL, SOLAR PLEXUS, HEART, THROAT, THIRD EYE, MALE CROWN, FEMALE CROWN, ETHERIC HEART

const WORDS = [

  // ── CLOCK 0 — ROOT ──────────────────────────────────────────────────────
  { word: 'Leistung',       definition: 'Das Erreichen eines bedeutsamen Ziels durch bewusste Anstrengung.',         language: 'de', clock_id: 0 },
  { word: 'Bereitschaft',   definition: 'Die innere Offenheit, neue Erfahrungen zuzulassen und zu empfangen.',       language: 'de', clock_id: 0 },
  { word: 'Vitalität',      definition: 'Die lebendige Kraft, die Körper und Geist in Bewegung hält.',               language: 'de', clock_id: 0 },
  { word: 'Kühnheit',       definition: 'Der Mut, mutig voranzuschreiten trotz Unsicherheit oder Risiko.',           language: 'de', clock_id: 0 },
  { word: 'Einsicht',       definition: 'Das tiefe Verstehen, das unter der Oberfläche einer Situation liegt.',      language: 'de', clock_id: 0 },
  { word: 'Beherrschung',   definition: 'Die Fähigkeit, eine Situation mit Klarheit und Autorität zu führen.',       language: 'de', clock_id: 0 },
  { word: 'Reflexion',      definition: 'Das bewusste Zurückschauen, um aus Erlebnissen zu lernen.',                 language: 'de', clock_id: 0 },
  { word: 'Illusion',       definition: 'Eine Wahrnehmung, die die Wirklichkeit verbirgt oder verzerrt.',            language: 'de', clock_id: 0 },

  { word: 'Saavutus',       definition: 'Merkityksellisen tavoitteen saavuttaminen tietoisella ponnistuksella.',     language: 'fi', clock_id: 0 },
  { word: 'Halukkuus',      definition: 'Sisäinen avoimuus ottaa vastaan uusia kokemuksia.',                         language: 'fi', clock_id: 0 },
  { word: 'Elinvoima',      definition: 'Elävä voima, joka pitää kehon ja mielen liikkeessä.',                      language: 'fi', clock_id: 0 },
  { word: 'Rohkeus',        definition: 'Rohkeus edetä epävarmuudesta huolimatta.',                                  language: 'fi', clock_id: 0 },
  { word: 'Oivallus',       definition: 'Syvä ymmärrys, joka piilee tilanteen pinnan alla.',                        language: 'fi', clock_id: 0 },
  { word: 'Hallinta',       definition: 'Kyky johtaa tilannetta selkeydellä ja auktoriteetilla.',                   language: 'fi', clock_id: 0 },
  { word: 'Pohdinta',       definition: 'Tietoinen taaksepäin katsominen kokemusten oppimiseksi.',                  language: 'fi', clock_id: 0 },
  { word: 'Illuusio',       definition: 'Havainto, joka piilottaa tai vääristää todellisuuden.',                    language: 'fi', clock_id: 0 },

  // ── CLOCK 1 — SACRAL ────────────────────────────────────────────────────
  { word: 'Vereinigung',    definition: 'Das Zusammenfließen zweier getrennter Kräfte zu einem Ganzen.',             language: 'de', clock_id: 1 },
  { word: 'Robustheit',     definition: 'Die Fähigkeit, Belastungen standzuhalten und dennoch geerdet zu bleiben.', language: 'de', clock_id: 1 },
  { word: 'Einsichtsvoll',  definition: 'Die Gabe, die verborgenen Zusammenhänge einer Situation zu erkennen.',     language: 'de', clock_id: 1 },
  { word: 'Bescheidenheit', definition: 'Das ruhige Wissen um den eigenen Wert, ohne darüber zu prahlen.',          language: 'de', clock_id: 1 },
  { word: 'Überraschung',   definition: 'Das Erwachen der Aufmerksamkeit durch das Unerwartete.',                   language: 'de', clock_id: 1 },
  { word: 'Freudlosigkeit', definition: 'Der Zustand, in dem die Fähigkeit zur Freude blockiert oder eingefroren ist.', language: 'de', clock_id: 1 },

  { word: 'Yhteys',         definition: 'Kahden erillisen voiman virtaaminen yhteen kokonaisuudeksi.',              language: 'fi', clock_id: 1 },
  { word: 'Vahvuus',        definition: 'Kyky kestää paineita pysyen silti maadoittuneena.',                       language: 'fi', clock_id: 1 },
  { word: 'Oivaltavuus',    definition: 'Lahja nähdä tilanteen piilotetut yhteydet.',                              language: 'fi', clock_id: 1 },
  { word: 'Vaatimattomuus', definition: 'Hiljainen tieto omasta arvosta ylpeyttä näyttämättä.',                     language: 'fi', clock_id: 1 },
  { word: 'Yllätys',        definition: 'Odottamaton herättää tarkkaavaisuuden.',                                   language: 'fi', clock_id: 1 },
  { word: 'Ilottomuus',     definition: 'Tila, jossa ilon kyky on tukossa tai jäätynyt.',                          language: 'fi', clock_id: 1 },

  // ── CLOCK 2 — SOLAR PLEXUS ──────────────────────────────────────────────
  { word: 'Unkontrolliert',    definition: 'Eine Energie oder ein Verhalten, das über normale Grenzen hinausschießt.', language: 'de', clock_id: 2 },
  { word: 'Bewirkend',         definition: 'Die aktive Kraft, die Veränderungen im Außen herbeiführt.',                language: 'de', clock_id: 2 },
  { word: 'Bergung',           definition: 'Das Retten von etwas Wertvollem aus einer schwierigen Situation.',         language: 'de', clock_id: 2 },
  { word: 'Tosend',            definition: 'Eine lautstarke, bewegungsvolle Energie, die sich entlädt.',               language: 'de', clock_id: 2 },
  { word: 'Ansprüche',         definition: 'Übertriebene Erwartungen, die über die eigentliche Notwendigkeit hinausgehen.', language: 'de', clock_id: 2 },
  { word: 'Lüsternheit',       definition: 'Ein übermäßiges Verlangen, das über ethische Grenzen tritt.',              language: 'de', clock_id: 2 },
  { word: 'Ziel',              definition: 'Der Fokuspunkt, auf den Absicht und Energie ausgerichtet sind.',            language: 'de', clock_id: 2 },
  { word: 'Wiedergeburt',      definition: 'Das Entstehen einer neuen Kraft oder Identität nach dem Loslassen des Alten.', language: 'de', clock_id: 2 },
  { word: 'Ausgelassenheit',   definition: 'Eine überfließende Lebensfreude, die sich in Überschuss äußert.',           language: 'de', clock_id: 2 },
  { word: 'Drang',             definition: 'Ein innerer Impuls, der nach Ausdruck oder Erfüllung verlangt.',             language: 'de', clock_id: 2 },

  { word: 'Hillitön',          definition: 'Energia tai käyttäytyminen, joka ylittää normaalit rajat.',               language: 'fi', clock_id: 2 },
  { word: 'Aiheuttava',        definition: 'Aktiivinen voima, joka saa aikaan muutoksia ulkoisessa maailmassa.',      language: 'fi', clock_id: 2 },
  { word: 'Pelastus',          definition: 'Jonkin arvokkaan pelastaminen vaikeasta tilanteesta.',                    language: 'fi', clock_id: 2 },
  { word: 'Jylisevä',          definition: 'Äänekäs, liikkeellinen energia, joka purkautuu.',                        language: 'fi', clock_id: 2 },
  { word: 'Teeskentely',       definition: 'Liioitellut odotukset, jotka ylittävät todellisen tarpeen.',              language: 'fi', clock_id: 2 },
  { word: 'Rivous',            definition: 'Liiallinen halu, joka ylittää eettiset rajat.',                          language: 'fi', clock_id: 2 },
  { word: 'Päämäärä',          definition: 'Kohde, johon aikomus ja energia suuntautuvat.',                          language: 'fi', clock_id: 2 },
  { word: 'Uudestisynty',      definition: 'Uuden voiman syntyminen vanhan päästämisen jälkeen.',                    language: 'fi', clock_id: 2 },
  { word: 'Rehevyys',          definition: 'Ylivuotava elämänilo, joka ilmenee runsaudessa.',                        language: 'fi', clock_id: 2 },
  { word: 'Halu',              definition: 'Sisäinen impulssi, joka vaatii ilmaisua tai täyttymistä.',               language: 'fi', clock_id: 2 },

  // ── CLOCK 3 — HEART ─────────────────────────────────────────────────────
  { word: 'Ausbalancieren',   definition: 'Gegensätzliche Kräfte in ein stabiles Gleichgewicht bringen.',            language: 'de', clock_id: 3 },
  { word: 'Eintauchen',       definition: 'Sich vollständig in eine Erfahrung hineinversenken.',                     language: 'de', clock_id: 3 },
  { word: 'Anziehen',         definition: 'Die Kraft, die andere Menschen oder Möglichkeiten ins eigene Leben zieht.', language: 'de', clock_id: 3 },
  { word: 'Neugier',          definition: 'Das lebendige Interesse an dem, was noch unbekannt ist.',                  language: 'de', clock_id: 3 },
  { word: 'Zusammenstoßen',   definition: 'Das Aufeinanderprallen zweier Kräfte oder Standpunkte.',                  language: 'de', clock_id: 3 },
  { word: 'Sorge',            definition: 'Die mitfühlende Aufmerksamkeit für das Wohlergehen anderer.',              language: 'de', clock_id: 3 },
  { word: 'Schicksal',        definition: 'Die Linie, die das eigene Leben durch Wahl und Notwendigkeit zieht.',     language: 'de', clock_id: 3 },
  { word: 'Herrschsucht',     definition: 'Das Bedürfnis, andere durch Dominanz zu kontrollieren.',                  language: 'de', clock_id: 3 },
  { word: 'Lebenskraft',      definition: 'Die grundlegende vitale Energie, die allem Lebendigen zugrunde liegt.',   language: 'de', clock_id: 3 },
  { word: 'Schützend',        definition: 'Die Handlung, andere vor Schaden zu bewahren.',                           language: 'de', clock_id: 3 },
  { word: 'Triumphieren',     definition: 'Das Erleben des Sieges nach einer großen Herausforderung.',               language: 'de', clock_id: 3 },
  { word: 'Selbstgefälligkeit', definition: 'Übermäßige Beschäftigung mit dem eigenen Äußeren oder Prestige.',      language: 'de', clock_id: 3 },

  { word: 'Tasapainottaminen', definition: 'Vastakkaisten voimien tuominen vakaaseen tasapainoon.',                  language: 'fi', clock_id: 3 },
  { word: 'Syventyminen',     definition: 'Täydellinen uppoutuminen johonkin kokemukseen.',                          language: 'fi', clock_id: 3 },
  { word: 'Vetäminen',        definition: 'Voima, joka vetää muita ihmisiä tai mahdollisuuksia elämään.',           language: 'fi', clock_id: 3 },
  { word: 'Uteliaisuus',      definition: 'Elävä kiinnostus siihen, mikä on vielä tuntematonta.',                   language: 'fi', clock_id: 3 },
  { word: 'Törmääminen',      definition: 'Kahden voiman tai näkökulman yhteentörmäys.',                            language: 'fi', clock_id: 3 },
  { word: 'Huoli',            definition: 'Myötätuntoinen huomio toisten hyvinvointiin.',                           language: 'fi', clock_id: 3 },
  { word: 'Kohtalo',          definition: 'Viiva, jonka oma elämä piirtää valinnan ja välttämättömyyden kautta.',   language: 'fi', clock_id: 3 },
  { word: 'Ylimielisyys',     definition: 'Tarve hallita muita dominanssin kautta.',                                language: 'fi', clock_id: 3 },
  { word: 'Elämänvoima',      definition: 'Perustava vitaalienergia, joka on kaiken elävän pohjana.',               language: 'fi', clock_id: 3 },
  { word: 'Suojeleminen',     definition: 'Toisten suojeleminen vahingoilta.',                                      language: 'fi', clock_id: 3 },
  { word: 'Riemuvoitto',      definition: 'Voiton kokemus suuren haasteen jälkeen.',                               language: 'fi', clock_id: 3 },
  { word: 'Ehostaminen',      definition: 'Liiallinen kiinnittyminen omaan ulkonäköön tai arvovaltaan.',            language: 'fi', clock_id: 3 },

  // ── CLOCK 4 — THROAT ────────────────────────────────────────────────────
  { word: 'Resonieren',        definition: 'Im Einklang mit einer Idee, einem Klang oder einer Person schwingen.',   language: 'de', clock_id: 4 },
  { word: 'Versenken',         definition: 'Sich tief in eine Erfahrung oder einen Zustand hineinbewegen.',          language: 'de', clock_id: 4 },
  { word: 'Rechtschaffen',     definition: 'In Übereinstimmung mit ethischen oder moralischen Werten handeln.',     language: 'de', clock_id: 4 },
  { word: 'Zwang',             definition: 'Ein innerer Druck, der ein Verhalten unwiderstehlich erscheinen lässt.', language: 'de', clock_id: 4 },
  { word: 'Sehnsucht',         definition: 'Ein tiefes Verlangen nach etwas, das noch nicht erfüllt ist.',           language: 'de', clock_id: 4 },
  { word: 'Anpassen',          definition: 'Die Fähigkeit, sich an veränderte Bedingungen flexibel anzupassen.',     language: 'de', clock_id: 4 },
  { word: 'Fördern',           definition: 'Das Wachstum oder die Entwicklung anderer aktiv unterstützen.',          language: 'de', clock_id: 4 },
  { word: 'Zurschaustellen',   definition: 'Die eigenen Qualitäten oder Besitztümer übertrieben präsentieren.',     language: 'de', clock_id: 4 },
  { word: 'Eintreten',         definition: 'Sich aktiv für eine Sache oder eine Person einsetzen.',                  language: 'de', clock_id: 4 },
  { word: 'Bezaubernd',        definition: 'Die Eigenschaft, andere durch Charme oder Täuschung zu fesseln.',        language: 'de', clock_id: 4 },
  { word: 'Lähmend',           definition: 'Eine Kraft oder ein Glaube, der Handlungsfähigkeit hemmt.',              language: 'de', clock_id: 4 },
  { word: 'Reparieren',        definition: 'Das Wiederherstellen von etwas Gebrochenem oder Beschädigtem.',          language: 'de', clock_id: 4 },
  { word: 'Transformieren',    definition: 'Eine grundlegende Veränderung der Form oder des Wesens bewirken.',       language: 'de', clock_id: 4 },
  { word: 'Schwebe',           definition: 'Einen Zustand des Innehaltens zwischen zwei Zuständen halten.',          language: 'de', clock_id: 4 },
  { word: 'Umpflanzen',        definition: 'Etwas in einen neuen Kontext oder eine neue Umgebung versetzen.',        language: 'de', clock_id: 4 },
  { word: 'Wiederverarbeiten', definition: 'Erlebnisse oder Informationen erneut durcharbeiten, um sie zu integrieren.', language: 'de', clock_id: 4 },

  { word: 'Resonointi',        definition: 'Värähtely yhteen jonkin idean, äänen tai ihmisen kanssa.',              language: 'fi', clock_id: 4 },
  { word: 'Uppoutuminen',      definition: 'Syvälle jonkin kokemuksen tai tilan liikkuminen.',                      language: 'fi', clock_id: 4 },
  { word: 'Vanhurskaus',       definition: 'Toimiminen eettisten tai moraalisten arvojen mukaisesti.',              language: 'fi', clock_id: 4 },
  { word: 'Pakko',             definition: 'Sisäinen paine, joka tekee käyttäytymisestä vastustamattoman.',         language: 'fi', clock_id: 4 },
  { word: 'Kaipaus',           definition: 'Syvä ikävä kohti jotain, mikä ei ole vielä täyttynyt.',                language: 'fi', clock_id: 4 },
  { word: 'Sopeutuminen',      definition: 'Kyky mukautua joustavasti muuttuneisiin olosuhteisiin.',               language: 'fi', clock_id: 4 },
  { word: 'Edistäminen',       definition: 'Toisten kasvun tai kehityksen aktiivinen tukeminen.',                  language: 'fi', clock_id: 4 },
  { word: 'Keimailu',          definition: 'Omien ominaisuuksien tai omistusten liioiteltu esitteleminen.',         language: 'fi', clock_id: 4 },
  { word: 'Puolustaminen',     definition: 'Asian tai ihmisen puolesta aktiivisesti toimiminen.',                  language: 'fi', clock_id: 4 },
  { word: 'Lumous',            definition: 'Kyky kiinnittää muita viehätyksellä tai harhaanjohtamisella.',         language: 'fi', clock_id: 4 },
  { word: 'Lamauttaminen',     definition: 'Voima tai uskomus, joka estää toimintakyvyn.',                         language: 'fi', clock_id: 4 },
  { word: 'Korjaaminen',       definition: 'Rikkoutuneen tai vahingoittuneen asian palauttaminen.',                language: 'fi', clock_id: 4 },
  { word: 'Muuntuminen',       definition: 'Muodon tai olemuksen perusteellinen muutos.',                          language: 'fi', clock_id: 4 },
  { word: 'Ripustaminen',      definition: 'Pitää kahden tilan välinen tauon tila.',                              language: 'fi', clock_id: 4 },
  { word: 'Uudelleenistuttaminen', definition: 'Jonkin siirtäminen uuteen yhteyteen tai ympäristöön.',            language: 'fi', clock_id: 4 },
  { word: 'Uudelleenkäsittely', definition: 'Kokemusten tai tiedon uudelleentyöstäminen niiden integroimiseksi.', language: 'fi', clock_id: 4 },

  // ── CLOCK 5 — THIRD EYE ─────────────────────────────────────────────────
  { word: 'Kindlich',         definition: 'Die unverstellte Wahrnehmung und Offenheit des kindlichen Geistes.',      language: 'de', clock_id: 5 },
  { word: 'Enthüllung',       definition: 'Das Sichtbarmachen von etwas, das bisher verborgen war.',                 language: 'de', clock_id: 5 },
  { word: 'Flug',             definition: 'Die Fähigkeit, über begrenzte Perspektiven hinauszugehen.',               language: 'de', clock_id: 5 },
  { word: 'Vorahnung',        definition: 'Das innere Wissen um ein zukünftiges Ereignis, bevor es eintritt.',       language: 'de', clock_id: 5 },

  { word: 'Lapsenkaltainen',  definition: 'Lapsenmielinen vääristymätön havainto ja avoimuus.',                    language: 'fi', clock_id: 5 },
  { word: 'Paljastaminen',    definition: 'Aiemmin piilossa olleen asian tekeminen näkyväksi.',                    language: 'fi', clock_id: 5 },
  { word: 'Lento',            definition: 'Kyky ylittää rajoittuneet näkökulmat.',                                  language: 'fi', clock_id: 5 },
  { word: 'Ennakkoaavistus',  definition: 'Sisäinen tieto tulevasta tapahtumasta ennen sen toteutumista.',          language: 'fi', clock_id: 5 },

  // ── CLOCK 6 — MALE CROWN ────────────────────────────────────────────────
  { word: 'Suchen',           definition: 'Das aktive Streben nach Wahrheit, Sinn oder Verbindung.',                 language: 'de', clock_id: 6 },
  { word: 'Idealismus',       definition: 'Der Glaube an das Mögliche jenseits des gegenwärtig Bestehenden.',        language: 'de', clock_id: 6 },
  { word: 'Hingabe',          definition: 'Das bewusste Loslassen von Kontrolle zugunsten einer höheren Kraft.',     language: 'de', clock_id: 6 },
  { word: 'Seligkeit',        definition: 'Ein Zustand tiefer innerer Freude und Frieden, jenseits äußerer Umstände.', language: 'de', clock_id: 6 },
  { word: 'Spontaneität',     definition: 'Die Fähigkeit, ohne Planung authentisch und lebendig zu handeln.',        language: 'de', clock_id: 6 },
  { word: 'Diskurs',          definition: 'Der tiefe Austausch von Ideen, der Verständnis erzeugt.',                 language: 'de', clock_id: 6 },
  { word: 'Empathie',         definition: 'Die Fähigkeit, das Erleben anderer wirklich nachzufühlen.',               language: 'de', clock_id: 6 },
  { word: 'Rechtschaffenheit', definition: 'Das Leben in Übereinstimmung mit den eigenen tiefsten Werten.',         language: 'de', clock_id: 6 },
  { word: 'Gebet',            definition: 'Die bewusste Ausrichtung auf etwas, das größer ist als das Selbst.',      language: 'de', clock_id: 6 },
  { word: 'Majestät',         definition: 'Die würdevolle Präsenz, die natürliche Ehrfurcht hervorruft.',            language: 'de', clock_id: 6 },
  { word: 'Lob',              definition: 'Das ausdrückliche Anerkennen des Wertvollen in anderen.',                 language: 'de', clock_id: 6 },
  { word: 'Libation',         definition: 'Ein rituelles Opfer als Ausdruck von Dankbarkeit und Verbindung.',        language: 'de', clock_id: 6 },
  { word: 'Sühne',            definition: 'Das Wiedergutmachen von Handlungen, die anderen oder sich selbst schadeten.', language: 'de', clock_id: 6 },
  { word: 'Zeremonie',        definition: 'Formelle Handlungen, die dem Moment Tiefe und Bedeutung verleihen.',     language: 'de', clock_id: 6 },
  { word: 'Mäßigkeit',        definition: 'Die bewusste Begrenzung des Verlangens, um Gleichgewicht zu halten.',    language: 'de', clock_id: 6 },
  { word: 'Loslassen',        definition: 'Das bewusste Aufgeben von dem, was nicht mehr dient.',                   language: 'de', clock_id: 6 },

  { word: 'Etsiminen',        definition: 'Aktiivinen pyrkimys kohti totuutta, merkitystä tai yhteyttä.',           language: 'fi', clock_id: 6 },
  { word: 'Idealismi',        definition: 'Usko siihen, mikä on mahdollista nykyisen olemassaolevan tuolla puolen.', language: 'fi', clock_id: 6 },
  { word: 'Luovuttaminen',    definition: 'Tietoinen kontrollin päästäminen irti korkeamman voiman hyväksi.',       language: 'fi', clock_id: 6 },
  { word: 'Autuus',           definition: 'Syvä sisäinen ilo ja rauha, ulkoisten olosuhteiden tuolla puolen.',     language: 'fi', clock_id: 6 },
  { word: 'Spontaanius',      definition: 'Kyky toimia aidosti ja elävästi ilman suunnittelua.',                    language: 'fi', clock_id: 6 },
  { word: 'Keskustelu',       definition: 'Syvä ideoiden vaihto, joka luo ymmärrystä.',                            language: 'fi', clock_id: 6 },
  { word: 'Empatia',          definition: 'Kyky todella tuntea toisten kokemuksia.',                               language: 'fi', clock_id: 6 },
  { word: 'Oikeamielisyys',   definition: 'Eläminen omien syvimpien arvojen mukaisesti.',                          language: 'fi', clock_id: 6 },
  { word: 'Rukous',           definition: 'Tietoinen suuntautuminen johonkin itseä suurempaan.',                   language: 'fi', clock_id: 6 },
  { word: 'Majesteetti',      definition: 'Arvokas läsnäolo, joka herättää luontevaa kunnioitusta.',               language: 'fi', clock_id: 6 },
  { word: 'Ylistys',          definition: 'Muissa olevan arvokkaiden asioiden nimenomainen tunnustaminen.',         language: 'fi', clock_id: 6 },
  { word: 'Juomauhri',        definition: 'Rituaalinen uhri kiitollisuuden ja yhteyden ilmauksena.',               language: 'fi', clock_id: 6 },
  { word: 'Sovitus',          definition: 'Toimien, jotka vahingoittivat muita tai itseä, hyvittäminen.',          language: 'fi', clock_id: 6 },
  { word: 'Seremonia',        definition: 'Muodolliset toimet, jotka antavat hetkelle syvyyttä ja merkitystä.',    language: 'fi', clock_id: 6 },
  { word: 'Kohtuullisuus',    definition: 'Tietoinen halun rajoittaminen tasapainon ylläpitämiseksi.',             language: 'fi', clock_id: 6 },
  { word: 'Vapauttaminen',    definition: 'Tietoinen luopuminen siitä, mikä ei enää palvele.',                     language: 'fi', clock_id: 6 },

  // ── CLOCK 7 — FEMALE CROWN ──────────────────────────────────────────────
  { word: 'Unendlichkeit',    definition: 'Das Bewusstsein von etwas, das keine Grenzen oder Enden hat.',            language: 'de', clock_id: 7 },
  { word: 'Webende Liebe',    definition: 'Die aktive Kraft der Liebe, die Verbindungen erschafft und stärkt.',      language: 'de', clock_id: 7 },
  { word: 'Schwingen',        definition: 'Die Bewegung in rhythmischer Resonanz mit einer Energie.',               language: 'de', clock_id: 7 },
  { word: 'Zentrierung',      definition: 'Das Ausrichten auf die wesentliche innere Mitte.',                        language: 'de', clock_id: 7 },
  { word: 'Reinigung',        definition: 'Das Entfernen von dem, was die innere Klarheit trübt.',                  language: 'de', clock_id: 7 },
  { word: 'Stabilität',       definition: 'Die Fähigkeit, trotz äußerem Wandel in Gleichgewicht zu bleiben.',       language: 'de', clock_id: 7 },
  { word: 'Güte',             definition: 'Die Qualität mitfühlenden und warmherzigen Handelns gegenüber anderen.', language: 'de', clock_id: 7 },
  { word: 'Transformation',   definition: 'Die tiefgreifende Wandlung, die das Wesen einer Sache verändert.',       language: 'de', clock_id: 7 },
  { word: 'Selbstliebe',      definition: 'Die Anerkennung und Pflege des eigenen Wertes ohne Bedingung.',           language: 'de', clock_id: 7 },
  { word: 'Reines Sein',      definition: 'Die Erfahrung des Bewusstseins jenseits von Gedanken und Aktivität.',    language: 'de', clock_id: 7 },
  { word: 'Grenzenlosigkeit', definition: 'Die Qualität, nicht durch Grenzen oder Beschränkungen eingeengt zu sein.', language: 'de', clock_id: 7 },
  { word: 'Kontingenz',       definition: 'Die Offenheit für das, was nicht festgelegt oder vorherbestimmt ist.',   language: 'de', clock_id: 7 },
  { word: 'Sinnlich',         definition: 'Tief verbunden mit den Wahrnehmungen und Empfindungen des Körpers.',     language: 'de', clock_id: 7 },
  { word: 'Anstrengung',      definition: 'Die bewusste Kraft, die aufgebracht wird, um ein Ziel zu erreichen.',    language: 'de', clock_id: 7 },
  { word: 'Innovieren',       definition: 'Das Einbringen neuer Ideen oder Methoden, die vorher nicht existierten.', language: 'de', clock_id: 7 },
  { word: 'Erbe',             definition: 'Was durch Generationen weitergegeben wird: Wissen, Werte, Identität.',   language: 'de', clock_id: 7 },

  { word: 'Äärettömyys',      definition: 'Tietoisuus jostakin, jolla ei ole rajoja eikä loppua.',                 language: 'fi', clock_id: 7 },
  { word: 'Kudottu rakkaus',  definition: 'Rakkauden aktiivinen voima, joka luo ja vahvistaa yhteyksiä.',          language: 'fi', clock_id: 7 },
  { word: 'Värähtely',        definition: 'Liike rytmisessä resonanssissa energian kanssa.',                       language: 'fi', clock_id: 7 },
  { word: 'Ydinkeskittyminen', definition: 'Suuntautuminen oleelliseen sisäiseen keskipisteeseen.',               language: 'fi', clock_id: 7 },
  { word: 'Puhdistuminen',    definition: 'Sen poistaminen, mikä samentaa sisäistä selkeyttä.',                   language: 'fi', clock_id: 7 },
  { word: 'Vakaus',           definition: 'Kyky pysyä tasapainossa ulkoisesta muutoksesta huolimatta.',           language: 'fi', clock_id: 7 },
  { word: 'Ystävällisyys',    definition: 'Myötätuntoisen ja lämpimän toiminnan laatu muita kohtaan.',            language: 'fi', clock_id: 7 },
  { word: 'Muutos',           definition: 'Syvällinen muutos, joka muuttaa asian olemuksen.',                     language: 'fi', clock_id: 7 },
  { word: 'Itserakkaus',      definition: 'Oman arvon tunnistaminen ja hoivaaminen ehdoitta.',                    language: 'fi', clock_id: 7 },
  { word: 'Puhdas oleminen',  definition: 'Tietoisuuden kokemus ajatusten ja toiminnan tuolla puolen.',          language: 'fi', clock_id: 7 },
  { word: 'Rajattomuus',      definition: 'Laatu, jota rajoittavat rajoitukset eivät kavenna.',                  language: 'fi', clock_id: 7 },
  { word: 'Satunnaisuus',     definition: 'Avoimuus sille, mikä ei ole päätetty tai ennalta määrätty.',          language: 'fi', clock_id: 7 },
  { word: 'Aistillisuus',     definition: 'Syvä yhteys kehon havaintoihin ja tuntemuksiin.',                     language: 'fi', clock_id: 7 },
  { word: 'Ponnistus',        definition: 'Tietoinen voima, jota käytetään tavoitteen saavuttamiseksi.',         language: 'fi', clock_id: 7 },
  { word: 'Uudistaminen',     definition: 'Uusien ideoiden tai menetelmien tuominen, joita ei aiemmin ollut.',   language: 'fi', clock_id: 7 },
  { word: 'Perintö',          definition: 'Sukupolvien välillä siirtyvä: tieto, arvot, identiteetti.',           language: 'fi', clock_id: 7 },

  // ── CLOCK 8 — ETHERIC HEART ─────────────────────────────────────────────
  { word: 'Vater',  definition: 'Das schöpferische Prinzip, das Ursprung und Struktur verleiht.',                language: 'de', clock_id: 8 },
  { word: 'Sohn',   definition: 'Das verkörperte Prinzip, das das Göttliche in die Welt trägt.',                 language: 'de', clock_id: 8 },
  { word: 'Geist',  definition: 'Das lebendige Prinzip, das verbindet, bewegt und erneuert.',                    language: 'de', clock_id: 8 },

  { word: 'Isä',   definition: 'Luova periaate, joka antaa alkuperän ja rakenteen.',                            language: 'fi', clock_id: 8 },
  { word: 'Poika', definition: 'Ruumiillistunut periaate, joka kantaa jumalallisen maailmaan.',                 language: 'fi', clock_id: 8 },
  { word: 'Henki', definition: 'Elävä periaate, joka yhdistää, liikuttaa ja uudistaa.',                        language: 'fi', clock_id: 8 },
]

// ─── Stats ─────────────────────────────────────────────────────────────────
const deWords = WORDS.filter(w => w.language === 'de')
const fiWords = WORDS.filter(w => w.language === 'fi')
console.log(`Total: ${WORDS.length} words (DE: ${deWords.length}, FI: ${fiWords.length})`)
for (let i = 0; i <= 8; i++) {
  const deClock = WORDS.filter(w => w.language === 'de' && w.clock_id === i)
  const fiClock = WORDS.filter(w => w.language === 'fi' && w.clock_id === i)
  console.log(`  Clock ${i}: DE=${deClock.length}, FI=${fiClock.length}`)
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No writes performed.')
  process.exit(0)
}

// ─── Write to Firestore ────────────────────────────────────────────────────
const glossaryRef = db.collection('glossary')
const created_at = new Date().toISOString()

// Fetch existing system words to avoid duplicates
const existingSnap = await glossaryRef
  .where('source', '==', 'system')
  .get()
const existingKeys = new Set(
  existingSnap.docs.map(d => `${d.data().language ?? 'en'}::${d.data().word}`)
)
console.log(`\nExisting system words in Firestore: ${existingSnap.size}`)

let written = 0
let skipped = 0

// Batch writes (Firestore limit: 500 per batch)
const BATCH_SIZE = 400
for (let start = 0; start < WORDS.length; start += BATCH_SIZE) {
  const batch = db.batch()
  const chunk = WORDS.slice(start, start + BATCH_SIZE)

  for (const entry of chunk) {
    const key = `${entry.language}::${entry.word}`
    if (existingKeys.has(key)) {
      console.log(`  SKIP (exists): ${key}`)
      skipped++
      continue
    }
    const docRef = glossaryRef.doc()
    batch.set(docRef, {
      word: entry.word,
      definition: entry.definition,
      phonetic_spelling: '',
      grade: 1,
      rating: '~',
      version: 'Default',
      source: 'system',
      language: entry.language,
      clock_id: entry.clock_id,
      created_at,
    })
    written++
  }
  await batch.commit()
}

console.log(`\n✓ Written: ${written}  Skipped (already exist): ${skipped}`)
console.log('Done.')
