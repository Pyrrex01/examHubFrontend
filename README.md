# ExamHub — Frontend

Interface web de gestion d'examens QCM.
React + Vite en **JavaScript**, routage `react-router-dom`, appels API en `fetch`.

Ce dossier ne contient que l'interface. Elle consomme l'API du dépôt
`examHubBackend` et ne fonctionne pas sans lui : aucune donnée n'est simulée.

## Prérequis

| Élément | Version | Vérification |
| --- | --- | --- |
| Node.js | 20 ou supérieur | `node -v` |
| npm | 10 ou supérieur | `npm -v` |
| Backend ExamHub | démarré sur `http://localhost:3000` | `curl http://localhost:3000/api/health` |

Le contrôle de santé doit répondre :

```json
{"status":"ok","service":"exam-hub-backend","database":{"reachable":true}}
```

S'il échoue, démarrez d'abord le backend en suivant son propre README.

## Installation

```bash
cd examHub/examHubFrontend
npm install
```

Le fichier `.env` est **facultatif** : sans lui, l'application vise
`http://localhost:3000/api`, ce qui correspond à la configuration par défaut du
backend. Pour une autre adresse :

```bash
cp .env.example .env    # sous Windows : copy .env.example .env
```

### Lancement

```bash
npm run dev       # développement, http://localhost:5173
npm run build     # build de production dans dist/
npm run preview   # sert le build pour vérification
```

`npm run dev` ne rend pas la main : le serveur reste actif tant que la fenêtre
est ouverte. Ouvrez `http://localhost:5173/` dans un navigateur **pendant**
qu'il tourne. Pour l'arrêter : `Ctrl+C`.

### À propos du port 5173

Il n'est pas modifiable seul. C'est la valeur attendue par `CORS_ORIGIN` dans
le `.env` du backend ; le changer ici impose de l'ajuster là-bas, sans quoi le
navigateur bloquera toutes les requêtes.

## Comptes de test

