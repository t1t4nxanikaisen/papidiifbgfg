const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();

// Root docs endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Anime API Endpoints',
    version: '1.0',
    status: 'active',
    endpoints: [
      {
        name: 'AniList TV Episode',
        method: 'GET',
        url: '/anime/api/{anilist}/{season}/{episode}',
        example: '/api/anime/20/1/21',
        description: 'Get specific TV episode from AniList',
        parameters: { anilist: 'AniList ID', season: 'Season number', episode: 'Episode number' }
      },
      {
        name: 'Random Anime',
        method: 'GET',
        url: '/api/anime/random',
        example: '/api/anime/random',
        description: 'Returns a random anime entry (anilistId, slug, title) for testing'
      },
      {
        name: 'Cartoons',
        method: 'GET',
        url: '/cartoons',
        example: '/cartoons',
        description: 'List cartoons with assigned custom IDs (after merge)'
      }
    ]
  });
});

// ensure data directory
const DATA_DIR = path.join(__dirname, 'data');
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR); } catch(e) {}
const CARTOON_FILE = path.join(DATA_DIR, 'cartoons.json');

// Complete Anime database with Anilist mappings
const animeDatabase = [
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

// Persistence file for the merged anime DB
const ANIME_DB_FILE = path.join(DATA_DIR, 'anime_db.json');

function loadJsonSafe(filePath, fallback = null) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return fallback; }
}

function saveJsonSafe(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return true; } catch (e) { console.error('save error', e.message); return false; }
}

// HTML error templates with gradient text (same as before)
const errorHtmlTemplate = (title, message, type) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .error-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .error-title {
            background: linear-gradient(45deg, #ff6b6b, #ffa726, #ff6b6b);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 15px;
            animation: gradientShift 3s ease infinite;
        }
        
        .error-message {
            color: #b0b0b0;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .error-details {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #ff6b6b;
        }
        
        .suggestion {
            color: #888;
            font-size: 0.9rem;
            margin-top: 10px;
        }
        
        .home-button {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .home-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon pulse">${type === 'anime' ? '🎬' : '📺'}</div>
        <h1 class="error-title">${title}</h1>
        <p class="error-message">${message}</p>
        
        ${type === 'anime' ? `
        <div class="error-details">
            <strong>Possible reasons:</strong>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>The anime might not be available in our database yet</li>
                <li>There might be a spelling error in the anime title</li>
                <li>The anime might be under maintenance</li>
            </ul>
        </div>
        <p class="suggestion">Try checking the spelling or browse our available anime collection.</p>
        ` : `
        <div class="error-details">
            <strong>Possible reasons:</strong>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>The episode might not have been released yet</li>
                <li>There might be a temporary server issue</li>
                <li>The episode number might be incorrect</li>
            </ul>
        </div>
        <p class="suggestion">Try checking the episode number or wait for the release.</p>
        `}
        
        <a href="/" class="home-button">Back to Home</a>
    </div>
</body>
</html>
`;

// Function to fetch from toonstream.love
async function fetchFromToonstream(animeSlug, season, episodeNum) {
    try {
        // Construct URL for toonstream.love
        const url = `https://toonstream.love/anime/${animeSlug}/season-${season}/episode-${episodeNum}`;
        
        console.log('Fetching from Toonstream:', url);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://toonstream.love/',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Extract video sources from toonstream.love
        const videoSources = [];
        
        // Look for direct video elements
        $('video source').each((i, el) => {
            const src = $(el).attr('src');
            const type = $(el).attr('type');
            if (src) {
                videoSources.push({
                    quality: $(el).attr('data-quality') || 'auto',
                    url: src.startsWith('http') ? src : new URL(src, url).href,
                    type: type || 'video/mp4'
                });
            }
        });

        // Look for iframe embeds
        const iframeSources = [];
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                iframeSources.push({
                    name: `Toonstream Server ${i + 1}`,
                    iframe_url: src,
                    type: 'embed'
                });
            }
        });

        // Extract from scripts
        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent) {
                // Look for video URLs in scripts
                const videoRegex = /(https?:\/\/[^\s"']+\.(mp4|m3u8|webm)[^\s"']*)/gi;
                const matches = scriptContent.match(videoRegex);
                if (matches) {
                    matches.forEach(match => {
                        videoSources.push({
                            quality: 'auto',
                            url: match,
                            type: match.includes('.m3u8') ? 'hls' : 'direct'
                        });
                    });
                }
            }
        });

        return {
            success: true,
            sources: {
                direct: videoSources,
                embeds: iframeSources,
                primary_url: videoSources[0]?.url || iframeSources[0]?.iframe_url
            },
            source: 'toonstream'
        };
    } catch (error) {
        console.error('Toonstream fetch error:', error.message);
        return {
            success: false,
            error: error.message,
            source: 'toonstream'
        };
    }
}

