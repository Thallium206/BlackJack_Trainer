# BlackJack Trainer

Une app web statique pour jouer au blackjack et s'entrainer au comptage de cartes. Elle est directement compatible avec GitHub Pages: le fichier `index.html` suffit pour publier le jeu.

## Fonctionnalites

- Blackjack complet avec bankroll, mises, blackjack 3:2, double, split, assurance, abandon tardif et push.
- Sabot multi-decks configurable, penetration avant remelange, dealer stand/hit soft 17.
- Comptage de cartes avec Hi-Lo, KO, Hi-Opt I, Omega II et Zen Count.
- Count trainer affichable/masquable avec running count, true count, cartes restantes, densite des hautes/basses cartes et composition exacte du sabot.
- Prediction de la valeur de carte la plus probable a sortir et recommandation de prochaine action.
- Indicateur de sabot sur la table avec pile animee, nombre exact de cartes restantes et penetration avant remelange.
- Scores avec As affiches en hard et soft quand la main peut encore choisir la valeur de l'As.
- Une main qui atteint 21 se termine automatiquement; le blackjack naturel reste reserve a As + 10 en deux cartes.
- Onglet d'apprentissage expliquant les regles du blackjack et les techniques de comptage.
- Bulles d'aide au survol des boutons, regles et indicateurs de comptage.
- Feedback de jeu avec animations de cartes, burst de resultat, pulsations bankroll/net et sons optionnels.
- Interface responsive pour bureau et mobile.

## Lancer en local

```bash
npm start
```

Puis ouvrir `http://localhost:4173`.

## Tests

```bash
npm test
```

## Publication GitHub Pages

1. Pousser ce dossier dans un repo GitHub.
2. Dans `Settings > Pages`, choisir la branche principale et le dossier racine.
3. GitHub Pages servira automatiquement `index.html`.

## Notes de regles

Par defaut, la table utilise un sabot de 2 decks. Le jeu applique l'abandon tardif, l'assurance quand l'upcard dealer est un As, une carte seulement apres split des As, le double apres split configurable, et le paiement blackjack configurable. Le count suit uniquement les cartes visibles; la carte cachee du dealer n'est comptee qu'au reveal.