Après `npm run db:seed` puis `npm run db:seed:demo` côté backend :

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admi.school@examhub.com` | valeur de `SEED_ADMIN_PASSWORD` |
| Étudiante | `chris.school@examhub.com` | valeur de `SEED_STUDENT_PASSWORD` |
| Étudiant | `james.school@examhub.com` | valeur de `SEED_STUDENT_PASSWORD` |
| Étudiante | `carson.school@examhub.com` | valeur de `SEED_STUDENT_PASSWORD` |
| Étudiant **désactivé** | `pyrrex.school@examhub.com` | valeur de `SEED_STUDENT_PASSWORD` |

Ces deux variables sont définies dans le `.env` du **backend**. Avec les
valeurs d'exemple fournies, le mot de passe étudiant est `Etudiant123!`.

Le compte de Pyrrex est volontairement désactivé : il permet de vérifier que la
connexion est refusée avec un message distinct de celui d'un mot de passe
erroné.

### Parcours conseillé pour évaluer l'application

1. Se connecter en administrateur, créer un cours puis un examen dont la
   période est **déjà ouverte**, et lui ajouter au moins une question.
2. Se déconnecter, se reconnecter en étudiant : l'examen apparaît.
3. Composer, laisser une question sans réponse, rendre la copie.
4. La note et la correction s'affichent immédiatement.
5. Revenir en administrateur : la note figure dans les résultats de l'examen.

Un examen sans question reste invisible pour les étudiants, et un examen déjà
passé disparaît de leur liste.

## Configuration

Une seule variable, dans `.env` :

```
VITE_API_URL=http://localhost:3000/api
```

Vite n'expose au navigateur que les variables préfixées `VITE_`. Tout ce qui y
figure est **lisible par le client** : ce fichier ne doit jamais contenir de
secret. Le fichier `.env` n'est pas versionné ; `.env.example` documente la
variable attendue.

## Structure

```
src/
├── main.jsx              Point d'entrée : BrowserRouter + AuthProvider
├── App.jsx               Plan de routage et entrées de navigation
├── api/
│   ├── client.js         Client HTTP unique, lecture du format d'erreur
│   ├── endpoints.js      Chemins de l'API, groupés par ressource
│   └── session.js        Persistance de la session
├── auth/
│   ├── AuthContext.jsx   Session courante, login, logout
│   ├── guards.js         Règles d'aiguillage (fonctions pures)
│   └── RouteGuards.jsx   Protection des routes
├── hooks/
│   ├── useResource.js    Chargement : loading, error, data, reload
│   └── useAction.js      Action modifiante : pending, error
├── components/
│   ├── AppShell.jsx      Coque commune aux deux espaces
│   ├── Icon.jsx          Jeu d'icônes SVG
│   ├── PageHeader.jsx    En-tête d'écran
│   ├── StatusMessage.jsx Erreur, réussite, avertissement
│   ├── LoadingBlock.jsx  Indicateur de chargement
│   ├── EmptyState.jsx    Écran vide
│   ├── Badge.jsx         Étiquette d'état
│   ├── Modal.jsx         Fenêtre modale accessible
│   └── ConfirmDialog.jsx Confirmation d'action
├── pages/
│   ├── LoginPage.jsx
│   ├── NotFoundPage.jsx
│   ├── admin/            6 écrans
│   └── student/          4 écrans
├── styles/
│   ├── theme.css         Jetons : couleurs, typographie, boutons, champs
│   ├── layout.css        Coque, barre latérale, connexion
│   └── components.css    Cartes, tableaux, modales, écrans d'examen
└── utils/format.js       Dates, fuseaux, accords au pluriel
```

Aucun dossier `public/` : `index.html` est à la racine, comme le veut Vite, et
les icônes sont dessinées en SVG plutôt que chargées comme fichiers.


## Routes

| Route | Accès | Écran |
| --- | --- | --- |
| `/login` | public | Connexion, commune aux deux rôles |
| `/admin` | admin | Tableau de bord |
| `/admin/students` | admin | Gestion des étudiants |
| `/admin/courses` | admin | Gestion des cours |
| `/admin/exams` | admin | Gestion des examens |
| `/admin/exams/:examId/questions` | admin | Éditeur de questions |
| `/admin/exams/:examId/results` | admin | Résultats d'un examen |
| `/student` | étudiant | Examens disponibles |
| `/student/exams/:examId` | étudiant | Passage de l'examen |
| `/student/exams/:examId/result` | étudiant | Note et correction |
| `/student/results` | étudiant | Historique |

Plus `/` qui aiguille selon le rôle, et une page 404 pour tout le reste.

### Aiguillage

| Situation | Destination |
| --- | --- |
| Non connecté sur une route protégée | `/login`, page visée mémorisée |
| Étudiant sur l'espace admin | `/student` |
| Admin sur l'espace étudiant | `/admin` |
| Déjà connecté sur `/login` | son espace |
| Session illisible ou rôle inconnu | traité comme déconnecté, session purgée |

Après connexion, l'utilisateur retrouve la page qu'il visait — **à condition
qu'elle relève de son espace**. Sans ce contrôle, un étudiant ayant tenté
`/admin/students` serait renvoyé vers un écran interdit juste après s'être
connecté.

> **Ces redirections ne protègent rien.** Elles évitent d'afficher un écran
> hors sujet. La protection réelle est côté serveur : un étudiant qui
> appellerait `/api/students` directement reçoit un `403`, que l'interface
> l'ait affiché ou non.


## Session

Le jeton **et** le profil sont conservés dans `localStorage`. Ce n'est pas un
choix de confort : l'API ne propose aucune route `GET /api/auth/me`, le profil
n'est donc transmis qu'à la connexion. Sans conservation, un rafraîchissement
de page perdrait le rôle.

Le profil stocké ne sert qu'à l'affichage et à l'aiguillage. Le falsifier dans
le navigateur ne donne accès à rien : le serveur relit le compte en base à
chaque requête.

Une session mal formée — jeton vide, rôle inconnu, JSON illisible — est purgée
au démarrage plutôt qu'utilisée.


## Gestion des erreurs

Tous les appels passent par `api/client.js`, qui traduit le format
`{ "message": "..." }` du backend en exception `ApiError` portant le code HTTP.

| Situation | Traitement |
| --- | --- |
| `401` | Session caduque : déconnexion automatique |
| `403` rôle insuffisant | Refus ponctuel, **sans** déconnexion |
| `403` compte désactivé | Session fermée : plus aucune requête ne passera |
| Réseau injoignable | Message explicite, **session conservée** |
| Autre | `ApiError` remontée à l'écran appelant |

Ces distinctions comptent. Déconnecter sur tout `403` masquerait un simple
refus de droits derrière une déconnexion inexpliquée. Ne jamais déconnecter
laisserait au contraire un compte désactivé en cours de session paraître
connecté alors que le serveur refuse chacune de ses requêtes.

Le contrat de l'API ne fournit pas de code distinguant les deux `403` : seul le
message diffère. Le client s'appuie donc sur un mot-clé stable. Si la
formulation du serveur changeait, l'utilisateur verrait le message sans être
déconnecté — dégradation acceptable, jamais un accès indu.

Les messages du serveur sont affichés tels quels. Le backend distingue un mot
de passe erroné (`401`) d'un compte désactivé (`403`) ; les réécrire côté
client ferait perdre cette nuance à l'utilisateur, qui doit savoir s'il faut
ressaisir son mot de passe ou contacter l'administration.


## Identité visuelle

Un seul design system pour les deux espaces. L'administration et l'espace
étudiant partagent le composant `AppShell` : ce n'est pas une ressemblance
obtenue en dupliquant du CSS, c'est la même charpente instanciée deux fois.
Seules changent les entrées de navigation.

| Rôle | Valeur |
| --- | --- |
| Barre latérale, aplats sombres | `#0F172A` |
| Bleu marine secondaire, texte | `#1E293B` |
| Fond principal | `#F8F6F0` |
| Accent | `#F59E0B` |
| Indicateurs positifs, validations | `#10B981` |
| Texte secondaire | `#64748B` |

