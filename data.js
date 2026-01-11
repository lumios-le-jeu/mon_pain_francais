const recipeData = {
    baseWeight: 1700, // Adjusted to match user's preferred 1.7kg baseline
    // Actually, let's stick to the 2000g approx mentioned by user for simplicity or calculate exact?
    // User said "Pour un pain de 2kg". Let's use 2000 as the reference "100%" for the user's mental model, 
    // but mathematically we scale individual ingredients.
    // Let's use the sum of ingredients that go INTO the final dough to determine the ratio.
    // Final Dough = Flour(600+400) + Water(600) + Levain(240) + Salt(21) = 1000+600+240+21 = 1861g.
    // We will use 1861 as the base denominator.

    steps: [
        {
            id: 0,
            title: "Étape 0 – Sortir le levain",
            image: "photo_0.jpg",
            instructions: [
                "Sortir le levain du réfrigérateur."
            ],
            ingredients: [],
            timer: 0
        },
        {
            id: 1,
            title: "Étape 1 – Préparation du levain",
            image: "photo_1.jpg",
            instructions: [
                "Dans un récipient, mettre les ingrédients ci-dessous.",
                "Mélanger jusqu’à obtenir une texture bien lisse.",
                "👉 Option si pas d’excédent souhaité : Faire des proportions réduites (voir note)."
            ],
            ingredients: [
                { name: "Levain chef", amount: 125, unit: "g" },
                { name: "Farine", amount: 125, unit: "g" },
                { name: "Eau sans chlore", amount: 125, unit: "g" }
            ],
            note: "Pour 240g de levain requis plus tard, vous préparez ici 375g. Pour réduire le gâchis, vous pouvez réduire proportionnellement.",
            timer: 0
        },
        {
            id: 2,
            title: "Étape 2 – Fermentation du levain",
            image: "photo_2.jpg",
            instructions: [
                "Faire une marque au stylo / Velleda / marqueur au niveau du levain.",
                "Couvrir avec un torchon humidifié (sans gouttes qui tombent).",
                "Le levain est prêt lorsqu’il a doublé de volume (×2), est bien gonflé et sent le pain."
            ],
            ingredients: [],
            timer: 7 * 60 * 60, // 7 hours avg (6-8h)
            timerLabel: "Temps moyen (6h - 8h)"
        },
        {
            id: 3,
            title: "Étape 3 – Autolyse",
            image: "photo_3.jpg",
            instructions: [
                "Dans un grand saladier, mettre les farines et l'eau.",
                "Mélanger grossièrement.",
                "Couvrir avec un torchon."
            ],
            ingredients: [
                { name: "Farine blanche", amount: 600, unit: "g" },
                { name: "Farine d’épeautre", amount: 400, unit: "g" },
                { name: "Eau", amount: 600, unit: "g" }
            ],
            timer: 45 * 60
        },
        {
            id: 4,
            title: "Étape 4 – Ajout du levain et du sel",
            image: "photo_4.jpg",
            instructions: [
                "Ajouter le levain (prélevé de l'étape 1) et le sel.",
                "Rabattre la pâte dessus / dessous dans le saladier à l’aide d’une spatule en bois.",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [
                { name: "Levain (prélevé)", amount: 240, unit: "g" },
                { name: "Sel", amount: 21, unit: "g" }
            ],
            timer: 20 * 60
        },
        {
            id: 5,
            title: "Étape 5 – Premier pliage",
            image: "photo_5.jpg",
            instructions: [
                "Replier la pâte 8 fois.",
                "Former une grosse boule.",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [],
            timer: 20 * 60
        },
        {
            id: 6,
            title: "Étape 6 – Pliage",
            image: "photo_6.jpg",
            instructions: [
                "Faire tourner la pâte (galette) par gravité.",
                "Replier sur l’axe X (gauche/droite), puis sur l’axe Y (haut/bas).",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [],
            timer: 20 * 60
        },
        {
            id: 7,
            title: "Étape 7 – Pliage",
            image: "photo_7.jpg",
            instructions: [
                "Faire tourner la pâte.",
                "Replier sur l’axe X, puis sur l’axe Y.",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [],
            timer: 20 * 60
        },
        {
            id: 8,
            title: "Étape 8 – Pliage",
            image: "photo_8.jpg",
            instructions: [
                "Faire tourner la pâte.",
                "Replier sur l’axe X, puis sur l’axe Y.",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [],
            timer: 20 * 60
        },
        {
            id: 9,
            title: "Étape 9 – Pliage",
            image: "photo_9.jpg",
            instructions: [
                "Faire tourner la pâte.",
                "Replier sur l’axe X, puis sur l’axe Y.",
                "Couvrir avec un torchon humide."
            ],
            ingredients: [],
            timer: 20 * 60
        },
        {
            id: 10,
            title: "Étape 10 – Façonnage intermédiaire",
            image: "photo_10.jpg",
            instructions: [
                "Dans un saladier fariné :",
                "Aplatir légèrement la pâte.",
                "Faire un premier rabat.",
                "Puis un deuxième rabat."
            ],
            ingredients: [],
            timer: 0
        },
        {
            id: 11,
            title: "Étape 11 – Mise en tension",
            image: "photo_13.jpg",
            instructions: [
                "Étirer la pâte en boudin.",
                "Enrouler la pâte sous tension.",
                "Fermer les ouvertures en pinçant avec les doigts.",
                "Former une boule.",
                "Fariner la boule.",
                "Couvrir avec un torchon."
            ],
            ingredients: [],
            timer: 30 * 60
        },
        {
            id: 12,
            title: "Étape 12 – Apprêt au froid",
            image: "photo_18.jpg",
            instructions: [
                "Mettre un torchon sec dans un saladier. Fariner le torchon.",
                "Déposer la boule dedans.",
                "Refermer le torchon sec autour de la pâte.",
                "Recouvrir ensuite avec un torchon humide (Total: 2 torchons).",
                "Mettre le tout au réfrigérateur."
            ],
            ingredients: [],
            timer: 8 * 60 * 60
        },
        {
            id: 13,
            title: "Étape 13 – Préchauffage",
            image: "photo_20.jpg",
            instructions: [
                "Mettre une cocotte vide dans le four.",
                "Chauffer à 240 °C."
            ],
            ingredients: [],
            timer: 30 * 60
        },
        {
            id: 14,
            title: "Étape 14 – Cuisson (1)",
            image: "photo_21.jpg",
            instructions: [
                "Sortir la cocotte.",
                "Déposer le pain dedans.",
                "Inciser le pain (motif au choix).",
                "Mettre au four à 240 °C, chaleur par le haut."
            ],
            ingredients: [],
            timer: 30 * 60
        },
        {
            id: 15,
            title: "Étape 15 – Cuisson (2)",
            image: "photo_22.jpg",
            instructions: [
                "Retourner le pain pour qu’il soit bien croustillant dessous.",
                "Remettre au four."
            ],
            ingredients: [],
            timer: 5 * 60
        },
        {
            id: 16,
            title: "Étape 16 – Refroidissement",
            image: "photo_23.jpg",
            instructions: [
                "Éteindre le four. Sortir le pain.",
                "Le déposer sur des couteaux ou une grille (en hauteur).",
                "Laisser sécher."
            ],
            ingredients: [],
            timer: 2 * 60 * 60
        },
        {
            id: 17,
            title: "Derniers conseils – Levain restant",
            image: "",
            instructions: [
                "L’excédent de levain peut être étalé finement sur du papier cuisson, séché, puis congelé (levain de secours).",
                "Le levain conservé au frigo doit être couvert mais pas hermétiquement (besoin d'échanges gazeux)."
            ],
            ingredients: [],
            timer: 0
        }
    ]
};