// Function to fetch from animeworld (your existing source)
async function fetchFromAnimeWorld(animeSlug, season, episodeNum) {
    try {
        const url = `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episodeNum}/`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://watchanimeworld.in/',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Extract episode details
        const title = $('h1.entry-title').first().text().trim() || `Episode ${episodeNum}`;
        const description = $('div.entry-content p').first().text().trim() || '';
        const thumbnail = $('div.post-thumbnail img').attr('src') || '';

        // Extract embed servers
        const embedServers = [];
        const iframePromises = [];

        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                iframePromises.push(
                    extractVideoUrls(src).then(videoSources => {
                        embedServers.push({
                            name: `Server ${i + 1}`,
                            iframe_url: src,
                            video_sources: videoSources,
                            type: detectServerType(src)
                        });
                    })
                );
            }
        });

        await Promise.all(iframePromises);

        // Alternative: check for direct video sources
        if (embedServers.length === 0) {
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (scriptContent) {
                    const mp4Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/gi);
                    if (mp4Matches) {
                        mp4Matches.forEach((url, index) => {
                            embedServers.push({
                                name: `Direct MP4 ${index + 1}`,
                                iframe_url: url,
                                video_sources: [{ quality: 'direct', url }],
                                type: 'direct'
                            });
                        });
                    }
                }
            });
        }

        return {
            success: embedServers.length > 0,
            data: {
                title,
                description,
                thumbnail,
                servers: embedServers,
                primary_url: embedServers[0]?.iframe_url || (embedServers[0]?.video_sources && embedServers[0]?.video_sources[0]?.url)
            },
            source: 'animeworld'
        };
    } catch (error) {
        console.error('AnimeWorld fetch error:', error.message);
        return {
            success: false,
            error: error.message,
            source: 'animeworld'
        };
    }
}

// Helper function to find anime by Anilist ID
function findAnimeByAnilistId(anilistId) {
    return animeDatabase.find(anime => anime.anilistId === parseInt(anilistId));
}

// Helper function to find anime by slug
function findAnimeBySlug(slug) {
    return animeDatabase.find(anime => anime.slug === slug);
}