L'ambre est l'accent unique : marque, entrée active, valeurs mises en avant.
Le vert signale une réussite, le rouge une erreur. Ni l'un ni l'autre n'est
décoratif — un étudiant qui voit du rouge doit pouvoir s'y fier.

Typographie : `Plus Jakarta Sans` pour l'interface, `JetBrains Mono` pour les
libellés en capitales. Chargées depuis Google Fonts ; sans réseau, la pile
système prend le relais.

Sur écran étroit, la barre latérale se replie derrière un bouton et se referme
au changement de page.


## Espace administrateur

| Écran | Ce qu'il fait |
| --- | --- |
| Tableau de bord | Compteurs, examens ouverts, derniers examens créés |
| Étudiants | Créer, modifier, réinitialiser le mot de passe, désactiver, réactiver |
| Cours | Créer, modifier, supprimer |
| Examens | Créer, modifier, supprimer, filtrer par cours |
| Questions | Ajouter, modifier, supprimer questions et propositions |
| Résultats | Notes, moyenne, copies rendues, absents |

### Ce que l'interface empêche, et ce qu'elle ne garantit pas

| Situation | Ce que fait l'interface |
| --- | --- |
| Cours portant des examens | « Supprimer » désactivé, motif en infobulle |
| Examen ayant des copies | « Supprimer » désactivé, badge « Verrouillé » |
| Examen déjà passé | Bandeau d'avertissement, édition grisée |
| Question hors de 2 à 6 propositions | Boutons désactivés aux bornes |
| Plusieurs bonnes réponses | Boutons radio exclusifs |
| Fenêtre d'examen inversée | Message immédiat, envoi bloqué |

