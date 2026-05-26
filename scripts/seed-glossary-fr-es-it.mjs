/**
 * Seed French (fr), Spanish (es) and Italian (it) system glossary words into Firestore.
 *
 * Usage:
 *   node scripts/seed-glossary-fr-es-it.mjs [--dry-run]
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var or serviceAccount.json in project root.
 * Safe to re-run — uses a composite key check to skip existing entries.
 *
 * NOTE: firebase-admin's readable-stream dependency is incompatible with Node 24.
 * Run with Node 18 or 20: `nvm use 20 && node scripts/seed-glossary-fr-es-it.mjs`
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
// clock_id 0–8: ROOT, SACRAL, SOLAR PLEXUS, HEART, THROAT, THIRD EYE, MALE CROWN, FEMALE CROWN, ETHERIC HEART

const WORDS = [

  // ── CLOCK 0 — ROOT ──────────────────────────────────────────────────────
  { word: 'Accomplissement', definition: 'La réalisation d\'un objectif significatif par un effort conscient.',              language: 'fr', clock_id: 0 },
  { word: 'Disponibilité',   definition: 'L\'ouverture intérieure à accueillir de nouvelles expériences.',                   language: 'fr', clock_id: 0 },
  { word: 'Vitalité',        definition: 'La force vive qui maintient le corps et l\'esprit en mouvement.',                  language: 'fr', clock_id: 0 },
  { word: 'Audace',          definition: 'Le courage d\'avancer malgré l\'incertitude ou le risque.',                        language: 'fr', clock_id: 0 },
  { word: 'Perspicacité',    definition: 'La compréhension profonde qui réside sous la surface d\'une situation.',           language: 'fr', clock_id: 0 },
  { word: 'Maîtrise',        definition: 'La capacité à conduire une situation avec clarté et autorité.',                    language: 'fr', clock_id: 0 },
  { word: 'Réflexion',       definition: 'Le regard conscient vers le passé pour apprendre de l\'expérience.',               language: 'fr', clock_id: 0 },
  { word: 'Illusion',        definition: 'Une perception qui dissimule ou déforme la réalité.',                              language: 'fr', clock_id: 0 },

  { word: 'Logro',           definition: 'El alcance de un objetivo significativo mediante un esfuerzo consciente.',         language: 'es', clock_id: 0 },
  { word: 'Disposición',     definition: 'La apertura interior para acoger nuevas experiencias.',                            language: 'es', clock_id: 0 },
  { word: 'Vitalidad',       definition: 'La fuerza viva que mantiene el cuerpo y la mente en movimiento.',                 language: 'es', clock_id: 0 },
  { word: 'Audacia',         definition: 'El valor para avanzar a pesar de la incertidumbre o el riesgo.',                  language: 'es', clock_id: 0 },
  { word: 'Perspicacia',     definition: 'La comprensión profunda que reside bajo la superficie de una situación.',          language: 'es', clock_id: 0 },
  { word: 'Maestría',        definition: 'La capacidad de conducir una situación con claridad y autoridad.',                 language: 'es', clock_id: 0 },
  { word: 'Reflexión',       definition: 'La mirada consciente hacia el pasado para aprender de la experiencia.',            language: 'es', clock_id: 0 },
  { word: 'Ilusión',         definition: 'Una percepción que oculta o distorsiona la realidad.',                             language: 'es', clock_id: 0 },

  { word: 'Realizzazione',   definition: 'Il raggiungimento di un obiettivo significativo attraverso uno sforzo consapevole.', language: 'it', clock_id: 0 },
  { word: 'Disponibilità',   definition: 'L\'apertura interiore ad accogliere nuove esperienze.',                            language: 'it', clock_id: 0 },
  { word: 'Vitalità',        definition: 'La forza viva che mantiene il corpo e la mente in movimento.',                    language: 'it', clock_id: 0 },
  { word: 'Audacia',         definition: 'Il coraggio di avanzare nonostante l\'incertezza o il rischio.',                   language: 'it', clock_id: 0 },
  { word: 'Perspicacia',     definition: 'La comprensione profonda che risiede sotto la superficie di una situazione.',      language: 'it', clock_id: 0 },
  { word: 'Maestria',        definition: 'La capacità di condurre una situazione con chiarezza e autorità.',                 language: 'it', clock_id: 0 },
  { word: 'Riflessione',     definition: 'Lo sguardo consapevole al passato per imparare dall\'esperienza.',                 language: 'it', clock_id: 0 },
  { word: 'Illusione',       definition: 'Una percezione che nasconde o distorce la realtà.',                               language: 'it', clock_id: 0 },

  // ── CLOCK 1 — SACRAL ────────────────────────────────────────────────────
  { word: 'Union',           definition: 'La convergence de deux forces séparées en un tout.',                              language: 'fr', clock_id: 1 },
  { word: 'Robustesse',      definition: 'La capacité à résister aux pressions tout en restant ancré.',                     language: 'fr', clock_id: 1 },
  { word: 'Sagacité',        definition: 'Le don de percevoir les connexions cachées d\'une situation.',                     language: 'fr', clock_id: 1 },
  { word: 'Humilité',        definition: 'La conscience tranquille de sa propre valeur, sans ostentation.',                 language: 'fr', clock_id: 1 },
  { word: 'Surprise',        definition: 'L\'éveil de l\'attention par l\'inattendu.',                                       language: 'fr', clock_id: 1 },
  { word: 'Absence de joie', definition: 'L\'état où la capacité à la joie est bloquée ou gelée.',                          language: 'fr', clock_id: 1 },

  { word: 'Unión',           definition: 'La confluencia de dos fuerzas separadas en un todo.',                             language: 'es', clock_id: 1 },
  { word: 'Robustez',        definition: 'La capacidad de resistir presiones permaneciendo enraizado.',                     language: 'es', clock_id: 1 },
  { word: 'Sagacidad',       definition: 'El don de percibir las conexiones ocultas de una situación.',                     language: 'es', clock_id: 1 },
  { word: 'Humildad',        definition: 'El conocimiento tranquilo del propio valor sin ostentación.',                     language: 'es', clock_id: 1 },
  { word: 'Sorpresa',        definition: 'El despertar de la atención por lo inesperado.',                                  language: 'es', clock_id: 1 },
  { word: 'Apatía',          definition: 'El estado en que la capacidad para la alegría está bloqueada o congelada.',        language: 'es', clock_id: 1 },

  { word: 'Unione',          definition: 'La confluenza di due forze separate in un tutto.',                                language: 'it', clock_id: 1 },
  { word: 'Robustezza',      definition: 'La capacità di resistere alle pressioni rimanendo radicati.',                     language: 'it', clock_id: 1 },
  { word: 'Acume',           definition: 'Il dono di percepire i legami nascosti di una situazione.',                       language: 'it', clock_id: 1 },
  { word: 'Umiltà',          definition: 'La consapevolezza tranquilla del proprio valore, senza ostentazione.',            language: 'it', clock_id: 1 },
  { word: 'Sorpresa',        definition: 'Il risveglio dell\'attenzione attraverso l\'inatteso.',                           language: 'it', clock_id: 1 },
  { word: 'Gioia spenta',    definition: 'Lo stato in cui la capacità di gioia è bloccata o congelata.',                    language: 'it', clock_id: 1 },

  // ── CLOCK 2 — SOLAR PLEXUS ──────────────────────────────────────────────
  { word: 'Débordant',       definition: 'Une énergie ou un comportement qui dépasse les limites normales.',                language: 'fr', clock_id: 2 },
  { word: 'Agissant',        definition: 'La force active qui produit des changements dans le monde extérieur.',             language: 'fr', clock_id: 2 },
  { word: 'Sauvetage',       definition: 'Récupérer quelque chose de précieux dans une situation difficile.',               language: 'fr', clock_id: 2 },
  { word: 'Tonitruant',      definition: 'Une énergie bruyante et turbulente qui se décharge.',                             language: 'fr', clock_id: 2 },
  { word: 'Exigences',       definition: 'Des attentes excessives qui vont au-delà de la nécessité réelle.',                language: 'fr', clock_id: 2 },
  { word: 'Lubricité',       definition: 'Un désir excessif qui franchit les limites éthiques.',                            language: 'fr', clock_id: 2 },
  { word: 'Objectif',        definition: 'Le point focal vers lequel l\'intention et l\'énergie sont dirigées.',            language: 'fr', clock_id: 2 },
  { word: 'Renaissance',     definition: 'L\'émergence d\'une nouvelle force ou identité après l\'abandon de l\'ancien.',   language: 'fr', clock_id: 2 },
  { word: 'Exubérance',      definition: 'Une joie de vivre débordante qui s\'exprime en abondance.',                       language: 'fr', clock_id: 2 },
  { word: 'Élan',            definition: 'Une impulsion intérieure qui demande expression ou accomplissement.',              language: 'fr', clock_id: 2 },

  { word: 'Desbordante',     definition: 'Una energía o comportamiento que excede los límites normales.',                   language: 'es', clock_id: 2 },
  { word: 'Propiciante',     definition: 'La fuerza activa que produce cambios en el mundo externo.',                       language: 'es', clock_id: 2 },
  { word: 'Rescate',         definition: 'Recuperar algo valioso de una situación difícil.',                                language: 'es', clock_id: 2 },
  { word: 'Tronador',        definition: 'Una energía ruidosa y turbulenta que se descarga.',                               language: 'es', clock_id: 2 },
  { word: 'Exigencias',      definition: 'Expectativas excesivas que van más allá de la necesidad real.',                   language: 'es', clock_id: 2 },
  { word: 'Lujuria',         definition: 'Un deseo excesivo que traspasa los límites éticos.',                              language: 'es', clock_id: 2 },
  { word: 'Objetivo',        definition: 'El punto focal hacia el que se dirigen la intención y la energía.',               language: 'es', clock_id: 2 },
  { word: 'Renacimiento',    definition: 'El surgimiento de una nueva fuerza o identidad tras soltar lo antiguo.',          language: 'es', clock_id: 2 },
  { word: 'Exuberancia',     definition: 'Una alegría de vivir desbordante que se expresa en abundancia.',                  language: 'es', clock_id: 2 },
  { word: 'Impulso',         definition: 'Un impulso interior que demanda expresión o cumplimiento.',                       language: 'es', clock_id: 2 },

  { word: 'Sfrenato',        definition: 'Un\'energia o un comportamento che supera i limiti normali.',                     language: 'it', clock_id: 2 },
  { word: 'Causativo',       definition: 'La forza attiva che produce cambiamenti nel mondo esterno.',                      language: 'it', clock_id: 2 },
  { word: 'Salvataggio',     definition: 'Recuperare qualcosa di prezioso da una situazione difficile.',                    language: 'it', clock_id: 2 },
  { word: 'Fragoroso',       definition: 'Un\'energia rumorosa e turbolenta che si scarica.',                               language: 'it', clock_id: 2 },
  { word: 'Pretese',         definition: 'Aspettative eccessive che vanno oltre la necessità reale.',                       language: 'it', clock_id: 2 },
  { word: 'Lussuria',        definition: 'Un desiderio eccessivo che oltrepassa i limiti etici.',                           language: 'it', clock_id: 2 },
  { word: 'Obiettivo',       definition: 'Il punto focale verso cui sono diretti l\'intenzione e l\'energia.',              language: 'it', clock_id: 2 },
  { word: 'Rinascita',       definition: 'L\'emergere di una nuova forza o identità dopo aver lasciato andare il vecchio.', language: 'it', clock_id: 2 },
  { word: 'Esuberanza',      definition: 'Una gioia di vivere traboccante che si esprime nell\'abbondanza.',                 language: 'it', clock_id: 2 },
  { word: 'Slancio',         definition: 'Un impulso interiore che chiede espressione o compimento.',                       language: 'it', clock_id: 2 },

  // ── CLOCK 3 — HEART ─────────────────────────────────────────────────────
  { word: 'Équilibrer',      definition: 'Amener des forces opposées à un équilibre stable.',                               language: 'fr', clock_id: 3 },
  { word: 'Immersion',       definition: 'Se plonger entièrement dans une expérience.',                                     language: 'fr', clock_id: 3 },
  { word: 'Attraction',      definition: 'La force qui attire d\'autres personnes ou opportunités dans sa vie.',             language: 'fr', clock_id: 3 },
  { word: 'Curiosité',       definition: 'L\'intérêt vif pour ce qui est encore inconnu.',                                  language: 'fr', clock_id: 3 },
  { word: 'Collision',       definition: 'L\'affrontement de deux forces ou points de vue.',                                language: 'fr', clock_id: 3 },
  { word: 'Sollicitude',     definition: 'L\'attention compatissante portée au bien-être des autres.',                      language: 'fr', clock_id: 3 },
  { word: 'Destin',          definition: 'La trajectoire que trace une vie par les choix et la nécessité.',                 language: 'fr', clock_id: 3 },
  { word: 'Domination',      definition: 'Le besoin de contrôler les autres par la dominance.',                             language: 'fr', clock_id: 3 },
  { word: 'Force vitale',    definition: 'L\'énergie vitale fondamentale qui sous-tend tout vivant.',                       language: 'fr', clock_id: 3 },
  { word: 'Protection',      definition: 'L\'acte de préserver les autres du tort.',                                        language: 'fr', clock_id: 3 },
  { word: 'Triomphe',        definition: 'Le vécu de la victoire après un grand défi.',                                     language: 'fr', clock_id: 3 },
  { word: 'Vanité',          definition: 'La préoccupation excessive pour son apparence ou son prestige.',                  language: 'fr', clock_id: 3 },

  { word: 'Equilibrar',      definition: 'Llevar fuerzas opuestas a un equilibrio estable.',                                language: 'es', clock_id: 3 },
  { word: 'Inmersión',       definition: 'Sumergirse completamente en una experiencia.',                                    language: 'es', clock_id: 3 },
  { word: 'Atracción',       definition: 'La fuerza que atrae a otras personas u oportunidades a la propia vida.',          language: 'es', clock_id: 3 },
  { word: 'Curiosidad',      definition: 'El vivo interés por lo que aún es desconocido.',                                  language: 'es', clock_id: 3 },
  { word: 'Colisión',        definition: 'El enfrentamiento de dos fuerzas o puntos de vista.',                             language: 'es', clock_id: 3 },
  { word: 'Solicitud',       definition: 'La atención compasiva por el bienestar de los demás.',                            language: 'es', clock_id: 3 },
  { word: 'Destino',         definition: 'La línea que traza la propia vida a través de la elección y la necesidad.',       language: 'es', clock_id: 3 },
  { word: 'Dominación',      definition: 'La necesidad de controlar a otros mediante la dominancia.',                       language: 'es', clock_id: 3 },
  { word: 'Fuerza vital',    definition: 'La energía vital fundamental que subyace a todo lo vivo.',                        language: 'es', clock_id: 3 },
  { word: 'Protección',      definition: 'El acto de preservar a otros del daño.',                                          language: 'es', clock_id: 3 },
  { word: 'Triunfo',         definition: 'La vivencia de la victoria tras un gran desafío.',                                language: 'es', clock_id: 3 },
  { word: 'Vanidad',         definition: 'La preocupación excesiva por la apariencia o el prestigio propios.',              language: 'es', clock_id: 3 },

  { word: 'Bilanciare',      definition: 'Portare forze opposte in un equilibrio stabile.',                                 language: 'it', clock_id: 3 },
  { word: 'Immersione',      definition: 'Immergersi completamente in un\'esperienza.',                                     language: 'it', clock_id: 3 },
  { word: 'Attrazione',      definition: 'La forza che attrae altre persone o opportunità nella propria vita.',             language: 'it', clock_id: 3 },
  { word: 'Curiosità',       definition: 'Il vivo interesse per ciò che è ancora sconosciuto.',                             language: 'it', clock_id: 3 },
  { word: 'Collisione',      definition: 'L\'incontro-scontro di due forze o punti di vista.',                              language: 'it', clock_id: 3 },
  { word: 'Sollecitudine',   definition: 'L\'attenzione compassionevole per il benessere degli altri.',                     language: 'it', clock_id: 3 },
  { word: 'Destino',         definition: 'La traiettoria che la propria vita traccia attraverso la scelta e la necessità.', language: 'it', clock_id: 3 },
  { word: 'Dominazione',     definition: 'Il bisogno di controllare gli altri mediante la dominanza.',                      language: 'it', clock_id: 3 },
  { word: 'Forza vitale',    definition: 'L\'energia vitale fondamentale che sottende tutto il vivente.',                   language: 'it', clock_id: 3 },
  { word: 'Protezione',      definition: 'L\'atto di preservare gli altri dal danno.',                                      language: 'it', clock_id: 3 },
  { word: 'Trionfo',         definition: 'L\'esperienza della vittoria dopo una grande sfida.',                             language: 'it', clock_id: 3 },
  { word: 'Vanità',          definition: 'La preoccupazione eccessiva per il proprio aspetto o prestigio.',                 language: 'it', clock_id: 3 },

  // ── CLOCK 4 — THROAT ────────────────────────────────────────────────────
  { word: 'Résonner',        definition: 'Vibrer en harmonie avec une idée, un son ou une personne.',                       language: 'fr', clock_id: 4 },
  { word: 'Plonger',         definition: 'Se déplacer profondément dans une expérience ou un état.',                        language: 'fr', clock_id: 4 },
  { word: 'Droiture',        definition: 'Agir en accord avec des valeurs éthiques ou morales.',                            language: 'fr', clock_id: 4 },
  { word: 'Compulsion',      definition: 'Une pression intérieure qui rend un comportement irrésistible.',                  language: 'fr', clock_id: 4 },
  { word: 'Nostalgie',       definition: 'Un désir profond de quelque chose qui n\'est pas encore accompli.',               language: 'fr', clock_id: 4 },
  { word: 'Adapter',         definition: 'La capacité à s\'ajuster avec souplesse à des conditions changeantes.',           language: 'fr', clock_id: 4 },
  { word: 'Nourrir',         definition: 'Soutenir activement la croissance ou le développement d\'autrui.',                language: 'fr', clock_id: 4 },
  { word: 'Ostentation',     definition: 'La présentation exagérée de ses qualités ou de ses biens.',                       language: 'fr', clock_id: 4 },
  { word: 'Plaider',         definition: 'S\'engager activement en faveur d\'une cause ou d\'une personne.',                language: 'fr', clock_id: 4 },
  { word: 'Envoûtement',     definition: 'La qualité de captiver les autres par le charme ou la tromperie.',               language: 'fr', clock_id: 4 },
  { word: 'Paralysant',      definition: 'Une force ou une croyance qui inhibe la capacité d\'agir.',                       language: 'fr', clock_id: 4 },
  { word: 'Réparer',         definition: 'Restaurer quelque chose de brisé ou d\'endommagé.',                               language: 'fr', clock_id: 4 },
  { word: 'Transformer',     definition: 'Opérer un changement fondamental de forme ou d\'essence.',                        language: 'fr', clock_id: 4 },
  { word: 'Suspension',      definition: 'Maintenir un état d\'attente entre deux conditions.',                             language: 'fr', clock_id: 4 },
  { word: 'Transplanter',    definition: 'Déplacer quelque chose vers un nouveau contexte ou environnement.',               language: 'fr', clock_id: 4 },
  { word: 'Réintégrer',      definition: 'Retravailler des expériences ou des informations pour les intégrer.',             language: 'fr', clock_id: 4 },

  { word: 'Resonar',         definition: 'Vibrar en armonía con una idea, un sonido o una persona.',                        language: 'es', clock_id: 4 },
  { word: 'Sumergir',        definition: 'Moverse profundamente en una experiencia o un estado.',                           language: 'es', clock_id: 4 },
  { word: 'Rectitud',        definition: 'Actuar de acuerdo con valores éticos o morales.',                                 language: 'es', clock_id: 4 },
  { word: 'Compulsión',      definition: 'Una presión interior que hace un comportamiento irresistible.',                   language: 'es', clock_id: 4 },
  { word: 'Anhelo',          definition: 'Un deseo profundo de algo que aún no se ha cumplido.',                            language: 'es', clock_id: 4 },
  { word: 'Adaptar',         definition: 'La capacidad de ajustarse con flexibilidad a condiciones cambiantes.',            language: 'es', clock_id: 4 },
  { word: 'Nutrir',          definition: 'Apoyar activamente el crecimiento o el desarrollo de los demás.',                 language: 'es', clock_id: 4 },
  { word: 'Ostentación',     definition: 'La presentación exagerada de las propias cualidades o posesiones.',              language: 'es', clock_id: 4 },
  { word: 'Abogar',          definition: 'Comprometerse activamente a favor de una causa o una persona.',                   language: 'es', clock_id: 4 },
  { word: 'Encantamiento',   definition: 'La cualidad de cautivar a otros mediante el encanto o el engaño.',               language: 'es', clock_id: 4 },
  { word: 'Paralizante',     definition: 'Una fuerza o creencia que inhibe la capacidad de actuar.',                        language: 'es', clock_id: 4 },
  { word: 'Reparar',         definition: 'Restaurar algo roto o dañado.',                                                   language: 'es', clock_id: 4 },
  { word: 'Transformar',     definition: 'Operar un cambio fundamental de forma o esencia.',                                language: 'es', clock_id: 4 },
  { word: 'Suspensión',      definition: 'Mantener un estado de espera entre dos condiciones.',                             language: 'es', clock_id: 4 },
  { word: 'Trasplantar',     definition: 'Mover algo a un nuevo contexto o entorno.',                                       language: 'es', clock_id: 4 },
  { word: 'Reprocesar',      definition: 'Volver a trabajar experiencias o información para integrarlas.',                  language: 'es', clock_id: 4 },

  { word: 'Risuonare',       definition: 'Vibrare in armonia con un\'idea, un suono o una persona.',                        language: 'it', clock_id: 4 },
  { word: 'Immergersi',      definition: 'Muoversi in profondità dentro un\'esperienza o uno stato.',                       language: 'it', clock_id: 4 },
  { word: 'Rettitudine',     definition: 'Agire in accordo con valori etici o morali.',                                     language: 'it', clock_id: 4 },
  { word: 'Compulsione',     definition: 'Una pressione interiore che rende un comportamento irresistibile.',               language: 'it', clock_id: 4 },
  { word: 'Nostalgia',       definition: 'Un desiderio profondo di qualcosa che non è ancora compiuto.',                   language: 'it', clock_id: 4 },
  { word: 'Adattarsi',       definition: 'La capacità di adeguarsi con flessibilità a condizioni mutevoli.',                language: 'it', clock_id: 4 },
  { word: 'Nutrire',         definition: 'Sostenere attivamente la crescita o lo sviluppo degli altri.',                    language: 'it', clock_id: 4 },
  { word: 'Ostentazione',    definition: 'La presentazione esagerata delle proprie qualità o beni.',                        language: 'it', clock_id: 4 },
  { word: 'Sostenere',       definition: 'Impegnarsi attivamente a favore di una causa o di una persona.',                  language: 'it', clock_id: 4 },
  { word: 'Incantamento',    definition: 'La qualità di affascinare gli altri mediante il fascino o l\'inganno.',           language: 'it', clock_id: 4 },
  { word: 'Paralizzante',    definition: 'Una forza o convinzione che inibisce la capacità di agire.',                      language: 'it', clock_id: 4 },
  { word: 'Riparare',        definition: 'Ripristinare qualcosa di rotto o danneggiato.',                                   language: 'it', clock_id: 4 },
  { word: 'Trasformare',     definition: 'Operare un cambiamento fondamentale di forma o essenza.',                         language: 'it', clock_id: 4 },
  { word: 'Sospensione',     definition: 'Mantenere uno stato di attesa tra due condizioni.',                               language: 'it', clock_id: 4 },
  { word: 'Trapiantare',     definition: 'Spostare qualcosa in un nuovo contesto o ambiente.',                              language: 'it', clock_id: 4 },
  { word: 'Rielaborare',     definition: 'Rivisitare esperienze o informazioni per integrarle.',                            language: 'it', clock_id: 4 },

  // ── CLOCK 5 — THIRD EYE ─────────────────────────────────────────────────
  { word: 'Enfantin',        definition: 'La perception non altérée et l\'ouverture de l\'esprit enfantin.',                language: 'fr', clock_id: 5 },
  { word: 'Révélation',      definition: 'Rendre visible ce qui était jusqu\'alors caché.',                                 language: 'fr', clock_id: 5 },
  { word: 'Envol',           definition: 'La capacité à dépasser les perspectives limitées.',                               language: 'fr', clock_id: 5 },
  { word: 'Pressentiment',   definition: 'La connaissance intérieure d\'un événement futur avant qu\'il survienne.',        language: 'fr', clock_id: 5 },

  { word: 'Candoroso',       definition: 'La percepción pura y la apertura de la mente infantil.',                          language: 'es', clock_id: 5 },
  { word: 'Revelación',      definition: 'Hacer visible lo que hasta ahora estaba oculto.',                                 language: 'es', clock_id: 5 },
  { word: 'Vuelo',           definition: 'La capacidad de trascender perspectivas limitadas.',                              language: 'es', clock_id: 5 },
  { word: 'Presagio',        definition: 'El conocimiento interior de un evento futuro antes de que ocurra.',               language: 'es', clock_id: 5 },

  { word: 'Infantile',       definition: 'La percezione pura e l\'apertura della mente infantile.',                         language: 'it', clock_id: 5 },
  { word: 'Rivelazione',     definition: 'Rendere visibile ciò che era fino ad allora nascosto.',                           language: 'it', clock_id: 5 },
  { word: 'Volo',            definition: 'La capacità di trascendere le prospettive limitate.',                             language: 'it', clock_id: 5 },
  { word: 'Presagio',        definition: 'La conoscenza interiore di un evento futuro prima che accada.',                   language: 'it', clock_id: 5 },

  // ── CLOCK 6 — MALE CROWN ────────────────────────────────────────────────
  { word: 'Chercher',        definition: 'La quête active de vérité, de sens ou de connexion.',                             language: 'fr', clock_id: 6 },
  { word: 'Idéalisme',       definition: 'La foi en ce qui est possible au-delà de ce qui existe actuellement.',            language: 'fr', clock_id: 6 },
  { word: 'Abandon',         definition: 'Le lâcher prise conscient du contrôle au profit d\'une force supérieure.',        language: 'fr', clock_id: 6 },
  { word: 'Béatitude',       definition: 'Un état de joie et de paix intérieures profondes, au-delà des circonstances.',    language: 'fr', clock_id: 6 },
  { word: 'Spontanéité',     definition: 'La capacité à agir authentiquement et vivacement sans planification.',            language: 'fr', clock_id: 6 },
  { word: 'Discours',        definition: 'L\'échange profond d\'idées qui génère de la compréhension.',                     language: 'fr', clock_id: 6 },
  { word: 'Empathie',        definition: 'La capacité à ressentir véritablement l\'expérience des autres.',                 language: 'fr', clock_id: 6 },
  { word: 'Justice',         definition: 'Vivre en accord avec ses valeurs les plus profondes.',                            language: 'fr', clock_id: 6 },
  { word: 'Prière',          definition: 'L\'orientation consciente vers quelque chose qui dépasse le soi.',                language: 'fr', clock_id: 6 },
  { word: 'Majesté',         definition: 'La présence digne qui suscite naturellement le respect.',                         language: 'fr', clock_id: 6 },
  { word: 'Louange',         definition: 'La reconnaissance explicite de ce qui est précieux chez les autres.',             language: 'fr', clock_id: 6 },
  { word: 'Libation',        definition: 'Un sacrifice rituel en signe de gratitude et de connexion.',                      language: 'fr', clock_id: 6 },
  { word: 'Expiation',       definition: 'Réparer des actes qui ont nui à autrui ou à soi-même.',                           language: 'fr', clock_id: 6 },
  { word: 'Cérémonie',       definition: 'Des actes formels qui confèrent profondeur et sens à l\'instant.',                language: 'fr', clock_id: 6 },
  { word: 'Tempérance',      definition: 'La limitation consciente du désir pour maintenir l\'équilibre.',                  language: 'fr', clock_id: 6 },
  { word: 'Lâcher prise',    definition: 'L\'abandon conscient de ce qui ne sert plus.',                                    language: 'fr', clock_id: 6 },

  { word: 'Buscar',          definition: 'La búsqueda activa de verdad, sentido o conexión.',                               language: 'es', clock_id: 6 },
  { word: 'Idealismo',       definition: 'La fe en lo que es posible más allá de lo que existe actualmente.',               language: 'es', clock_id: 6 },
  { word: 'Abandono',        definition: 'El soltar consciente del control a favor de una fuerza superior.',                language: 'es', clock_id: 6 },
  { word: 'Beatitud',        definition: 'Un estado de profunda alegría y paz interiores, más allá de las circunstancias.', language: 'es', clock_id: 6 },
  { word: 'Espontaneidad',   definition: 'La capacidad de actuar de manera auténtica y viva sin planificación.',            language: 'es', clock_id: 6 },
  { word: 'Discurso',        definition: 'El profundo intercambio de ideas que genera comprensión.',                        language: 'es', clock_id: 6 },
  { word: 'Empatía',         definition: 'La capacidad de sentir genuinamente la experiencia de los demás.',                language: 'es', clock_id: 6 },
  { word: 'Justicia',        definition: 'Vivir en consonancia con los propios valores más profundos.',                     language: 'es', clock_id: 6 },
  { word: 'Oración',         definition: 'La orientación consciente hacia algo más grande que el yo.',                      language: 'es', clock_id: 6 },
  { word: 'Majestad',        definition: 'La presencia digna que suscita un respeto natural.',                              language: 'es', clock_id: 6 },
  { word: 'Alabanza',        definition: 'El reconocimiento explícito de lo valioso en los demás.',                         language: 'es', clock_id: 6 },
  { word: 'Libación',        definition: 'Un sacrificio ritual en señal de gratitud y conexión.',                           language: 'es', clock_id: 6 },
  { word: 'Expiación',       definition: 'Reparar actos que dañaron a otros o a uno mismo.',                                language: 'es', clock_id: 6 },
  { word: 'Ceremonia',       definition: 'Actos formales que confieren profundidad y significado al momento.',              language: 'es', clock_id: 6 },
  { word: 'Templanza',       definition: 'La limitación consciente del deseo para mantener el equilibrio.',                 language: 'es', clock_id: 6 },
  { word: 'Soltar',          definition: 'El abandono consciente de aquello que ya no sirve.',                              language: 'es', clock_id: 6 },

  { word: 'Cercare',         definition: 'La ricerca attiva di verità, significato o connessione.',                         language: 'it', clock_id: 6 },
  { word: 'Idealismo',       definition: 'La fede in ciò che è possibile al di là di ciò che esiste attualmente.',         language: 'it', clock_id: 6 },
  { word: 'Abbandono',       definition: 'Il lasciar andare consapevole del controllo a favore di una forza superiore.',    language: 'it', clock_id: 6 },
  { word: 'Beatitudine',     definition: 'Uno stato di profonda gioia e pace interiori, al di là delle circostanze.',       language: 'it', clock_id: 6 },
  { word: 'Spontaneità',     definition: 'La capacità di agire in modo autentico e vitale senza pianificazione.',           language: 'it', clock_id: 6 },
  { word: 'Discorso',        definition: 'Il profondo scambio di idee che genera comprensione.',                            language: 'it', clock_id: 6 },
  { word: 'Empatia',         definition: 'La capacità di sentire veramente l\'esperienza degli altri.',                     language: 'it', clock_id: 6 },
  { word: 'Giustizia',       definition: 'Vivere in accordo con i propri valori più profondi.',                             language: 'it', clock_id: 6 },
  { word: 'Preghiera',       definition: 'L\'orientamento consapevole verso qualcosa di più grande del sé.',                language: 'it', clock_id: 6 },
  { word: 'Maestà',          definition: 'La presenza dignitosa che suscita naturale rispetto.',                            language: 'it', clock_id: 6 },
  { word: 'Lode',            definition: 'Il riconoscimento esplicito di ciò che è prezioso negli altri.',                  language: 'it', clock_id: 6 },
  { word: 'Libagione',       definition: 'Un sacrificio rituale come espressione di gratitudine e connessione.',            language: 'it', clock_id: 6 },
  { word: 'Espiazione',      definition: 'Riparare azioni che hanno danneggiato gli altri o se stessi.',                   language: 'it', clock_id: 6 },
  { word: 'Cerimonia',       definition: 'Atti formali che conferiscono profondità e significato al momento.',              language: 'it', clock_id: 6 },
  { word: 'Temperanza',      definition: 'La limitazione consapevole del desiderio per mantenere l\'equilibrio.',           language: 'it', clock_id: 6 },
  { word: 'Lasciare andare', definition: 'L\'abbandono consapevole di ciò che non serve più.',                              language: 'it', clock_id: 6 },

  // ── CLOCK 7 — FEMALE CROWN ──────────────────────────────────────────────
  { word: 'Infini',          definition: 'La conscience de quelque chose qui n\'a ni limites ni fin.',                      language: 'fr', clock_id: 7 },
  { word: 'Amour tissé',     definition: 'La force active de l\'amour qui crée et renforce les liens.',                     language: 'fr', clock_id: 7 },
  { word: 'Vibration',       definition: 'Le mouvement en résonance rythmique avec une énergie.',                           language: 'fr', clock_id: 7 },
  { word: 'Centrage',        definition: 'L\'alignement sur le centre intérieur essentiel.',                                language: 'fr', clock_id: 7 },
  { word: 'Purification',    definition: 'Le retrait de ce qui trouble la clarté intérieure.',                              language: 'fr', clock_id: 7 },
  { word: 'Stabilité',       definition: 'La capacité à demeurer en équilibre malgré le changement extérieur.',             language: 'fr', clock_id: 7 },
  { word: 'Bonté',           definition: 'La qualité de l\'acte compatissant et chaleureux envers autrui.',                 language: 'fr', clock_id: 7 },
  { word: 'Transformation',  definition: 'Le changement profond qui modifie l\'essence d\'une chose.',                      language: 'fr', clock_id: 7 },
  { word: 'Amour de soi',    definition: 'La reconnaissance et le soin de sa propre valeur sans condition.',                language: 'fr', clock_id: 7 },
  { word: 'Être pur',        definition: 'L\'expérience de la conscience au-delà de la pensée et de l\'activité.',          language: 'fr', clock_id: 7 },
  { word: 'Illimité',        definition: 'La qualité de ne pas être contraint par des limites ou des restrictions.',        language: 'fr', clock_id: 7 },
  { word: 'Contingence',     definition: 'L\'ouverture à ce qui n\'est pas fixé ni prédéterminé.',                          language: 'fr', clock_id: 7 },
  { word: 'Sensualité',      definition: 'La connexion profonde aux perceptions et sensations du corps.',                   language: 'fr', clock_id: 7 },
  { word: 'Effort',          definition: 'La force consciente déployée pour atteindre un objectif.',                        language: 'fr', clock_id: 7 },
  { word: 'Innover',         definition: 'Introduire de nouvelles idées ou méthodes qui n\'existaient pas auparavant.',     language: 'fr', clock_id: 7 },
  { word: 'Héritage',        definition: 'Ce qui est transmis de génération en génération : savoir, valeurs, identité.',    language: 'fr', clock_id: 7 },

  { word: 'Infinitud',       definition: 'La conciencia de algo que no tiene límites ni fin.',                              language: 'es', clock_id: 7 },
  { word: 'Amor tejido',     definition: 'La fuerza activa del amor que crea y fortalece los vínculos.',                    language: 'es', clock_id: 7 },
  { word: 'Vibración',       definition: 'El movimiento en resonancia rítmica con una energía.',                            language: 'es', clock_id: 7 },
  { word: 'Centrar',         definition: 'La alineación con el centro interior esencial.',                                  language: 'es', clock_id: 7 },
  { word: 'Purificación',    definition: 'La eliminación de lo que enturbia la claridad interior.',                         language: 'es', clock_id: 7 },
  { word: 'Estabilidad',     definition: 'La capacidad de permanecer en equilibrio a pesar del cambio externo.',            language: 'es', clock_id: 7 },
  { word: 'Bondad',          definition: 'La cualidad del acto compasivo y cálido hacia los demás.',                        language: 'es', clock_id: 7 },
  { word: 'Transformación',  definition: 'El cambio profundo que altera la esencia de una cosa.',                           language: 'es', clock_id: 7 },
  { word: 'Amor propio',     definition: 'El reconocimiento y cuidado del propio valor sin condiciones.',                   language: 'es', clock_id: 7 },
  { word: 'Ser puro',        definition: 'La experiencia de la conciencia más allá del pensamiento y la actividad.',        language: 'es', clock_id: 7 },
  { word: 'Expansión',       definition: 'La cualidad de no estar constreñido por límites o restricciones.',                language: 'es', clock_id: 7 },
  { word: 'Contingencia',    definition: 'La apertura a lo que no está fijado ni predeterminado.',                          language: 'es', clock_id: 7 },
  { word: 'Sensualidad',     definition: 'La profunda conexión con las percepciones y sensaciones del cuerpo.',             language: 'es', clock_id: 7 },
  { word: 'Esfuerzo',        definition: 'La fuerza consciente que se despliega para alcanzar un objetivo.',                language: 'es', clock_id: 7 },
  { word: 'Innovar',         definition: 'Introducir nuevas ideas o métodos que no existían antes.',                        language: 'es', clock_id: 7 },
  { word: 'Legado',          definition: 'Lo que se transmite de generación en generación: conocimiento, valores, identidad.', language: 'es', clock_id: 7 },

  { word: 'Infinità',        definition: 'La consapevolezza di qualcosa che non ha limiti né fine.',                        language: 'it', clock_id: 7 },
  { word: 'Amore intrecciato', definition: 'La forza attiva dell\'amore che crea e rafforza i legami.',                    language: 'it', clock_id: 7 },
  { word: 'Vibrazione',      definition: 'Il movimento in risonanza ritmica con un\'energia.',                              language: 'it', clock_id: 7 },
  { word: 'Centramento',     definition: 'L\'allineamento verso il centro interiore essenziale.',                           language: 'it', clock_id: 7 },
  { word: 'Purificazione',   definition: 'La rimozione di ciò che offusca la chiarezza interiore.',                        language: 'it', clock_id: 7 },
  { word: 'Stabilità',       definition: 'La capacità di rimanere in equilibrio nonostante il cambiamento esterno.',        language: 'it', clock_id: 7 },
  { word: 'Bontà',           definition: 'La qualità dell\'atto compassionevole e caldo verso gli altri.',                  language: 'it', clock_id: 7 },
  { word: 'Trasformazione',  definition: 'Il cambiamento profondo che muta l\'essenza di una cosa.',                        language: 'it', clock_id: 7 },
  { word: 'Amor proprio',    definition: 'Il riconoscimento e la cura del proprio valore senza condizioni.',                language: 'it', clock_id: 7 },
  { word: 'Essere puro',     definition: 'L\'esperienza della coscienza al di là del pensiero e dell\'attività.',           language: 'it', clock_id: 7 },
  { word: 'Illimitatezza',   definition: 'La qualità di non essere vincolati da confini o restrizioni.',                   language: 'it', clock_id: 7 },
  { word: 'Contingenza',     definition: 'L\'apertura a ciò che non è fissato né predeterminato.',                         language: 'it', clock_id: 7 },
  { word: 'Sensualità',      definition: 'La profonda connessione con le percezioni e le sensazioni del corpo.',            language: 'it', clock_id: 7 },
  { word: 'Sforzo',          definition: 'La forza consapevole che viene impiegata per raggiungere un obiettivo.',          language: 'it', clock_id: 7 },
  { word: 'Innovare',        definition: 'Introdurre nuove idee o metodi che non esistevano prima.',                        language: 'it', clock_id: 7 },
  { word: 'Eredità',         definition: 'Ciò che viene trasmesso di generazione in generazione: conoscenza, valori, identità.', language: 'it', clock_id: 7 },

  // ── CLOCK 8 — ETHERIC HEART ─────────────────────────────────────────────
  { word: 'Père',    definition: 'Le principe créateur qui confère origine et structure.',          language: 'fr', clock_id: 8 },
  { word: 'Fils',    definition: 'Le principe incarné qui porte le divin dans le monde.',           language: 'fr', clock_id: 8 },
  { word: 'Esprit',  definition: 'Le principe vivant qui relie, meut et renouvelle.',               language: 'fr', clock_id: 8 },

  { word: 'Padre',   definition: 'El principio creador que otorga origen y estructura.',            language: 'es', clock_id: 8 },
  { word: 'Hijo',    definition: 'El principio encarnado que lleva lo divino al mundo.',            language: 'es', clock_id: 8 },
  { word: 'Espíritu',definition: 'El principio viviente que conecta, mueve y renueva.',             language: 'es', clock_id: 8 },

  { word: 'Padre',   definition: 'Il principio creatore che conferisce origine e struttura.',       language: 'it', clock_id: 8 },
  { word: 'Figlio',  definition: 'Il principio incarnato che porta il divino nel mondo.',           language: 'it', clock_id: 8 },
  { word: 'Spirito', definition: 'Il principio vivente che connette, muove e rinnova.',             language: 'it', clock_id: 8 },
]

// ─── Stats ─────────────────────────────────────────────────────────────────
const frWords = WORDS.filter(w => w.language === 'fr')
const esWords = WORDS.filter(w => w.language === 'es')
const itWords = WORDS.filter(w => w.language === 'it')
console.log(`Total: ${WORDS.length} words (FR: ${frWords.length}, ES: ${esWords.length}, IT: ${itWords.length})`)
for (let i = 0; i <= 8; i++) {
  const fr = WORDS.filter(w => w.language === 'fr' && w.clock_id === i)
  const es = WORDS.filter(w => w.language === 'es' && w.clock_id === i)
  const it = WORDS.filter(w => w.language === 'it' && w.clock_id === i)
  console.log(`  Clock ${i}: FR=${fr.length}, ES=${es.length}, IT=${it.length}`)
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No writes performed.')
  process.exit(0)
}

// ─── Write to Firestore ────────────────────────────────────────────────────
const glossaryRef = db.collection('glossary')
const created_at = new Date().toISOString()

const existingSnap = await glossaryRef
  .where('source', '==', 'system')
  .get()
const existingKeys = new Set(
  existingSnap.docs.map(d => `${d.data().language ?? 'en'}::${d.data().word}`)
)
console.log(`\nExisting system words in Firestore: ${existingSnap.size}`)

let written = 0
let skipped = 0

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
