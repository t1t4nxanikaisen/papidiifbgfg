const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Ultimate Anime API - Fixed Iframe Extractor',
    version: '5.0.0',
    status: 'active',
    endpoints: [
      {
        method: 'GET',
        url: '/api/anime/{anilist}/{season}/{episode}',
        example: '/api/anime/20/1/1',
        description: 'Fetch anime episode with direct iframe player'
      },
      {
        method: 'GET', 
        url: '/api/player/{anilist}/{season}/{episode}',
        example: '/api/player/20/1/1',
        description: 'Direct iframe player page'
      }
    ]
  });
});

// ANIME DATABASE
let animeDatabase = [
  { slug: "naruto", anilistId: 20, normalizedTitle: "naruto" },
  { slug: "naruto-shippuden", anilistId: 1735, normalizedTitle: "naruto-shippuden" },
  { slug: "kaiju-no-8", anilistId: 142838, normalizedTitle: "kaiju-no-8" },
  { slug: "attack-on-titan", anilistId: 16498, normalizedTitle: "attack-on-titan" },
  { slug: "one-piece", anilistId: 21, normalizedTitle: "one-piece" },
  { slug: "demon-slayer", anilistId: 101922, normalizedTitle: "demon-slayer" },
  { slug: "my-hero-academia", anilistId: 101348, normalizedTitle: "my-hero-academia" },
  { slug: "jujutsu-kaisen", anilistId: 113415, normalizedTitle: "jujutsu-kaisen" },
   { slug: "ghost-in-the-shell-arise", anilistId: 15887, normalizedTitle: "ghost-in-the-shell-arise" },
  { slug: "shoot-goal-to-the-future", anilistId: 132374, normalizedTitle: "shoot-goal-to-the-future" },
  { slug: "death-note", anilistId: 1535, normalizedTitle: "death-note" },
  { slug: "pokemon-concierge", anilistId: 156717, normalizedTitle: "pokmon-concierge" },
  { slug: "naruto-shippuden", anilistId: 1735, normalizedTitle: "naruto-shippuden" },
  { slug: "ive-been-killing-slimes-for-300-years-and-maxed-out-my-level", anilistId: 110784, normalizedTitle: "ive-been-killing-slimes-for-300-years-and-maxed-out-my-level" },
  { slug: "baki-hanma", anilistId: 113717, normalizedTitle: "baki-hanma" },
  { slug: "yaiba-samurai-legend", anilistId: 2476, normalizedTitle: "yaiba-samurai-legend" },
  { slug: "toilet-bound-hanako-kun", anilistId: 108632, normalizedTitle: "toiletbound-hanakokun" },
  { slug: "dekin-no-mogura-the-earthbound-mole", anilistId: 172265, normalizedTitle: "dekin-no-mogura-the-earthbound-mole" },
  { slug: "my-dress-up-darling", anilistId: 132405, normalizedTitle: "my-dressup-darling" },
  { slug: "new-saga", anilistId: 172267, normalizedTitle: "new-saga" },
  { slug: "reborn-as-a-vending-machine-i-now-wander-the-dungeon", anilistId: 151661, normalizedTitle: "reborn-as-a-vending-machine-i-now-wander-the-dungeon" },
  { slug: "horimiya", anilistId: 124845, normalizedTitle: "horimiya" },
  { slug: "lord-of-mysteries", anilistId: 172269, normalizedTitle: "lord-of-mysteries" },
  { slug: "ultraviolet-code-044", anilistId: 172271, normalizedTitle: "ultraviolet-code-044" },
  { slug: "vipers-creed", anilistId: 172273, normalizedTitle: "vipers-creed" },
  { slug: "akuma-kun", anilistId: 172275, normalizedTitle: "akuma-kun" },
  { slug: "kurozuka", anilistId: 4898, normalizedTitle: "kurozuka" },
  { slug: "guin-saga", anilistId: 5956, normalizedTitle: "guin-saga" },
  { slug: "valkyria-chronicles", anilistId: 5507, normalizedTitle: "valkyria-chronicles" },
  { slug: "sakamoto-days", anilistId: 172277, normalizedTitle: "sakamoto-days" },
  { slug: "garouden-the-way-of-the-lone-wolf", anilistId: 172279, normalizedTitle: "garouden-the-way-of-the-lone-wolf" },
  { slug: "even-given-the-worthless-appraiser-class-im-actually-the-strongest", anilistId: 172281, normalizedTitle: "even-given-the-worthless-appraiser-class-im-actually-the-strongest" },
  { slug: "leviathan", anilistId: 172283, normalizedTitle: "leviathan" },
  { slug: "gachiakuta", anilistId: 172285, normalizedTitle: "gachiakuta" },
  { slug: "welcome-to-the-outcasts-restaurant", anilistId: 172287, normalizedTitle: "welcome-to-the-outcasts-restaurant" },
  { slug: "clevatess", anilistId: 172289, normalizedTitle: "clevatess" },
  { slug: "paradox-live-the-animation", anilistId: 156717, normalizedTitle: "paradox-live-the-animation" },
  { slug: "murder-drones", anilistId: 172291, normalizedTitle: "murder-drones" },
  { slug: "kaguya-sama-love-is-war", anilistId: 101921, normalizedTitle: "kaguyasama-love-is-war" },
  { slug: "classroom-of-the-elite", anilistId: 98444, normalizedTitle: "classroom-of-the-elite" },
  { slug: "mob-psycho-100", anilistId: 100876, normalizedTitle: "mob-psycho-100" },
  { slug: "teogonia", anilistId: 172293, normalizedTitle: "teogonia" },
  { slug: "one-punch-man", anilistId: 21087, normalizedTitle: "onepunch-man" },
  { slug: "the-shiunji-family-children", anilistId: 172295, normalizedTitle: "the-shiunji-family-children" },
  { slug: "the-gorilla-gods-go-to-girl", anilistId: 172297, normalizedTitle: "the-gorilla-gods-goto-girl" },
  { slug: "i-parry-everything", anilistId: 172299, normalizedTitle: "i-parry-everything" },
  { slug: "let-this-grieving-soul-retire", anilistId: 172301, normalizedTitle: "let-this-grieving-soul-retire" },
  { slug: "overlord", anilistId: 93483, normalizedTitle: "overlord" },
  { slug: "catch-me-at-the-ballpark", anilistId: 172303, normalizedTitle: "catch-me-at-the-ballpark" },
  { slug: "once-upon-a-witchs-death", anilistId: 172305, normalizedTitle: "once-upon-a-witchs-death" },
  { slug: "mobile-suit-gundam-gquuuuuux", anilistId: 172307, normalizedTitle: "mobile-suit-gundam-gquuuuuux" },
  { slug: "jojos-bizarre-adventure", anilistId: 21039, normalizedTitle: "jojos-bizarre-adventure" },
  { slug: "devil-may-cry", anilistId: 2001, normalizedTitle: "devil-may-cry" },
  { slug: "the-beginning-after-the-end", anilistId: 172309, normalizedTitle: "the-beginning-after-the-end" },
  { slug: "the-unaware-atelier-meister", anilistId: 172311, normalizedTitle: "the-unaware-atelier-meister" },
  { slug: "the-magical-girl-and-the-evil-lieutenant-used-to-be-archenemies", anilistId: 172313, normalizedTitle: "the-magical-girl-and-the-evil-lieutenant-used-to-be-archenemies" },
  { slug: "oddballs", anilistId: 172315, normalizedTitle: "oddballs" },
  { slug: "wolf-king", anilistId: 172317, normalizedTitle: "wolf-king" },
  { slug: "mighty-monsterwheelies", anilistId: 172319, normalizedTitle: "mighty-monsterwheelies" },
  { slug: "inside-job-2", anilistId: 132277, normalizedTitle: "inside-job" },
  { slug: "blue-eye-samurai", anilistId: 172321, normalizedTitle: "blue-eye-samurai" },
  { slug: "agent-elvis", anilistId: 172323, normalizedTitle: "agent-elvis" },
  { slug: "angry-birds-summer-madness", anilistId: 172325, normalizedTitle: "angry-birds-summer-madness" },
  { slug: "sonic-prime", anilistId: 172327, normalizedTitle: "sonic-prime" },
  { slug: "farzar", anilistId: 172329, normalizedTitle: "farzar" },
  { slug: "tomb-raider-the-legend-of-lara-croft", anilistId: 172331, normalizedTitle: "tomb-raider-the-legend-of-lara-croft" },
  { slug: "super-giant-robot-brothers", anilistId: 172333, normalizedTitle: "super-giant-robot-brothers" },
  { slug: "secret-level", anilistId: 172335, normalizedTitle: "secret-level" },
  { slug: "scott-pilgrim-takes-off", anilistId: 172337, normalizedTitle: "scott-pilgrim-takes-off" },
  { slug: "sausage-party-foodtopia", anilistId: 172339, normalizedTitle: "sausage-party-foodtopia" },
  { slug: "jurassic-world-chaos-theory", anilistId: 172341, normalizedTitle: "jurassic-world-chaos-theory" },
  { slug: "maya-and-the-three", anilistId: 172343, normalizedTitle: "maya-and-the-three" },
  { slug: "hazbin-hotel", anilistId: 172345, normalizedTitle: "hazbin-hotel" },
  { slug: "captain-laserhawk-a-blood-dragon-remix", anilistId: 172347, normalizedTitle: "captain-laserhawk-a-blood-dragon-remix" },
  { slug: "invincible", anilistId: 120280, normalizedTitle: "invincible" },
  { slug: "zig-and-sharko", anilistId: 172349, normalizedTitle: "zig-and-sharko" },
  { slug: "twilight-of-the-gods", anilistId: 172351, normalizedTitle: "twilight-of-the-gods" },
  { slug: "arcane", anilistId: 129822, normalizedTitle: "arcane" },
  { slug: "jentry-chau-vs-the-underworld", anilistId: 172353, normalizedTitle: "jentry-chau-vs-the-underworld" },
  { slug: "batman-caped-crusader", anilistId: 172355, normalizedTitle: "batman-caped-crusader" },
  { slug: "the-legend-of-vox-machina", anilistId: 129822, normalizedTitle: "the-legend-of-vox-machina" },
  { slug: "castlevania-nocturne", anilistId: 142838, normalizedTitle: "castlevania-nocturne" },
  { slug: "castlevania", anilistId: 98444, normalizedTitle: "castlevania" },
  { slug: "the-god-of-high-school", anilistId: 120328, normalizedTitle: "the-god-of-high-school" },
  { slug: "the-dragon-prince", anilistId: 105333, normalizedTitle: "the-dragon-prince" },
  { slug: "as-a-reincarnated-aristocrat-ill-use-my-appraisal-skill-to-rise-in-the-world", anilistId: 151661, normalizedTitle: "as-a-reincarnated-aristocrat-ill-use-my-appraisal-skill-to-rise-in-the-world" },
  { slug: "the-maid-i-hired-recently-is-mysterious", anilistId: 132374, normalizedTitle: "the-maid-i-hired-recently-is-mysterious" },
  { slug: "delicious-in-dungeon", anilistId: 146065, normalizedTitle: "delicious-in-dungeon" },
  { slug: "the-strongest-tanks-labyrinth-raids-a-tank-with-a-rare-9999-resistance-skill-got-kicked-from-the-heros-party", anilistId: 172357, normalizedTitle: "the-strongest-tanks-labyrinth-raids-a-tank-with-a-rare-9999-resistance-skill-got-kicked-from-the-heros-party" },
  { slug: "attack-on-titan", anilistId: 16498, normalizedTitle: "attack-on-titan" },
  { slug: "re-zero-starting-life-in-another-world", anilistId: 21355, normalizedTitle: "re-zero-starting-life-in-another-world" },
  { slug: "aoashi", anilistId: 132374, normalizedTitle: "aoashi" },
  { slug: "chillin-in-another-world-with-level-2-super-cheat-powers", anilistId: 151661, normalizedTitle: "chillin-in-another-world-with-level-2-super-cheat-powers" },
  { slug: "she-professed-herself-pupil-of-the-wise-man", anilistId: 132405, normalizedTitle: "she-professed-herself-pupil-of-the-wise-man" },
  { slug: "the-angel-next-door-spoils-me-rotten", anilistId: 146065, normalizedTitle: "the-angel-next-door-spoils-me-rotten" },
  { slug: "summer-time-rendering", anilistId: 140339, normalizedTitle: "summer-time-rendering" },
  { slug: "more-than-a-married-couple-but-not-lovers", anilistId: 132374, normalizedTitle: "more-than-a-married-couple-but-not-lovers" },
  { slug: "mobile-suit-gundam-the-witch-from-mercury", anilistId: 140339, normalizedTitle: "mobile-suit-gundam-the-witch-from-mercury" },
  { slug: "junji-ito-collection", anilistId: 98444, normalizedTitle: "junji-ito-collection" },
  { slug: "rent-a-girlfriend", anilistId: 120328, normalizedTitle: "rentagirlfriend" },
  { slug: "remonster", anilistId: 151661, normalizedTitle: "remonster" },
  { slug: "villainess-level-99-i-may-be-the-hidden-boss-but-im-not-the-demon-lord", anilistId: 172359, normalizedTitle: "villainess-level-99-i-may-be-the-hidden-boss-but-im-not-the-demon-lord" },
  { slug: "black-butler", anilistId: 4898, normalizedTitle: "black-butler" },
  { slug: "my-happy-marriage", anilistId: 146065, normalizedTitle: "my-happy-marriage" },
  { slug: "black-rock-shooter-dawn-fall", anilistId: 132374, normalizedTitle: "black-rock-shooter-dawn-fall" },
  { slug: "bleach-thousand-year-blood-war", anilistId: 129822, normalizedTitle: "bleach-thousandyear-blood-war" },
  { slug: "ameku-m-d-doctor-detective", anilistId: 172361, normalizedTitle: "ameku-md-doctor-detective" },
  { slug: "code-geass-lelouch-of-the-rebellion", anilistId: 1575, normalizedTitle: "code-geass-lelouch-of-the-rebellion" },
  { slug: "kamikatsu-working-for-god-in-a-godless-world", anilistId: 151661, normalizedTitle: "kamikatsu-working-for-god-in-a-godless-world" },
  { slug: "buddy-daddies", anilistId: 146065, normalizedTitle: "buddy-daddies" },
  { slug: "handyman-saitou-in-another-world", anilistId: 151661, normalizedTitle: "handyman-saitou-in-another-world" },
  { slug: "i-got-a-cheat-skill-in-another-world-and-became-unrivaled-in-the-real-world-too", anilistId: 151661, normalizedTitle: "i-got-a-cheat-skill-in-another-world-and-became-unrivaled-in-the-real-world-too" },
  { slug: "akudama-drive", anilistId: 120328, normalizedTitle: "akudama-drive" },
  { slug: "hunter-x-hunter", anilistId: 11061, normalizedTitle: "hunter-x-hunter" },
  { slug: "berserk-of-gluttony", anilistId: 151661, normalizedTitle: "berserk-of-gluttony" },
  { slug: "a-salad-bowl-of-eccentrics", anilistId: 172363, normalizedTitle: "a-salad-bowl-of-eccentrics" },
  { slug: "a-couple-of-cuckoos", anilistId: 132374, normalizedTitle: "a-couple-of-cuckoos" },
  { slug: "my-one-hit-kill-sister", anilistId: 172365, normalizedTitle: "my-onehit-kill-sister" },
  { slug: "reign-of-the-seven-spellblades", anilistId: 151661, normalizedTitle: "reign-of-the-seven-spellblades" },
  { slug: "zom-100-bucket-list-of-the-dead", anilistId: 142838, normalizedTitle: "zom-100-bucket-list-of-the-dead" },
  { slug: "masamune-kuns-revenge", anilistId: 98444, normalizedTitle: "masamunekuns-revenge" },
  { slug: "the-case-study-of-vanitas", anilistId: 129822, normalizedTitle: "the-case-study-of-vanitas" },
  { slug: "my-love-story-with-yamada-kun-at-lv999", anilistId: 146065, normalizedTitle: "my-love-story-with-yamadakun-at-lv999" },
  { slug: "im-in-love-with-the-villainess", anilistId: 151661, normalizedTitle: "im-in-love-with-the-villainess" },
  { slug: "trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs", anilistId: 151661, normalizedTitle: "trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs" },
  { slug: "tomo-chan-is-a-girl", anilistId: 132374, normalizedTitle: "tomochan-is-a-girl" },
  { slug: "fairy-tail", anilistId: 6702, normalizedTitle: "fairy-tail" },
  { slug: "the-wrong-way-to-use-healing-magic", anilistId: 172367, normalizedTitle: "the-wrong-way-to-use-healing-magic" },
  { slug: "fairy-tail-100-years-quest", anilistId: 172369, normalizedTitle: "fairy-tail-100-years-quest" },
  { slug: "the-worlds-finest-assassin-gets-reincarnated-in-another-world-as-an-aristocrat", anilistId: 151661, normalizedTitle: "the-worlds-finest-assassin-gets-reincarnated-in-another-world-as-an-aristocrat" },
  { slug: "relife", anilistId: 30015, normalizedTitle: "relife" },
  { slug: "ranking-of-kings-the-treasure-chest-of-courage", anilistId: 142838, normalizedTitle: "ranking-of-kings-the-treasure-chest-of-courage" },
  { slug: "ranking-of-kings", anilistId: 129822, normalizedTitle: "ranking-of-kings" },
  { slug: "frieren-beyond-journeys-end", anilistId: 146065, normalizedTitle: "frieren-beyond-journeys-end" },
  { slug: "radiant", anilistId: 101921, normalizedTitle: "radiant" },
  { slug: "the-red-ranger-becomes-an-adventurer-in-another-world", anilistId: 172371, normalizedTitle: "the-red-ranger-becomes-an-adventurer-in-another-world" },
  { slug: "solo-leveling", anilistId: 142838, normalizedTitle: "solo-leveling" },
  { slug: "im-getting-married-to-a-girl-i-hate-in-my-class", anilistId: 172373, normalizedTitle: "im-getting-married-to-a-girl-i-hate-in-my-class" },
  { slug: "possibly-the-greatest-alchemist-of-all-time", anilistId: 172375, normalizedTitle: "possibly-the-greatest-alchemist-of-all-time" },
  { slug: "vampire-dormitory", anilistId: 172377, normalizedTitle: "vampire-dormitory" },
  { slug: "the-reincarnation-of-the-strongest-exorcist-in-another-world", anilistId: 151661, normalizedTitle: "the-reincarnation-of-the-strongest-exorcist-in-another-world" },
  { slug: "the-many-sides-of-voice-actor-radio", anilistId: 172379, normalizedTitle: "the-many-sides-of-voice-actor-radio" },
  { slug: "the-great-cleric", anilistId: 151661, normalizedTitle: "the-great-cleric" },
  { slug: "the-detective-is-already-dead", anilistId: 129822, normalizedTitle: "the-detective-is-already-dead" },
  { slug: "the-apothecary-diaries", anilistId: 146065, normalizedTitle: "the-apothecary-diaries" },
  { slug: "the-ancient-magus-bride", anilistId: 98444, normalizedTitle: "the-ancient-magus-bride" },
  { slug: "welcome-to-demon-school-iruma-kun", anilistId: 110784, normalizedTitle: "welcome-to-demon-school-irumakun" },
  { slug: "dead-mount-death-play", anilistId: 142838, normalizedTitle: "dead-mount-death-play" },
  { slug: "an-archdemons-dilemma-how-to-love-your-elf-bride", anilistId: 172381, normalizedTitle: "an-archdemons-dilemma-how-to-love-your-elf-bride" },
  { slug: "why-raeliana-ended-up-at-the-dukes-mansion", anilistId: 146065, normalizedTitle: "why-raeliana-ended-up-at-the-dukes-mansion" },
  { slug: "my-unique-skill-makes-me-op-even-at-level-1", anilistId: 151661, normalizedTitle: "my-unique-skill-makes-me-op-even-at-level-1" },
  { slug: "my-tiny-senpai", anilistId: 132374, normalizedTitle: "my-tiny-senpai" },
  { slug: "metallic-rouge", anilistId: 172383, normalizedTitle: "metallic-rouge" },
  { slug: "true-beauty", anilistId: 172385, normalizedTitle: "true-beauty" },
  { slug: "bartender-glass-of-god", anilistId: 172387, normalizedTitle: "bartender-glass-of-god" },
  { slug: "dr-stone", anilistId: 105333, normalizedTitle: "dr-stone" },
  { slug: "kiteretsu-daihyakka", anilistId: 172389, normalizedTitle: "kiteretsu" },
  { slug: "zenshu", anilistId: 172391, normalizedTitle: "zenshu" },
  { slug: "magic-maker-how-to-make-magic-in-another-world", anilistId: 172393, normalizedTitle: "magic-maker-how-to-make-magic-in-another-world" },
  { slug: "a-condition-called-love", anilistId: 172395, normalizedTitle: "a-condition-called-love" },
  { slug: "tokyo-24th-ward", anilistId: 132374, normalizedTitle: "tokyo-24th-ward" },
  { slug: "miss-kuroitsu-from-the-monster-development-department", anilistId: 132405, normalizedTitle: "miss-kuroitsu-from-the-monster-development-department" },
  { slug: "the-weakest-tamer-began-a-journey-to-pick-up-trash", anilistId: 151661, normalizedTitle: "the-weakest-tamer-began-a-journey-to-pick-up-trash" },
  { slug: "i-was-reincarnated-as-the-7th-prince-so-i-can-take-my-time-perfecting-my-magical-ability", anilistId: 172397, normalizedTitle: "i-was-reincarnated-as-the-7th-prince-so-i-can-take-my-time-perfecting-my-magical-ability" },
  { slug: "mashle-magic-and-muscles", anilistId: 140339, normalizedTitle: "mashle-magic-and-muscles" },
  { slug: "hokkaido-gals-are-super-adorable", anilistId: 132374, normalizedTitle: "hokkaido-gals-are-super-adorable" },
  { slug: "bucchigiri", anilistId: 172399, normalizedTitle: "bucchigiri" },
  { slug: "the-iceblade-sorcerer-shall-rule-the-world", anilistId: 151661, normalizedTitle: "the-iceblade-sorcerer-shall-rule-the-world" },
  { slug: "i-shall-survive-using-potions", anilistId: 151661, normalizedTitle: "i-shall-survive-using-potions" },
  { slug: "viral-hit", anilistId: 172401, normalizedTitle: "viral-hit" },
  { slug: "wind-breaker", anilistId: 172403, normalizedTitle: "wind-breaker" },
  { slug: "one-piece", anilistId: 21, normalizedTitle: "one-piece" },
  { slug: "tsukimichi-moonlit-fantasy", anilistId: 151661, normalizedTitle: "tsukimichi-moonlit-fantasy" },
  { slug: "fire-force", anilistId: 110784, normalizedTitle: "fire-force" },
  { slug: "tokyo-revengers", anilistId: 120328, normalizedTitle: "tokyo-revengers" },
  { slug: "campfire-cooking-in-another-world-with-my-absurd-skill", anilistId: 151661, normalizedTitle: "campfire-cooking-in-another-world-with-my-absurd-skill" },
  { slug: "sword-art-online-alternative-gun-gale-online", anilistId: 101921, normalizedTitle: "sword-art-online-alternative-gun-gale-online" },
  { slug: "spy-x-family", anilistId: 140339, normalizedTitle: "spy-x-family" },
  { slug: "the-daily-life-of-the-immortal-king", anilistId: 120280, normalizedTitle: "the-daily-life-of-the-immortal-king" },
  { slug: "sword-art-online", anilistId: 11757, normalizedTitle: "sword-art-online" },
  { slug: "dragon-ball-daima", anilistId: 172405, normalizedTitle: "dragon-ball-daima" },
  { slug: "rurouni-kenshin-2023", anilistId: 142838, normalizedTitle: "rurouni-kenshin-2023" },
  { slug: "ranma-", anilistId: 172407, normalizedTitle: "ranma-2024" },
  { slug: "mushoku-tensei-jobless-reincarnation", anilistId: 108632, normalizedTitle: "mushoku-tensei-jobless-reincarnation" },
  { slug: "you-are-ms-servant", anilistId: 172409, normalizedTitle: "you-are-ms-servant" },
  { slug: "demon-lord-retry", anilistId: 151661, normalizedTitle: "demon-lord-retry" },
  { slug: "shangri-la-frontier", anilistId: 142838, normalizedTitle: "shangrila-frontier" },
  { slug: "lookism", anilistId: 132374, normalizedTitle: "lookism" },
  { slug: "trillion-game", anilistId: 172411, normalizedTitle: "trillion-game" },
  { slug: "good-bye-dragon-life", anilistId: 172413, normalizedTitle: "good-bye-dragon-life" },
  { slug: "365-days-to-the-wedding", anilistId: 172415, normalizedTitle: "365-days-to-the-wedding" },
  { slug: "dan-da-dan", anilistId: 172417, normalizedTitle: "dan-da-dan" },
  { slug: "assassination-classroom", anilistId: 101921, normalizedTitle: "assassination-classroom" },
  { slug: "ill-become-a-villainess-who-goes-down-in-history", anilistId: 172419, normalizedTitle: "ill-become-a-villainess-who-goes-down-in-history" },
  { slug: "tying-the-knot-with-an-amagami-sister", anilistId: 172421, normalizedTitle: "tying-the-knot-with-an-amagami-sister" },
  { slug: "nina-the-starry-bride", anilistId: 172423, normalizedTitle: "nina-the-starry-bride" },
  { slug: "teen-titans", anilistId: 172425, normalizedTitle: "teen-titans" },
  { slug: "darling-in-the-franxx", anilistId: 101921, normalizedTitle: "darling-in-the-franxx" },
  { slug: "inside-job", anilistId: 132277, normalizedTitle: "inside-job" },
  { slug: "the-amazing-world-of-gumball", anilistId: 172427, normalizedTitle: "the-amazing-world-of-gumball" },
  { slug: "chainsaw-man", anilistId: 140339, normalizedTitle: "chainsaw-man" },
  { slug: "haikyu", anilistId: 20583, normalizedTitle: "haikyu" },
  { slug: "dragon-ball", anilistId: 2236, normalizedTitle: "dragon-ball" },
  { slug: "log-horizon", anilistId: 172429, normalizedTitle: "log-horizon" },
  { slug: "vinland-saga", anilistId: 101348, normalizedTitle: "vinland-saga" },
  { slug: "transformers-rescue-bots", anilistId: 172431, normalizedTitle: "transformers-rescue-bots" },
  { slug: "kim-possible", anilistId: 172433, normalizedTitle: "kim-possible" },
  { slug: "pokemon-horizons-the-series", anilistId: 156717, normalizedTitle: "pokmon-horizons-the-series" },
  { slug: "no-longer-allowed-in-another-world", anilistId: 172435, normalizedTitle: "no-longer-allowed-in-another-world" },
  { slug: "vtuber-legend-how-i-went-viral-after-forgetting-to-turn-off-my-stream", anilistId: 172437, normalizedTitle: "vtuber-legend-how-i-went-viral-after-forgetting-to-turn-off-my-stream" },
  { slug: "wistoria-wand-and-sword", anilistId: 172439, normalizedTitle: "wistoria-wand-and-sword" },
  { slug: "why-does-nobody-remember-me-in-this-world", anilistId: 172441, normalizedTitle: "why-does-nobody-remember-me-in-this-world" },
  { slug: "makeine-too-many-losing-heroines", anilistId: 172443, normalizedTitle: "makeine-too-many-losing-heroines" },
  { slug: "the-elusive-samurai", anilistId: 172445, normalizedTitle: "the-elusive-samurai" },
  { slug: "twilight-out-of-focus", anilistId: 172447, normalizedTitle: "twilight-out-of-focus" },
  { slug: "days-with-my-stepsister", anilistId: 172449, normalizedTitle: "days-with-my-stepsister" },
  { slug: "naruto", anilistId: 20, normalizedTitle: "naruto" },
  { slug: "bye-bye-earth", anilistId: 172451, normalizedTitle: "bye-bye-earth" },
  { slug: "alya-sometimes-hides-her-feelings-in-russian", anilistId: 172453, normalizedTitle: "alya-sometimes-hides-her-feelings-in-russian" },
  { slug: "the-strongest-magician-in-the-demon-lords-army-was-a-human", anilistId: 172455, normalizedTitle: "the-strongest-magician-in-the-demon-lords-army-was-a-human" },
  { slug: "black-clover", anilistId: 98444, normalizedTitle: "black-clover" },
  { slug: "banished-from-the-heros-party-i-decided-to-live-a-quiet-life-in-the-countryside", anilistId: 151661, normalizedTitle: "banished-from-the-heros-party-i-decided-to-live-a-quiet-life-in-the-countryside" },
  { slug: "jujutsu-kaisen", anilistId: 113415, normalizedTitle: "jujutsu-kaisen" },
  { slug: "that-time-i-got-reincarnated-as-a-slime", anilistId: 101348, normalizedTitle: "that-time-i-got-reincarnated-as-a-slime" },
  { slug: "dragon-ball-z-kai", anilistId: 172457, normalizedTitle: "dragon-ball-z-kai" },
  { slug: "kaiju-no-8", anilistId: 142838, normalizedTitle: "kaiju-no-8" },
  { slug: "gods-games-we-play", anilistId: 172459, normalizedTitle: "gods-games-we-play" },
  { slug: "akebis-sailor-uniform", anilistId: 132374, normalizedTitle: "akebis-sailor-uniform" },
  { slug: "quality-assurance-in-another-world", anilistId: 172461, normalizedTitle: "quality-assurance-in-another-world" },
  { slug: "tower-of-god", anilistId: 120328, normalizedTitle: "tower-of-god" },
  { slug: "blue-lock", anilistId: 140339, normalizedTitle: "blue-lock" },
  { slug: "doraemon", anilistId: 172463, normalizedTitle: "doraemon-1979" },
  { slug: "shinchan", anilistId: 172465, normalizedTitle: "shinchan" },
  { slug: "beywheelz", anilistId: 172467, normalizedTitle: "beywheelz" },
  { slug: "hoops", anilistId: 172469, normalizedTitle: "hoops" },
  { slug: "boboiboy", anilistId: 172471, normalizedTitle: "boboiboy" },
  { slug: "the-gutsy-frog", anilistId: 172473, normalizedTitle: "the-gutsy-frog" },
  { slug: "ben-10", anilistId: 172475, normalizedTitle: "ben-10-classic" },
  { slug: "pacific-rim-the-black", anilistId: 120280, normalizedTitle: "pacific-rim-the-black" },
  { slug: "marvels-ultimate-spider-man", anilistId: 172477, normalizedTitle: "marvels-ultimate-spiderman" },
  { slug: "ghost-in-the-shell-sac", anilistId: 110784, normalizedTitle: "ghost-in-the-shell-sac2045" },
  { slug: "marvels-spider-man", anilistId: 172479, normalizedTitle: "marvels-spiderman" },
  { slug: "dino-girl-gauko", anilistId: 172481, normalizedTitle: "dino-girl-gauko" },
  { slug: "tron-uprising", anilistId: 172483, normalizedTitle: "tron-uprising" },
  { slug: "the-legend-of-korra", anilistId: 172485, normalizedTitle: "the-legend-of-korra" },
  { slug: "digimon-adventure", anilistId: 172487, normalizedTitle: "digimon-adventure" },
  { slug: "dota-dragons-blood", anilistId: 120280, normalizedTitle: "dota-dragons-blood" },
  { slug: "ben-10-alien-force", anilistId: 172489, normalizedTitle: "ben-10-alien-force" },
  { slug: "ninja-hattori-returns", anilistId: 172491, normalizedTitle: "ninja-hattori-returns" },
  { slug: "johnny-bravo", anilistId: 172493, normalizedTitle: "johnny-bravo" },
  { slug: "inspector-gadget", anilistId: 172495, normalizedTitle: "inspector-gadget" },
  { slug: "ninja-hattori-1981", anilistId: 172497, normalizedTitle: "ninja-hattori-1981" },
  { slug: "disenchantment", anilistId: 101921, normalizedTitle: "disenchantment" },
  { slug: "horrid-henry", anilistId: 172499, normalizedTitle: "horrid-henry" },
  { slug: "beyblade-metal-saga", anilistId: 172501, normalizedTitle: "beyblade-metal-saga" },
  { slug: "kid-cosmic", anilistId: 172503, normalizedTitle: "kid-cosmic" },
  { slug: "he-man-and-the-masters-of-the-universe", anilistId: 172505, normalizedTitle: "heman-and-the-masters-of-the-universe" },
  { slug: "beyblade-burst", anilistId: 172507, normalizedTitle: "beyblade-burst" },
  { slug: "the-last-kids-on-earth", anilistId: 172509, normalizedTitle: "the-last-kids-on-earth" },
  { slug: "doraemon-2005", anilistId: 172511, normalizedTitle: "doraemon-2005" },
  { slug: "the-incredible-hulk", anilistId: 172513, normalizedTitle: "the-incredible-hulk" },
  { slug: "super-shiro", anilistId: 172515, normalizedTitle: "super-shiro" },
  { slug: "blood-of-zeus", anilistId: 120280, normalizedTitle: "blood-of-zeus" },
  { slug: "wizards-tales-of-arcadia", anilistId: 172517, normalizedTitle: "wizards-tales-of-arcadia" },
  { slug: "dragon-ball-super", anilistId: 21634, normalizedTitle: "dragon-ball-super" },
  { slug: "3below-tales-of-arcadia", anilistId: 172519, normalizedTitle: "3below-tales-of-arcadia" },
  { slug: "trollhunters-tales-of-arcadia", anilistId: 172521, normalizedTitle: "trollhunters-tales-of-arcadia" },
  { slug: "dragon-ball-z", anilistId: 813, normalizedTitle: "dragon-ball-z" },
  { slug: "star-trek-lower-decks", anilistId: 172523, normalizedTitle: "star-trek-lower-decks" },
  { slug: "niko-and-the-sword-of-light-2", anilistId: 172525, normalizedTitle: "niko-and-the-sword-of-light" },
  { slug: "pokemon-journeys-the-series", anilistId: 114535, normalizedTitle: "pokmon-journeys-the-series" },
  { slug: "starbeam", anilistId: 172527, normalizedTitle: "starbeam" },
  { slug: "big-city-greens", anilistId: 172529, normalizedTitle: "big-city-greens" },
  { slug: "timon-and-pumbaa", anilistId: 172531, normalizedTitle: "timon-and-pumbaa" },
  { slug: "pokemon-the-series-sun-moon", anilistId: 98444, normalizedTitle: "pokmon-the-series-sun-moon" },
  { slug: "supa-strikas", anilistId: 172533, normalizedTitle: "supa-strikas-rookie-season" },
  { slug: "jurassic-world-camp-cretaceous", anilistId: 120280, normalizedTitle: "jurassic-world-camp-cretaceous" },
  { slug: "pokemon-the-series-xy", anilistId: 20663, normalizedTitle: "pokmon-the-series-xy" },
  { slug: "marvels-guardians-of-the-galaxy", anilistId: 172535, normalizedTitle: "guardians-of-the-galaxy" },
  { slug: "american-dragon-jake-long", anilistId: 172537, normalizedTitle: "american-dragon-jake-long" },
  { slug: "johnny-test-2", anilistId: 172539, normalizedTitle: "johnny-test" },
  { slug: "pokemon-the-series-black-white", anilistId: 11061, normalizedTitle: "pokmon-the-series-black-white" },
  { slug: "star-wars-the-bad-batch", anilistId: 120280, normalizedTitle: "star-wars-the-bad-batch" },
  { slug: "star-wars-resistance", anilistId: 172541, normalizedTitle: "star-wars-resistance" },
  { slug: "star-wars-rebels", anilistId: 172543, normalizedTitle: "star-wars-rebels" },
  { slug: "pokemon-the-series-diamond-and-pearl", anilistId: 1565, normalizedTitle: "pokmon-the-series-diamond-and-pearl" },
  { slug: "young-justice", anilistId: 172545, normalizedTitle: "young-justice" },
  { slug: "kick-buttowski-suburban-daredevil", anilistId: 172547, normalizedTitle: "kick-buttowski-suburban-daredevil" },
  { slug: "gravity-falls", anilistId: 172549, normalizedTitle: "gravity-falls" },
  { slug: "marvels-hulk-and-the-agents-of-s-m-a-s-h", anilistId: 172551, normalizedTitle: "marvels-hulk-and-the-agents-of-smash" },
  { slug: "fast-furious-spy-racers", anilistId: 172553, normalizedTitle: "fast-furious-spy-racers" },
  { slug: "oggy-and-the-cockroaches", anilistId: 172555, normalizedTitle: "oggy-and-the-cockroaches" },
  { slug: "phineas-and-ferb", anilistId: 172557, normalizedTitle: "phineas-and-ferb" },
  { slug: "pokemon-the-series-ruby-and-sapphire", anilistId: 527, normalizedTitle: "pokmon-the-series-ruby-and-sapphire" },
  { slug: "what-if", anilistId: 120280, normalizedTitle: "what-if" },
  { slug: "love-death-robots", anilistId: 101921, normalizedTitle: "love-death-robots" },
  { slug: "iron-man-armored-adventures", anilistId: 172559, normalizedTitle: "iron-man-armored-adventures" },
  { slug: "pokemon-the-series-gold-and-silver", anilistId: 527, normalizedTitle: "pokmon-the-series-gold-and-silver" },
  { slug: "iron-man", anilistId: 172561, normalizedTitle: "iron-man" },
  { slug: "star-wars-visions", anilistId: 120280, normalizedTitle: "star-wars-visions" },
  { slug: "generator-rex", anilistId: 172563, normalizedTitle: "generator-rex" },
  { slug: "kung-fu-panda-the-paws-of-destiny", anilistId: 172565, normalizedTitle: "kung-fu-panda-the-paws-of-destiny" },
  { slug: "pokemon-the-series-the-beginning", anilistId: 527, normalizedTitle: "pokmon-the-series-the-beginning" },
  { slug: "avatar-the-last-airbender", anilistId: 172567, normalizedTitle: "avatar-the-last-airbender" },
  { slug: "transformers-robots-in-disguise", anilistId: 172569, normalizedTitle: "transformers-robots-in-disguise" },
  { slug: "transformers-war-for-cybertron-trilogy", anilistId: 172571, normalizedTitle: "transformers-war-for-cybertron-trilogy" },
  { slug: "transformers-prime", anilistId: 172573, normalizedTitle: "transformers-prime" },
  { slug: "teen-titans-go", anilistId: 172575, normalizedTitle: "teen-titans-go" },
  { slug: "https-anthe-avengers-earths-mightiest-heroes", anilistId: 172577, normalizedTitle: "the-avengers-earths-mightiest-heroes" },
  { slug: "future-avengers", anilistId: 172579, normalizedTitle: "marvels-future-avengers" },
  { slug: "avengers-assemble", anilistId: 172581, normalizedTitle: "marvels-avengers" },
  { slug: "slugterra", anilistId: 172583, normalizedTitle: "slugterra" },
  { slug: "miraculous-tales-of-ladybug-cat-noir", anilistId: 98444, normalizedTitle: "miraculous-tales-of-ladybug-cat-noir" },
  { slug: "ben-10-reboot", anilistId: 172585, normalizedTitle: "ben-10-reboot" },
  { slug: "ben-10-omniverse", anilistId: 172587, normalizedTitle: "ben-10-omniverse" },
  { slug: "ben-10-ultimate-alien", anilistId: 172589, normalizedTitle: "ben-10-ultimate-alien" },
  { slug: "demon-slayer", anilistId: 101922, normalizedTitle: "demon-slayer" },
  { slug: "my-hero-academia", anilistId: 101348, normalizedTitle: "my-hero-academia" },
  { slug: "kid-vs-kat", anilistId: 172591, normalizedTitle: "kid-vs-kat" },
  { slug: "transformers-rescue-bots-academy", anilistId: 172593, normalizedTitle: "transformers-rescue-bots-academy" }
];