**Aucun de ces garde-fous ne protège quoi que ce soit.** Ce sont des économies
de clic. Le serveur refuse de toute façon, et la base l'interdit à son tour par
déclencheur. Si l'état affiché était périmé, le message du serveur serait
présenté tel quel.

### Vocabulaire

Sur un étudiant, le bouton s'appelle **« Désactiver »**, jamais « Supprimer » :
un étudiant n'est jamais effacé, et un intitulé trompeur ferait croire à
l'administrateur qu'il détruit des données alors qu'il ferme un accès.

Sur un cours ou un examen, « Supprimer » est exact : ces ressources sont
réellement effaçables, tant qu'aucune dépendance ne s'y oppose.


## Espace étudiant

| Écran | Ce qu'il fait |
| --- | --- |
| Examens disponibles | Les examens ouverts, pas encore passés |
| Passage | Toutes les questions sur une page, confirmation avant l'envoi |
| Résultat | Note et correction question par question |
| Mes résultats | Historique personnel |

Le cours n'a pas de rubrique dédiée : il apparaît en contexte sur chacun de ces
quatre écrans, sous forme de code et d'intitulé rattachés à l'examen.

### Passage d'un examen

Un groupe de boutons radio par question : le navigateur garantit lui-même qu'un
seul choix reste actif. Répondre est facultatif, et un bouton permet d'effacer
une réponse.

La barre de composition reste visible pendant le défilement — nombre de
réponses et échéance ne doivent jamais disparaître.

Un avertissement s'affiche si l'on quitte la page avec des réponses non
rendues : la copie n'existe nulle part tant qu'elle n'est pas soumise.

La confirmation récapitule le nombre de réponses, **nomme les questions
laissées vides** et rappelle qu'un examen ne se passe qu'une fois.

### Ce que le frontend ne fait jamais

| Interdit | Comment il est tenu |
| --- | --- |
| Calculer la note | `score`, `maxScore`, `percentage` et `pointsEarned` sont affichés tels que reçus |
| Connaître la bonne réponse avant l'envoi | Le sujet servi par l'API ne contient aucun champ de correction |
| Exploiter `isCorrect` avant la correction | Le mot « correct » n'apparaît sous aucune forme dans le sujet |
| Envoyer autre chose que des identifiants | Le corps est `{"answers":[{"questionId":4,"choiceId":13}]}` |

Après soumission, la page de résultat recharge la copie corrigée depuis
`/my/results?examId=`, qu'on arrive d'une soumission ou d'un rafraîchissement.
Un chemin unique évite d'avoir à dériver une valeur d'affichage à partir de la
note.


## Résolution des problèmes

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| Page blanche | Serveur Vite arrêté, ou `index.html` ouvert par double-clic | L'adresse doit commencer par `http://localhost:5173` |
| « Le serveur est injoignable » | Backend arrêté | `curl http://localhost:3000/api/health` |
| Erreur CORS dans la console | Vite sur un autre port que 5173 | Aligner `CORS_ORIGIN` dans le `.env` du backend |
| Connexion refusée pour l'admin | `SEED_ADMIN_PASSWORD` modifié après le seed | Le mot de passe est celui en vigueur **au moment** du seed |
| Aucun examen visible côté étudiant | Fenêtre fermée, examen sans question, ou déjà passé | Un examen ne se passe qu'une fois |
| Déconnexion inattendue | Jeton expiré, ou compte désactivé | Se reconnecter |

Une page blanche vient presque toujours d'une erreur JavaScript : ouvrez la
console du navigateur avec `F12`.


## Contraintes techniques respectées

- **JavaScript uniquement** — aucun fichier TypeScript, aucune configuration
  `tsconfig`.
- **React, Vite, `react-router-dom`, `fetch`** — cinq dépendances au total,
  aucune bibliothèque de composants, aucun client HTTP tiers.
- **Aucun appel réseau hors de `api/client.js`.**
- **Aucune règle métier appliquée côté client** : le frontend affiche et
  transmet, le serveur décide.