// Main anime endpoint with multiple sources
app.get('/api/anime/:anilistId/:season/:episodeNum', async (req, res) => {
    const { anilistId, season, episodeNum } = req.params;
    const wantJson = req.query.json === '1' || (req.headers.accept && req.headers.accept.includes('application/json'));

    try {
        // Find anime by Anilist ID
        const anime = findAnimeByAnilistId(anilistId);
        
        if (!anime) {
            if (wantJson) {
                return res.status(404).json({ 
                    error: 'Anime not found in database',
                    message: 'The requested anime is not available in our database'
                });
            }
            return res.send(errorHtmlTemplate(
                'Anime Not Found',
                'The anime you are looking for is not available in our database.',
                'anime'
            ));
        }

        const animeSlug = anime.slug;

        // Try multiple sources in sequence
        const sources = [
            () => fetchFromAnimeWorld(animeSlug, season, episodeNum),
            () => fetchFromToonstream(animeSlug, season, episodeNum)
        ];

        let result = null;
        let successfulSource = null;

        for (const sourceFetch of sources) {
            try {
                const sourceResult = await sourceFetch();
                if (sourceResult.success) {
                    result = sourceResult;
                    successfulSource = sourceResult.source;
                    console.log(`✅ Successfully fetched from ${successfulSource}`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Failed from ${sourceFetch.name || 'source'}:`, error.message);
                continue;
            }
        }

        if (!result || !result.success) {
            if (wantJson) {
                return res.status(404).json({ 
                    error: 'Episode not found',
                    message: 'The requested episode might not be available yet'
                });
            }
            return res.send(errorHtmlTemplate(
                'Episode Not Available',
                'This episode is not available in our database yet.',
                'episode'
            ));
        }

        // Construct response payload
        const payload = {
            anilist_id: parseInt(anilistId),
            anime_slug: animeSlug,
            title: anime.normalizedTitle,
            season: parseInt(season),
            episode: parseInt(episodeNum),
            source: successfulSource,
            ...result.data
        };

        // Return HTML iframe or JSON based on request
        if (!wantJson && payload.primary_url) {
            const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${anime.normalizedTitle} - S${season}E${episodeNum}</title>
<style>html,body{height:100%;margin:0;background:#000}iframe{position:fixed;inset:0;border:0;width:100%;height:100%}</style>
</head><body>
<iframe src="${payload.primary_url}" allowfullscreen allow="autoplay; fullscreen"></iframe>
</body></html>`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }

        return res.json(payload);

    } catch (err) {
        console.error('Error fetching episode:', err.message);
        
        if (wantJson) {
            return res.status(500).json({ 
                error: 'Failed to fetch episode details',
                details: err.message 
            });
        }
        
        return res.send(errorHtmlTemplate(
            'Server Error',
            'An unexpected error occurred while fetching the episode.',
            'episode'
        ));
    }
});

// Your existing extractor functions remain the same...
async function extractVideoUrls(iframeUrl) {
    try {
        console.log('Extracting from:', iframeUrl);
        
        if (iframeUrl.includes('streamtape')) {
            return await extractStreamtape(iframeUrl);
        } else if (iframeUrl.includes('dood')) {
            return await extractDoodstream(iframeUrl);
        } else if (iframeUrl.includes('filemoon') || iframeUrl.includes('moon')) {
            return await extractFilemoon(iframeUrl);
        } else if (iframeUrl.includes('mp4upload')) {
            return await extractMp4Upload(iframeUrl);
        } else if (iframeUrl.includes('vidstream')) {
            return await extractVidstream(iframeUrl);
        } else {
            const response = await axios.get(iframeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://watchanimeworld.in/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            const $ = cheerio.load(response.data);
            const videoSources = [];
            
            $('source').each((i, el) => {
                const src = $(el).attr('src');
                if (src && (src.includes('.mp4') || src.includes('.m3u8'))) {
                    videoSources.push({
                        quality: $(el).attr('size') || 'unknown',
                        url: src.startsWith('http') ? src : new URL(src, iframeUrl).href
                    });
                }
            });
            
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (scriptContent) {
                    const mp4Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/gi);
                    if (mp4Matches) {
                        mp4Matches.forEach(url => {
                            videoSources.push({ quality: 'auto', url });
                        });
                    }
                    
                    const m3u8Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/gi);
                    if (m3u8Matches) {
                        m3u8Matches.forEach(url => {
                            videoSources.push({ quality: 'hls', url });
                        });
                    }
                    
                    if (scriptContent.includes('file:')) {
                        const fileMatch = scriptContent.match(/file:\s*["']([^"']+)["']/);
                        if (fileMatch) {
                            videoSources.push({ quality: 'jwplayer', url: fileMatch[1] });
                        }
                    }
                }
            });
            
            return videoSources.length > 0 ? videoSources : [{ quality: 'direct', url: iframeUrl }];
        }
    } catch (error) {
        console.error('Error extracting video URLs:', error.message);
        return [{ quality: 'fallback', url: iframeUrl }];
    }
}