// FIXED URL PATTERNS - USING CORRECT ENDPOINTS
const URL_PATTERNS = {
  animeworld: {
    episode: (slug, season, episode) => 
      `https://watchanimeworld.in/episode/${slug}-${season}x${episode}/`,
    anime: (slug) => `https://watchanimeworld.in/anime/${slug}/`
  },
  toonstream: {
    episode: (slug, season, episode) => 
      `https://toonstream.love/episode/${slug}-${season}x${episode}/`,
    anime: (slug) => `https://toonstream.love/anime/${slug}/`
  }
};

// SIMPLE BUT RELIABLE IFRAME EXTRACTOR
async function extractIframesSimple(url) {
  try {
    console.log(`🔍 Extracting from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const iframes = [];

    // Extract all iframes
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('//')) {
        const fullUrl = src.startsWith('http') ? src : `https:${src}`;
        iframes.push({
          url: fullUrl,
          server: detectServer(fullUrl),
          quality: 'auto'
        });
      }
    });

    // Also check for video elements
    $('video source').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        iframes.push({
          url: src.startsWith('http') ? src : new URL(src, url).href,
          server: 'direct',
          quality: $(el).attr('data-quality') || 'auto'
        });
      }
    });

    console.log(`✅ Found ${iframes.length} video sources`);
    return iframes;

  } catch (error) {
    console.log(`❌ Failed to extract from ${url}:`, error.message);
    return [];
  }
}

function detectServer(url) {
  if (url.includes('streamtape')) return 'streamtape';
  if (url.includes('dood')) return 'doodstream';
  if (url.includes('filemoon')) return 'filemoon';
  if (url.includes('mixdrop')) return 'mixdrop';
  if (url.includes('mp4upload')) return 'mp4upload';
  return 'unknown';
}

function findAnimeByAnilistId(anilistId) {
  return animeDatabase.find(anime => anime.anilistId === parseInt(anilistId));
}

// MAIN API ENDPOINT - SIMPLE AND RELIABLE
app.get('/api/anime/:anilistId/:season/:episodeNum', async (req, res) => {
  const { anilistId, season, episodeNum } = req.params;
  const wantJson = req.query.json === '1';

  try {
    console.log(`🎬 Fetching: AniList ${anilistId} S${season}E${episodeNum}`);
    
    const anime = findAnimeByAnilistId(anilistId);
    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    const slug = anime.slug;
    console.log(`🔍 Using slug: ${slug}`);

    // Try both sources
    const sources = [
      URL_PATTERNS.animeworld.episode(slug, season, episodeNum),
      URL_PATTERNS.toonstream.episode(slug, season, episodeNum)
    ];

    let iframes = [];
    let successfulSource = '';

    for (const sourceUrl of sources) {
      const extracted = await extractIframesSimple(sourceUrl);
      if (extracted.length > 0) {
        iframes = extracted;
        successfulSource = sourceUrl.includes('animeworld') ? 'animeworld' : 'toonstream';
        console.log(`✅ Success from ${successfulSource}`);
        break;
      }
    }

    if (iframes.length === 0) {
      if (wantJson) {
        return res.status(404).json({ error: 'No video sources found' });
      }
      return res.send(generateErrorPage('No Video Available', 'Try another episode or check back later.'));
    }

    const payload = {
      anilist_id: parseInt(anilistId),
      anime_slug: slug,
      title: anime.normalizedTitle,
      season: parseInt(season),
      episode: parseInt(episodeNum),
      source: successfulSource,
      iframes: iframes,
      total_sources: iframes.length
    };

    if (wantJson) {
      return res.json(payload);
    }

    // Return HTML player
    const html = generateVideoPlayer(anime.normalizedTitle, season, episodeNum, iframes[0].url, iframes);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DIRECT PLAYER ENDPOINT
app.get('/api/player/:anilistId/:season/:episodeNum', async (req, res) => {
  const { anilistId, season, episodeNum } = req.params;

  try {
    const anime = findAnimeByAnilistId(anilistId);
    if (!anime) {
      return res.send(generateErrorPage('Anime Not Found', 'Anime not in database.'));
    }

    const slug = anime.slug;
    const sources = [
      URL_PATTERNS.animeworld.episode(slug, season, episodeNum),
      URL_PATTERNS.toonstream.episode(slug, season, episodeNum)
    ];

    let iframeUrl = '';
    for (const sourceUrl of sources) {
      const iframes = await extractIframesSimple(sourceUrl);
      if (iframes.length > 0) {
        iframeUrl = iframes[0].url;
        break;
      }
    }

    if (!iframeUrl) {
      return res.send(generateErrorPage('No Video', 'No video sources available.'));
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${anime.normalizedTitle} - S${season}E${episodeNum}</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }
        iframe { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="${iframeUrl}" allowfullscreen allow="autoplay; fullscreen"></iframe>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);

  } catch (error) {
    return res.send(generateErrorPage('Error', error.message));
  }
});

// HTML GENERATORS
function generateVideoPlayer(title, season, episode, primaryUrl, allIframes = []) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body { margin: 0; padding: 20px; background: #0f0f23; color: white; font-family: Arial, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; }
        .player { width: 100%; height: 70vh; margin-bottom: 20px; }
        iframe { width: 100%; height: 100%; border: none; border-radius: 10px; }
        .servers { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .server-btn { padding: 10px 15px; background: #333; border: none; border-radius: 5px; color: white; cursor: pointer; }
        .server-btn:hover { background: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title} - Season ${season} Episode ${episode}</h1>
        <div class="player">
            <iframe src="${primaryUrl}" allowfullscreen allow="autoplay; fullscreen"></iframe>
        </div>
        
        ${allIframes.length > 1 ? `
        <div class="servers">
            <h3>Alternative Servers:</h3>
            ${allIframes.slice(1).map((iframe, i) => `
                <button class="server-btn" onclick="changeServer('${iframe.url}')">
                    Server ${i + 2} (${iframe.server})
                </button>
            `).join('')}
        </div>
        ` : ''}
    </div>

    <script>
        function changeServer(url) {
            document.querySelector('iframe').src = url;
        }
    </script>
</body>
</html>`;
}

function generateErrorPage(title, message) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 40px; background: #0f0f23; color: white; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; text-align: center; }
        .error { background: #1a1a2e; padding: 40px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="error">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/" style="color: #667eea;">Return to Home</a>
    </div>
</body>
</html>`;
}

// HEALTH ENDPOINT
app.get('/health', (req, res) => {
  res.json({ 
    status: 'active', 
    anime_count: animeDatabase.length,
    version: '5.0.0'
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🎬 FIXED ANIME API v5.0
───────────────────────
✅ Using correct URL patterns:
   • AnimeWorld: /episode/{slug}-{season}x{episode}/
   • Toonstream: /episode/{slug}-{season}x{episode}/
🚀 Server running on port ${PORT}
───────────────────────
📺 Test these endpoints:
   http://localhost:${PORT}/api/anime/20/1/1
   http://localhost:${PORT}/api/player/20/1/1
───────────────────────
  `);
});
