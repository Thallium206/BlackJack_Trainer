export const COUNTING_GUIDES = {
  hiLo: {
    title: "Hi-Lo",
    level: "Debutant solide",
    balance: "Balance",
    summary: "Le standard pour apprendre: simple, efficace, et directement relie au true count.",
    values: [
      ["2, 3, 4, 5, 6", "+1"],
      ["7, 8, 9", "0"],
      ["10, J, Q, K, A", "-1"]
    ],
    howTo: [
      "Commence a 0 au debut du sabot.",
      "Ajoute +1 quand une petite carte 2-6 sort.",
      "Retire 1 quand une carte haute 10-A sort.",
      "Divise le running count par les decks restants pour obtenir le true count."
    ],
    useCases: [
      "Excellent pour ajuster les mises progressivement.",
      "Bon premier systeme car chaque carte vaut seulement -1, 0 ou +1.",
      "Compatible avec beaucoup de deviations de strategie connues."
    ],
    traps: [
      "Le running count seul trompe quand il reste beaucoup de cartes.",
      "Il faut estimer les decks restants avec calme, sans chercher une precision parfaite.",
      "Un bon count ne remplace pas la strategie de base."
    ]
  },
  ko: {
    title: "KO",
    level: "Debutant rapide",
    balance: "Non balance",
    summary: "Plus permissif que Hi-Lo: il evite la division stricte par decks restants, mais le running count derive naturellement.",
    values: [
      ["2, 3, 4, 5, 6, 7", "+1"],
      ["8, 9", "0"],
      ["10, J, Q, K, A", "-1"]
    ],
    howTo: [
      "Le 7 compte +1, contrairement au Hi-Lo.",
      "Comme le systeme est non balance, le count monte naturellement au fil du sabot.",
      "En pratique casino, on utilise souvent un count de depart ajuste selon le nombre de decks.",
      "Dans ce trainer, compare surtout la tendance du running count avec la composition exacte du sabot."
    ],
    useCases: [
      "Tres bon pour debuter si la conversion true count te surcharge.",
      "Pratique pour garder le rythme pendant une partie rapide.",
      "Aide a comprendre intuitivement quand les hautes cartes deviennent plus presentes."
    ],
    traps: [
      "Comparer directement KO et Hi-Lo peut induire en erreur: KO n'est pas balance.",
      "Les seuils de mise ne sont pas les memes que Hi-Lo.",
      "Le true count affiche reste utile comme repere pedagogique, mais KO se joue souvent autrement."
    ]
  },
  hiOptI: {
    title: "Hi-Opt I",
    level: "Intermediaire",
    balance: "Balance",
    summary: "Un systeme plus precis sur les cartes de force moyenne, mais les As valent 0: il demande souvent un suivi separe des As.",
    values: [
      ["3, 4, 5, 6", "+1"],
      ["A, 2, 7, 8, 9", "0"],
      ["10, J, Q, K", "-1"]
    ],
    howTo: [
      "Compte seulement 3-6 en positif.",
      "Les 10 et figures valent -1.",
      "Les As ne changent pas le count principal.",
      "Pour les mises, garde mentalement une idee des As restants si tu veux exploiter tout le systeme."
    ],
    useCases: [
      "Interessant si tu maitrises deja Hi-Lo.",
      "Peut ameliorer certaines decisions de jeu, car il traite les As differemment.",
      "Bon exercice pour separer le potentiel blackjack des autres hautes cartes."
    ],
    traps: [
      "Ignorer les As peut sous-estimer ou surestimer la valeur de mise.",
      "Il demande plus de discipline que Hi-Lo pour un gain pedagogique moins immediat.",
      "Sans suivi des As, il perd une partie de son interet."
    ]
  },
  omegaII: {
    title: "Omega II",
    level: "Avance",
    balance: "Balance niveau 2",
    summary: "Un systeme plus fin avec des valeurs -2 a +2. Plus puissant, mais plus lourd mentalement.",
    values: [
      ["4, 5, 6", "+2"],
      ["2, 3, 7", "+1"],
      ["8, A", "0"],
      ["9", "-1"],
      ["10, J, Q, K", "-2"]
    ],
    howTo: [
      "Les cartes les plus favorables au dealer, 4-6, valent +2 quand elles sortent.",
      "Les 10 et figures valent -2 car leur sortie appauvrit fortement le sabot.",
      "Convertis en true count pour comparer plusieurs tailles de sabot.",
      "Avance lentement au debut: la precision ne sert a rien si tu perds le fil."
    ],
    useCases: [
      "Bon pour joueurs qui veulent un signal plus nuance que Hi-Lo.",
      "Interessant pour analyser finement la richesse en cartes hautes.",
      "Utile dans ce trainer pour voir comment un systeme niveau 2 reagit au sabot exact."
    ],
    traps: [
      "Les erreurs de +2 / -2 coutent cher mentalement.",
      "Il peut ralentir tes decisions si les bases ne sont pas automatiques.",
      "Les As valent 0 ici aussi, donc leur densite reste a observer."
    ]
  },
  zen: {
    title: "Zen Count",
    level: "Avance accessible",
    balance: "Balance niveau 2",
    summary: "Un compromis avance: plus detaille que Hi-Lo, mais encore assez lisible avec de l'entrainement.",
    values: [
      ["4, 5, 6", "+2"],
      ["2, 3, 7", "+1"],
      ["8, 9", "0"],
      ["A", "-1"],
      ["10, J, Q, K", "-2"]
    ],
    howTo: [
      "Les petites cartes fortes 4-6 comptent double.",
      "Les 10 et figures comptent -2.",
      "Les As comptent -1, ce qui garde une partie du signal blackjack.",
      "Utilise le true count pour rendre le signal comparable entre debut et fin de sabot."
    ],
    useCases: [
      "Bon choix apres Hi-Lo si tu veux plus de finesse sans aller trop loin.",
      "Capture mieux l'impact des 4-6 sur les busts dealer.",
      "Aide a sentir quand un sabot devient vraiment riche en hautes cartes."
    ],
    traps: [
      "Plus exigeant que Hi-Lo: il faut automatiser les valeurs avant de jouer vite.",
      "Les seuils de decision ne sont pas identiques a Hi-Lo.",
      "Un true count positif ne garantit pas la prochaine main, il indique seulement un avantage statistique."
    ]
  }
};

export function guideForCountSystem(systemId) {
  return COUNTING_GUIDES[systemId] || COUNTING_GUIDES.hiLo;
}