// Your existing platform-specific extractors remain the same...
async function extractStreamtape(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("ideoo")').html();
        
        if (scriptContent) {
            const match = scriptContent.match(/document\.getElementById\(['"]?ideoo['"]?\)\.innerHTML\s*=\s*['"]([^'"]+)['"]/);
            if (match) {
                const encodedUrl = match[1].replace(/\\/g, '');
                const videoUrl = `https:${encodedUrl}`;
                return [{ quality: 'streamtape', url: videoUrl }];
            }
        }
    } catch (error) {
        console.error('Streamtape extraction error:', error);
    }
    return [{ quality: 'streamtape', url }];
}

async function extractDoodstream(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("pass_md5")').html();
        
        if (scriptContent) {
            const passMd5Match = scriptContent.match(/pass_md5\s*=\s*['"]([^'"]+)['"]/);
            const tokenMatch = scriptContent.match(/\?token=([^'"]+)/);
            
            if (passMd5Match && tokenMatch) {
                const videoUrl = `https://dood.pm/e/${passMd5Match[1]}${tokenMatch[0]}`;
                return [{ quality: 'doodstream', url: videoUrl }];
            }
        }
    } catch (error) {
        console.error('Doodstream extraction error:', error);
    }
    return [{ quality: 'doodstream', url }];
}

async function extractFilemoon(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("sources")').html();
        
        if (scriptContent) {
            const sourceMatch = scriptContent.match(/sources:\s*\[{\s*file:\s*['"]([^'"]+)['"]/);
            if (sourceMatch) {
                return [{ quality: 'filemoon', url: sourceMatch[1] }];
            }
        }
    } catch (error) {
        console.error('Filemoon extraction error:', error);
    }
    return [{ quality: 'filemoon', url }];
}

async function extractMp4Upload(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("src")').html();
        
        if (scriptContent) {
            const srcMatch = scriptContent.match(/src:\s*['"]([^'"]+)['"]/);
            if (srcMatch) {
                return [{ quality: 'mp4upload', url: srcMatch[1] }];
            }
        }
    } catch (error) {
        console.error('Mp4Upload extraction error:', error);
    }
    return [{ quality: 'mp4upload', url }];
}

async function extractVidstream(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("sources")').html();
        
        if (scriptContent) {
            const sourcesMatch = scriptContent.match(/sources:\s*\[([^\]]+)\]/);
            if (sourcesMatch) {
                const urlMatch = sourcesMatch[1].match(/file:\s*['"]([^'"]+)['"]/);
                if (urlMatch) {
                    return [{ quality: 'vidstream', url: urlMatch[1] }];
                }
            }
        }
    } catch (error) {
        console.error('Vidstream extraction error:', error);
    }
    return [{ quality: 'vidstream', url }];
}

function detectServerType(url) {
    if (url.includes('streamtape')) return 'streamtape';
    if (url.includes('dood')) return 'doodstream';
    if (url.includes('filemoon')) return 'filemoon';
    if (url.includes('mp4upload')) return 'mp4upload';
    if (url.includes('vidstream')) return 'vidstream';
    if (url.includes('.mp4')) return 'direct';
    if (url.includes('.m3u8')) return 'hls';
    return 'embed';
}

// Your existing endpoints remain the same...
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const searchTerm = query.toLowerCase();
        const results = animeDatabase.filter(anime => 
            anime.slug.toLowerCase().includes(searchTerm) ||
            anime.normalizedTitle.toLowerCase().includes(searchTerm)
        ).map(anime => ({
            slug: anime.slug,
            anilistId: anime.anilistId,
            title: anime.normalizedTitle
        }));

        res.json({
            query,
            results,
            total: results.length
        });
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/api/extract', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const videoSources = await extractVideoUrls(url);
        res.json({
            source_url: url,
            video_sources: videoSources,
            total_sources: videoSources.length
        });
    } catch (err) {
        console.error('Extraction error:', err.message);
        res.status(500).json({ error: 'Failed to extract video URLs' });
    }
});

// Your existing server setup remains the same...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Anime API server running on port ${PORT}`);
    console.log(`📺 Total anime in database: ${animeDatabase.length}`);
    console.log(`🚀 Endpoints:`);
    console.log(`   GET /api/anime/:anilistId/:season/:episodeNum`);
    console.log(`   GET /api/extract?url=EMBED_URL`);
    console.log(`   GET /api/search?query=name`);
    console.log(`   GET /health`);
});

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now(), animeCount: animeDatabase.length });
});

app.get('/api/anime/random', (req, res) => {
  const persisted = loadJsonSafe(ANIME_DB_FILE, null);
  const source = Array.isArray(persisted) ? persisted : (persisted && persisted.items) ? persisted.items : animeDatabase;
  if (!Array.isArray(source) || source.length === 0) return res.status(500).json({ error: 'no anime available' });

  const candidates = source.filter(item => item && item.anilistId != null);
  if (!Array.isArray(candidates) || candidates.length === 0) return res.status(500).json({ error: 'no anime with anilistId available' });

  const idx = Math.floor(Math.random() * candidates.length);
  const a = candidates[idx];
  res.json({ anilistId: a.anilistId, slug: a.slug, title: a.normalizedTitle || a.slug });
});

app.get('/api/anime/auto/:title/:season/:episode', (req, res) => {
  const raw = req.params.title || '';
  const title = decodeURIComponent(raw).toLowerCase();
  const found = animeDatabase.find(a => ((a.normalizedTitle || '')).toLowerCase() === title || (a.slug || '').toLowerCase() === title);
  if (!found || !found.anilistId) return res.status(404).json({ error: 'not found' });
  return res.redirect(`/api/anime/${found.anilistId}/${req.params.season}/${req.params.episode}`);
});
