import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio'; // FIXED LINE
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Your anime data including the new one
const ANIME_DATA = {
  "metadata": {
    "totalAnime": 392,
    "crawledAt": "2025-10-20T17:50:56.632590Z",
    "source": "watchanimeworld.in",
    "totalPagesCrawled": 79
  },
  "data": [
    {
      "id": "03ef758df7a2e97a73acf059144a842c",
      "title": "Classroom of the Elite",
      "image": "https://image.tmdb.org/t/p/w500/yuHanbUUIv2UWRxxQFt9n8jtmOJ.jpg",
      "url": "https://watchanimeworld.in/series/classroom-of-the-elite/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.346719Z"
    },
    {
      "id": "a1e7a2b4aac93a9721540fb299f8274f",
      "title": "Naruto Shippuden",
      "image": "https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg",
      "url": "https://watchanimeworld.in/series/naruto-shippuden/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.346954Z"
    },
    {
      "id": "8ebd5598c7e19e8f8f97c6e32f21d1ab",
      "title": "Ranma ½ (2024)",
      "image": "https://image.tmdb.org/t/p/w500/zQhwc27CWHM4zx9lJU9bI5FRQOm.jpg",
      "url": "https://watchanimeworld.in/series/ranma-%c2%bd-2024/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347089Z"
    },
    {
      "id": "5e23da53c5f142a276e97382769a7a81",
      "title": "A Wild Last Boss Appeared!",
      "image": "https://image.tmdb.org/t/p/w500/9dhoMwDpkJm5dsSIiHMPl7or76t.jpg",
      "url": "https://watchanimeworld.in/series/a-wild-last-boss-appeared/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347194Z"
    },
    {
      "id": "e0795a435d04ffa195cfd2226dd72466",
      "title": "Let This Grieving Soul Retire",
      "image": "https://image.tmdb.org/t/p/w500/egViTAdBqUyUFI2sIBsGbnH5Sun.jpg",
      "url": "https://watchanimeworld.in/series/let-this-grieving-soul-retire/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347313Z"
    },
    {
      "id": "26a5ea5e245ba248075f9ef104a9aedb",
      "title": "Food Wars! Shokugeki no Soma",
      "image": "https://image.tmdb.org/t/p/w500/drteIrKPh0qaTYitGkxAOKoidsR.jpg",
      "url": "https://watchanimeworld.in/series/food-wars-shokugeki-no-soma/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347551Z"
    },
    {
      "id": "66d707d76567f57711ebbc54100753fd",
      "title": "Takopi's Original Sin",
      "image": "https://image.tmdb.org/t/p/w500/xPXDVhVKt0XM34ihoUVMHtLYTw8.jpg",
      "url": "https://watchanimeworld.in/series/takopis-original-sin/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347784Z"
    },
    {
      "id": "9959a511d9a53712354c1e1c632a51b1",
      "title": "I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability",
      "image": "https://image.tmdb.org/t/p/w500/kMDJ2hdBTLZn33O53xCtE14fFD1.jpg",
      "url": "https://watchanimeworld.in/series/i-was-reincarnated-as-the-7th-prince-so-i-can-take-my-time-perfecting-my-magical-ability/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.347937Z"
    },
    {
      "id": "84f62ba4b744f1d5e30998d93fce6527",
      "title": "YAIBA: Samurai Legend",
      "image": "https://image.tmdb.org/t/p/w500/cxD3FQP4hDU5hSABwdQCvGrrnz6.jpg",
      "url": "https://watchanimeworld.in/series/yaiba-samurai-legend/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.348123Z"
    },
    {
      "id": "671c3b79f9b476dbf9386e29f0a5f52f",
      "title": "May I Ask for One Final Thing?",
      "image": "https://image.tmdb.org/t/p/w500/u5kCaEFoDX30k68RwP4F6bsYQbb.jpg",
      "url": "https://watchanimeworld.in/series/may-i-ask-for-one-final-thing/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.348295Z"
    },
    {
      "id": "8c5c89868245d9d0728ee4b75f748848",
      "title": "Splinter Cell: Deathwatch",
      "image": "https://image.tmdb.org/t/p/w500/tgKYnJlze79IUKkPmtsW2nSUeeB.jpg",
      "url": "https://watchanimeworld.in/series/splinter-cell-deathwatch/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.348498Z"
    },
    {
      "id": "532a3686ac1b9d98f369c662eb54494d",
      "title": "Heroines Run the Show",
      "image": "https://image.tmdb.org/t/p/w500/A5OlJA472GSc2S05bzAMaTw1o9w.jpg",
      "url": "https://watchanimeworld.in/series/heroines-run-the-show/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.348660Z"
    },
    {
      "id": "7d6324daefa8358c040c167a585544b9",
      "title": "Death Note",
      "image": "https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg",
      "url": "https://watchanimeworld.in/series/death-note/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.348814Z"
    },
    {
      "id": "e446b31793b3a39ab4b1de34f2d2027f",
      "title": "A Couple of Cuckoos",
      "image": "https://image.tmdb.org/t/p/w500/gV9XAk7xrZaB2eTjroQNn1VhdBI.jpg",
      "url": "https://watchanimeworld.in/series/a-couple-of-cuckoos/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349014Z"
    },
    {
      "id": "998f3bbb1b43551854c17dc14be2de7b",
      "title": "My Status as an Assassin Obviously Exceeds the Hero's",
      "image": "https://image.tmdb.org/t/p/w500/oQk3aXYEa4TMd9rAYgzDpAYTU8P.jpg",
      "url": "https://watchanimeworld.in/series/my-status-as-an-assassin-obviously-exceeds-the-heros/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349305Z"
    },
    {
      "id": "cb675a58b23a2bfc3468f7005ffc4d1f",
      "title": "Toilet-Bound Hanako-kun",
      "image": "https://image.tmdb.org/t/p/w500/iehq6tSUylg5kFkOxndNYZWjzNu.jpg",
      "url": "https://watchanimeworld.in/series/toilet-bound-hanako-kun/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349518Z"
    },
    {
      "id": "adf4003d7fc35b90adf14cf706a53cd0",
      "title": "My Dress-Up Darling",
      "image": "https://image.tmdb.org/t/p/w500/A6mxBwvvv63JXZm3xXKv4SugE0L.jpg",
      "url": "https://watchanimeworld.in/series/my-dress-up-darling/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349646Z"
    },
    {
      "id": "5c34334e4e4a31dedc8acabb428160ad",
      "title": "Girls' Frontline",
      "image": "https://image.tmdb.org/t/p/w500/hG7qq8ed3c3CdbybiFRU97O6l5u.jpg",
      "url": "https://watchanimeworld.in/series/girls-frontline/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349755Z"
    },
    {
      "id": "0d934b7d4bddf2f6793c3af009734332",
      "title": "Dekin no Mogura: The Earthbound Mole",
      "image": "https://image.tmdb.org/t/p/w500/xnEForFiNATvYS4MUwYyFuPyiok.jpg",
      "url": "https://watchanimeworld.in/series/dekin-no-mogura-the-earthbound-mole/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.349863Z"
    },
    {
      "id": "2449b41fb3fe649a85959a75acac7639",
      "title": "Robotics;Notes",
      "image": "https://image.tmdb.org/t/p/w500/gYqNzVZlueK8FoGlAmz8h3k9XMC.jpg",
      "url": "https://watchanimeworld.in/series/roboticsnotes/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.350711Z"
    },
    {
      "id": "90ca7b4bc8168b9bbbb6ffd200de273e",
      "title": "I Left My A-Rank Party to Help My Former Students Reach the Dungeon Depths!",
      "image": "https://image.tmdb.org/t/p/w500/XAKKKNkKjVPgV2LTCLLXNvMdWI.jpg",
      "url": "https://watchanimeworld.in/series/i-left-my-a-rank-party-to-help-my-former-students-reach-the-dungeon-depths/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.350815Z"
    },
    {
      "id": "94593d1c9a496eda3214829d5d90bdec",
      "title": "After School Dice Club",
      "image": "https://image.tmdb.org/t/p/w500/2i8kS6Lyy3PX6bkQWPhKwMx0xvX.jpg",
      "url": "https://watchanimeworld.in/series/after-school-dice-club/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.350915Z"
    },
    {
      "id": "eaed229140328bbb30f56a83ede773f8",
      "title": "Ghost in the Shell: Arise",
      "image": "https://image.tmdb.org/t/p/w500/zaN0EZ4f1b2jCtDj7mpVhPH9C9K.jpg",
      "url": "https://watchanimeworld.in/series/ghost-in-the-shell-arise/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351011Z"
    },
    {
      "id": "87ff072d7ddbc90e7bb1923ee42cb1af",
      "title": "Shoot! Goal to the Future",
      "image": "https://image.tmdb.org/t/p/w500/3jMImKHLU9zoB2K2hDEe6fu1Emn.jpg",
      "url": "https://watchanimeworld.in/series/shoot-goal-to-the-future/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351113Z"
    },
    {
      "id": "d0f9dbe8e83d20351c1b825cece8447f",
      "title": "Pokémon Concierge",
      "image": "https://image.tmdb.org/t/p/w500/2LnImoYwynnbqrXBiRzdxEUspo8.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-concierge/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351304Z"
    },
    {
      "id": "465430ef6af1d5878e7bf7c4915c18fc",
      "title": "I've Been Killing Slimes for 300 Years and Maxed Out My Level",
      "image": "https://image.tmdb.org/t/p/w500/iyTiJqrAs2YItyTYGI18PdqX65c.jpg",
      "url": "https://watchanimeworld.in/series/ive-been-killing-slimes-for-300-years-and-maxed-out-my-level/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351497Z"
    },
    {
      "id": "5fe72b2cf7814fcdda354b43e45282bd",
      "title": "Baki Hanma",
      "image": "https://image.tmdb.org/t/p/w500/x145FSI9xJ6UbkxfabUsY2SFbu3.jpg",
      "url": "https://watchanimeworld.in/series/baki-hanma/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351596Z"
    },
    {
      "id": "b33d9ed914ecea3b834610831199f583",
      "title": "Murder Drones",
      "image": "https://image.tmdb.org/t/p/w500/wXwiNeXa4lY7AWb72XdAdnIK9lC.jpg",
      "url": "https://watchanimeworld.in/series/murder-drones/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351886Z"
    },
    {
      "id": "f10df4f6f5217e6461e1e4234d7103d8",
      "title": "Devil May Cry",
      "image": "https://image.tmdb.org/t/p/w500/syY5tQzZDdiwGx71cj1Zz4rtrDL.jpg",
      "url": "https://watchanimeworld.in/series/devil-may-cry/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.351993Z"
    },
    {
      "id": "aa222b6511de231e893a13075cf3f23d",
      "title": "Oddballs",
      "image": "https://image.tmdb.org/t/p/w500/cCJ60PDEXgavJ1vxWAjW1PMuZd6.jpg",
      "url": "https://watchanimeworld.in/series/oddballs/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352090Z"
    },
    {
      "id": "a62aa321a7cc492193d6afe063799270",
      "title": "Wolf King",
      "image": "https://image.tmdb.org/t/p/w500/jgs2AtxtOMRuVHYjSofbv3P9WnN.jpg",
      "url": "https://watchanimeworld.in/series/wolf-king/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352187Z"
    },
    {
      "id": "8a7388c871f6d75c8ff1d9421cdbfdee",
      "title": "Mighty Monsterwheelies",
      "image": "https://image.tmdb.org/t/p/w500/16aRqo4WLrCXngc8NJH5ria0UeN.jpg",
      "url": "https://watchanimeworld.in/series/mighty-monsterwheelies/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352288Z"
    },
    {
      "id": "847116a75807e31d2d91a9c15581edac",
      "title": "BLUE EYE SAMURAI",
      "image": "https://image.tmdb.org/t/p/w500/fXm3JT4WLQVnwukdvghtAblc1wc.jpg",
      "url": "https://watchanimeworld.in/series/blue-eye-samurai/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352382Z"
    },
    {
      "id": "f0ce4904014dbc9f80c0941f32a736a9",
      "title": "Agent Elvis",
      "image": "https://image.tmdb.org/t/p/w500/12Tdb1rbxZ0DQBkXu3weTb8UtnD.jpg",
      "url": "https://watchanimeworld.in/series/agent-elvis/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352479Z"
    },
    {
      "id": "d7368ad36065ee702cb89ae5749b7a95",
      "title": "Angry Birds: Summer Madness",
      "image": "https://image.tmdb.org/t/p/w500/6ko4jfA5BrcRADDaAfMagZ4ZGpG.jpg",
      "url": "https://watchanimeworld.in/series/angry-birds-summer-madness/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352593Z"
    },
    {
      "id": "301a5c5cb2a4620a62f9443f52d1e6fd",
      "title": "Sonic Prime",
      "image": "https://image.tmdb.org/t/p/w500/mlDVnjgx89bmGvtXnKYDbowpadV.jpg",
      "url": "https://watchanimeworld.in/series/sonic-prime/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352693Z"
    },
    {
      "id": "be4be1aa582a493c409c56401dc5a985",
      "title": "Farzar",
      "image": "https://image.tmdb.org/t/p/w500/h89bKlWrHcFSBGXsNNi1ArnUPHf.jpg",
      "url": "https://watchanimeworld.in/series/farzar/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352791Z"
    },
    {
      "id": "ed83bf3b34f1b4834c0ced4eac70a197",
      "title": "Tomb Raider: The Legend of Lara Croft",
      "image": "https://image.tmdb.org/t/p/w500/1WF982MFHGmsURH13HMQP51Dgr3.jpg",
      "url": "https://watchanimeworld.in/series/tomb-raider-the-legend-of-lara-croft/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352893Z"
    },
    {
      "id": "ed5c04cb6539d275c70904607237d19c",
      "title": "Super Giant Robot Brothers!",
      "image": "https://image.tmdb.org/t/p/w500/1ysuYGkRtZgaP4mL9nbRmCU3vMd.jpg",
      "url": "https://watchanimeworld.in/series/super-giant-robot-brothers/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.352988Z"
    },
    {
      "id": "474b8f6307a5283153c6ac6c59e9b24c",
      "title": "Secret Level",
      "image": "https://image.tmdb.org/t/p/w500/tXMi6tb1owDAALnFFqnWjjd26if.jpg",
      "url": "https://watchanimeworld.in/series/secret-level/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353083Z"
    },
    {
      "id": "38a8139cd8f4b9433cf16495eb1582eb",
      "title": "Scott Pilgrim Takes Off",
      "image": "https://image.tmdb.org/t/p/w500/nHROk2C6bv8LqtvyYd0tCMURbxC.jpg",
      "url": "https://watchanimeworld.in/series/scott-pilgrim-takes-off/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353182Z"
    },
    {
      "id": "6f5e72fb45de9721f07c3994a5c7366d",
      "title": "Sausage Party: Foodtopia",
      "image": "https://image.tmdb.org/t/p/w500/wikdL6IcHjSJSbUv4iYTCwJn8.jpg",
      "url": "https://watchanimeworld.in/series/sausage-party-foodtopia/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353284Z"
    },
    {
      "id": "510ef964d60c00bae00e3bf69110236e",
      "title": "Jurassic World: Chaos Theory",
      "image": "https://image.tmdb.org/t/p/w500/c2Od0cY2IeayDj5osUxZSAD1QK.jpg",
      "url": "https://watchanimeworld.in/series/jurassic-world-chaos-theory/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353381Z"
    },
    {
      "id": "3bc969309ef3083cae27fbd1fb3a384d",
      "title": "Maya and the Three",
      "image": "https://image.tmdb.org/t/p/w500/zUBixNeHU0cbSUH7JMktl9OMEMV.jpg",
      "url": "https://watchanimeworld.in/series/maya-and-the-three/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353489Z"
    },
    {
      "id": "5a6c7d1fc11fe16eb3088dc8a00dee67",
      "title": "Hazbin Hotel",
      "image": "https://image.tmdb.org/t/p/w500/rXojaQcxVUubPLSrFV8PD4xdjrs.jpg",
      "url": "https://watchanimeworld.in/series/hazbin-hotel/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353591Z"
    },
    {
      "id": "37702fe4dfc996713cdc7685ad2c3246",
      "title": "Chainsaw Man the Movie: Reze Arc",
      "image": "https://image.tmdb.org/t/p/w500/xdzLBZjCVSEsic7m7nJc4jNJZVW.jpg",
      "url": "https://watchanimeworld.in/movies/chainsaw-man-the-movie-reze-arc/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353691Z"
    },
    {
      "id": "5272fdac82905a4aeda4deffea5bb9cb",
      "title": "HAIKYU!! The Dumpster Battle",
      "image": "https://image.tmdb.org/t/p/w500/ntRU0OA4etGGiMMmH1Yw0bnaMdW.jpg",
      "url": "https://watchanimeworld.in/movies/haikyu-the-dumpster-battle/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353797Z"
    },
    {
      "id": "9cb65a5719f9fe850d81a15f4047a9a6",
      "title": "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
      "image": "https://image.tmdb.org/t/p/w500/aFRDH3P7TX61FVGpaLhKr6QiOC1.jpg",
      "url": "https://watchanimeworld.in/movies/demon-slayer-kimetsu-no-yaiba-infinity-castle/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353893Z"
    },
    {
      "id": "7c1d56cc4aa0109bfbd44f9b26e769a8",
      "title": "Mononoke the Movie: Chapter II - The Ashes of Rage",
      "image": "https://image.tmdb.org/t/p/w500/tPExtAM958Gx07itJ7nWqSddBQ9.jpg",
      "url": "https://watchanimeworld.in/movies/mononoke-the-movie-chapter-ii-the-ashes-of-rage/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.353991Z"
    },
    {
      "id": "009fc0b939a5296c6ecdb9758d782392",
      "title": "Lost in Starlight",
      "image": "https://image.tmdb.org/t/p/w500/6RDXvT0C9Mvm5FNHGThn4iP8xKH.jpg",
      "url": "https://watchanimeworld.in/movies/lost-in-starlight/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354094Z"
    },
    {
      "id": "fc449501d8a8913917cfc3f704bdea55",
      "title": "Mononoke the Movie: The Phantom in the Rain",
      "image": "https://image.tmdb.org/t/p/w500/xE06xrZkIipJMPSgWoeelohxi9h.jpg",
      "url": "https://watchanimeworld.in/movies/mononoke-the-movie-the-phantom-in-the-rain/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354194Z"
    },
    {
      "id": "9ec64ff34d350d808c036c0d9e3275a2",
      "title": "Spy x Family Movie: Code: White",
      "image": "https://image.tmdb.org/t/p/w500/riv537dUuKib4KXC6Rg7CINs4xO.jpg",
      "url": "https://watchanimeworld.in/movies/spy-x-family-movie-code-white/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354290Z"
    },
    {
      "id": "0b8d89848bab865cebfa6c0ca59401cc",
      "title": "Look Back",
      "image": "https://image.tmdb.org/t/p/w500/AgBNLcHFEXCRFZuKv0H8RWMxNAJ.jpg",
      "url": "https://watchanimeworld.in/movies/look-back/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354391Z"
    },
    {
      "id": "45cb94385f423a300da8eca2f76b161e",
      "title": "Dragon Ball Z: Battle of Gods",
      "image": "https://image.tmdb.org/t/p/w500/nxZEdYcHMuD8SSuwusDnK9CD2H1.jpg",
      "url": "https://watchanimeworld.in/movies/dragon-ball-z-battle-of-gods/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354486Z"
    },
    {
      "id": "ce7baaf5b176f9523adf8a719e0e46ee",
      "title": "Shinchan The Movie: Mr. Smelly's Ambition",
      "image": "https://watchanimeworld.in/files/Poster/M957.webp",
      "url": "https://watchanimeworld.in/movies/shinchan-the-movie-mr-smellys-ambition/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354596Z"
    },
    {
      "id": "ee15e376c04d800f18746d994db3fa40",
      "title": "Baki Hanma VS Kengan Ashura",
      "image": "https://image.tmdb.org/t/p/w500/etbHJxil0wHvYOCmibzFLsMcl2C.jpg",
      "url": "https://watchanimeworld.in/movies/baki-hanma-vs-kengan-ashura/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354701Z"
    },
    {
      "id": "52a8d51099a44d98845085c67aaca2db",
      "title": "Pokémon Heroes",
      "image": "https://image.tmdb.org/t/p/w500/qHcZJ3MkTay6XCzgb8BPy22qHPR.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-heroes/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354800Z"
    },
    {
      "id": "d2fac25c13938fe3d34ee8fb8b52f24e",
      "title": "Dragon Ball Super: Super Hero",
      "image": "https://image.tmdb.org/t/p/w500/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg",
      "url": "https://watchanimeworld.in/movies/dragon-ball-super-super-hero/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.354900Z"
    },
    {
      "id": "f7d29349160d8f3d4ba343f32a0de9bf",
      "title": "Black Clover: Sword of the Wizard King",
      "image": "https://image.tmdb.org/t/p/w500/9YEGawvjaRgnyW6QVcUhFJPFDco.jpg",
      "url": "https://watchanimeworld.in/movies/black-clover-sword-of-the-wizard-king/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355011Z"
    },
    {
      "id": "cb6a0110b0e429469441cc3ac0c637a4",
      "title": "Pokémon 4Ever",
      "image": "https://image.tmdb.org/t/p/w500/4Vafl9UF5oCiZYOl9q1hh1uZosR.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-4ever/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355110Z"
    },
    {
      "id": "3ca34b194f053c556f290e50fb81445d",
      "title": "Spirited Away",
      "image": "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      "url": "https://watchanimeworld.in/movies/spirited-away/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355210Z"
    },
    {
      "id": "3adc128ba921b1a96ddb182ad9f4de06",
      "title": "My Neighbor Totoro",
      "image": "https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
      "url": "https://watchanimeworld.in/movies/my-neighbor-totoro/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355308Z"
    },
    {
      "id": "74251f4e174439ed35f5142bde6aff6e",
      "title": "Altered Carbon: Resleeved",
      "image": "https://image.tmdb.org/t/p/w500/vlIYzx7cc4Wvaoh7ShjF2HZG45.jpg",
      "url": "https://watchanimeworld.in/movies/altered-carbon-resleeved/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355406Z"
    },
    {
      "id": "1337db3c71a6a73776e0905c9644bb5a",
      "title": "Howl's Moving Castle",
      "image": "https://image.tmdb.org/t/p/w500/6pZgH10jhpToPcf0uvyTCPFhWpI.jpg",
      "url": "https://watchanimeworld.in/movies/howls-moving-castle/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355515Z"
    },
    {
      "id": "1e6c6f81c1a377258ae6501b6cb002eb",
      "title": "The Loud House Movie",
      "image": "https://image.tmdb.org/t/p/w500/mab5wPeGVjbMyYMzyzfdKKnG9cl.jpg",
      "url": "https://watchanimeworld.in/movies/the-loud-house-movie/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355617Z"
    },
    {
      "id": "8d7b52dc39c6e934d0c2d25fe5eb15a8",
      "title": "Ben 10 vs. the Universe: The Movie",
      "image": "https://image.tmdb.org/t/p/w500/34KSOJVowmkeh6G0HZJMxqdHq6s.jpg",
      "url": "https://watchanimeworld.in/movies/ben-10-vs-the-universe-the-movie/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355719Z"
    },
    {
      "id": "b1205b2be83ecd1089fd03b2d2be8552",
      "title": "Transformers Prime: Beast Hunters - Predacons Rising",
      "image": "https://image.tmdb.org/t/p/w500/4T4pQqr2RoVgWQYtIzDGMByktwq.jpg",
      "url": "https://watchanimeworld.in/movies/transformers-prime-beast-hunters-predacons-rising/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355830Z"
    },
    {
      "id": "0a2569f6d130167d10b2741c1c021f3c",
      "title": "The Witcher: Nightmare of the Wolf",
      "image": "https://image.tmdb.org/t/p/w500/3sLz2yv6vBDWqBbd8rdnNeoJ2kJ.jpg",
      "url": "https://watchanimeworld.in/movies/the-witcher-nightmare-of-the-wolf/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.355928Z"
    },
    {
      "id": "5ba54ba1694332335b33b86f5b6016d0",
      "title": "The SpongeBob SquarePants Movie",
      "image": "https://image.tmdb.org/t/p/w500/1rvzKV1d18EbDVaEd4VDzK3cgnY.jpg",
      "url": "https://watchanimeworld.in/movies/the-spongebob-squarepants-movie/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356027Z"
    },
    {
      "id": "f74e7ad46ee11968fb778805748ca09d",
      "title": "Slugterra: Slug Fu Showdown",
      "image": "https://image.tmdb.org/t/p/w500/9IrfRT8stzY3xh9y0SEBraNhm3E.jpg",
      "url": "https://watchanimeworld.in/movies/slugterra-slug-fu-showdown/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356128Z"
    },
    {
      "id": "3ca394fe7254b2d620714ff5e9fb4b7e",
      "title": "SlugTerra: Return of the Elementals",
      "image": "https://image.tmdb.org/t/p/w500/ApN2lteDsoIU5dDHJXeqVD13vpd.jpg",
      "url": "https://watchanimeworld.in/movies/slugterra-return-of-the-elementals/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356226Z"
    },
    {
      "id": "785437a5f4cef249da86ca43805e579e",
      "title": "Slugterra: Into The Shadows",
      "image": "https://image.tmdb.org/t/p/w500/fwcdoV9qBpEorDlCtqO6RFLIXtA.jpg",
      "url": "https://watchanimeworld.in/movies/slugterra-into-the-shadows/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356323Z"
    },
    {
      "id": "2d7330bfb66015867f8ec0c98b613e72",
      "title": "Slugterra: Ghoul from Beyond",
      "image": "https://image.tmdb.org/t/p/w500/jPT77gSUa9yad7ysoB8R9RnuPfa.jpg",
      "url": "https://watchanimeworld.in/movies/slugterra-ghoul-from-beyond/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356425Z"
    },
    {
      "id": "85c5b165dba8b85e053dc78dfe855c7a",
      "title": "Miraculous World: New York United HeroeZ",
      "image": "https://image.tmdb.org/t/p/w500/9YbyvcrHmY2SVbdfXpb8mC4Fy0g.jpg",
      "url": "https://watchanimeworld.in/movies/miraculous-world-new-york-united-heroez/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356526Z"
    },
    {
      "id": "d9b16038a17cb0847e965f048bc7c958",
      "title": "Miraculous World: Shanghai – The Legend of Ladydragon",
      "image": "https://image.tmdb.org/t/p/w500/qQ0VKsGRQ2ofAmswGNzZnvC1xPE.jpg",
      "url": "https://watchanimeworld.in/movies/miraculous-world-shanghai-the-legend-of-ladydragon/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356625Z"
    },
    {
      "id": "8b99fdf0028125d9b8ce2815b1bbd879",
      "title": "Ben 10: Secret of the Omnitrix",
      "image": "https://image.tmdb.org/t/p/w500/vPND6Qff1KVYAtjaQuZtij8wtAj.jpg",
      "url": "https://watchanimeworld.in/movies/ben-10-secret-of-the-omnitrix/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356731Z"
    },
    {
      "id": "4ada6cf870a1ab977cbb89cbf7bd327e",
      "title": "Ben 10: Destroy All Aliens",
      "image": "https://image.tmdb.org/t/p/w500/qoILNllyC6YXHyT4V9YOhMJlPuO.jpg",
      "url": "https://watchanimeworld.in/movies/ben-10-destroy-all-aliens/",
      "sourcePage": "https://watchanimeworld.in/",
      "timestamp": "2025-10-20T17:49:11.356829Z"
    },
    {
      "id": "3e355611192dedc2647bd12a482d13b0",
      "title": "Pokémon Detective Pikachu",
      "image": "https://image.tmdb.org/t/p/w500/uhWvnFgg3BNlcUz0Re1HfQqIcCD.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-detective-pikachu/",
      "sourcePage": "https://watchanimeworld.in/movies/page/2/",
      "timestamp": "2025-10-20T17:49:14.720483Z"
    },
    {
      "id": "251ee090ad4eee8990ff1af42d531e98",
      "title": "Pokémon the Movie: Mewtwo Strikes Back - Evolution",
      "image": "https://image.tmdb.org/t/p/w500/xlO50h3EX1w99KGztTzsjQBwPfs.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-mewtwo-strikes-back-evolution/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.952126Z"
    },
    {
      "id": "47dfb196458d2b9ab837b2faf7b7c013",
      "title": "Pokémon: Zoroark - Master of Illusions",
      "image": "https://image.tmdb.org/t/p/w500/tWgH64RZmm2rIHtO2DNnfN3DZa8.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-zoroark-master-of-illusions/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.952338Z"
    },
    {
      "id": "e780432a240f45c6fb397bb6e5dcc554",
      "title": "Pokémon 3: The Movie",
      "image": "https://image.tmdb.org/t/p/w500/g2C95ubS56O1ITXy1MgC69kAwF0.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-3-the-movie/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.952536Z"
    },
    {
      "id": "335aa8615130e37993c0c12caca7e48c",
      "title": "Pokémon the Movie: Volcanion and the Mechanical Marvel",
      "image": "https://image.tmdb.org/t/p/w500/j9TIzeMxNknVrBvgxzLqhIhxml4.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-volcanion-and-the-mechanical-marvel/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.952742Z"
    },
    {
      "id": "a04f73d282b3003e17181bc1d97b5d04",
      "title": "Pokémon the Movie: The Power of Us",
      "image": "https://image.tmdb.org/t/p/w500/kprIwOzdYLsjqkRyzD69SkFyv70.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-the-power-of-us/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.952931Z"
    },
    {
      "id": "a2481893e03f0431ba6a0e9a5a36e9b1",
      "title": "Pokémon Ranger and the Temple of the Sea",
      "image": "https://image.tmdb.org/t/p/w500/fj9aVJP9bZGkB7NResSauAAImr0.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-ranger-and-the-temple-of-the-sea/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.953114Z"
    },
    {
      "id": "2dadb9bbea7d3d1a4b77c8a1627984f5",
      "title": "Pokémon the Movie: Secrets of the Jungle",
      "image": "https://image.tmdb.org/t/p/w500/vGcHyV9s1N2I7bJLSBODvqHTYLL.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-secrets-of-the-jungle/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.953301Z"
    },
    {
      "id": "d856fcefc01e61f0b163d70f092b4732",
      "title": "Pokémon: The First Movie",
      "image": "https://image.tmdb.org/t/p/w500/6YPzBcMH0aPNTvdXNCDLY0zdE1g.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-first-movie/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.953479Z"
    },
    {
      "id": "e4fd184c855802f9e0bf212e6dbc344d",
      "title": "Pokémon: Lucario and the Mystery of Mew",
      "image": "https://image.tmdb.org/t/p/w500/612lsEOZvsn3ELh07OGGGKCeEVj.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-lucario-and-the-mystery-of-mew/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.953665Z"
    },
    {
      "id": "fbae36c163bc1353a66727cafa3905e4",
      "title": "Pokémon the Movie: Kyurem vs. the Sword of Justice",
      "image": "https://image.tmdb.org/t/p/w500/ii6iOh6nTcndEuabU1oUsSFnr2l.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-kyurem-vs-the-sword-of-justice/",
      "sourcePage": "https://watchanimeworld.in/movies/page/3/",
      "timestamp": "2025-10-20T17:49:15.953840Z"
    },
    {
      "id": "7cb7a1faac1d4165875fb8a68006f0d2",
      "title": "Pokémon: Jirachi - Wish Maker",
      "image": "https://image.tmdb.org/t/p/w500/5TBXNazCYqi28PSqDVdeFnap3Wd.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-jirachi-wish-maker/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.130750Z"
    },
    {
      "id": "6fb120d43b1e3068bf7b30d27e1599de",
      "title": "Pokémon the Movie: I Choose You!",
      "image": "https://image.tmdb.org/t/p/w500/cmpOaiRtjnhLNF2iPslMXCOcVJ.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-i-choose-you/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.130921Z"
    },
    {
      "id": "9caea48040a54d4a41596614b10e1412",
      "title": "Pokémon: Giratina and the Sky Warrior",
      "image": "https://image.tmdb.org/t/p/w500/8dJxgyryI2XmheaTd3hrCkOabNu.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-giratina-and-the-sky-warrior/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131069Z"
    },
    {
      "id": "5f780b3e008169bbeee3cf024779f76a",
      "title": "Pokémon the Movie: Hoopa and the Clash of Ages",
      "image": "https://image.tmdb.org/t/p/w500/ujLIgISIV6Fv6j509SZp2Tmq2ZJ.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-hoopa-and-the-clash-of-ages/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131219Z"
    },
    {
      "id": "d1f525cc377974edb188fafda17cc31e",
      "title": "Sinbad - The Magical Lamp and the Moving Island",
      "image": "https://image.tmdb.org/t/p/w500/2ZMYYWL6FdT6rDlWXjRf08DhMB5.jpg",
      "url": "https://watchanimeworld.in/movies/sinbad-the-magical-lamp-and-the-moving-island/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131359Z"
    },
    {
      "id": "b0e7eeb184fd24c878962e3f98d29956",
      "title": "Sinbad - The Flying Princess and the Secret Island",
      "image": "https://image.tmdb.org/t/p/w500/u6mmhIOha22FvDKwhG3NPbSHgZ7.jpg",
      "url": "https://watchanimeworld.in/movies/sinbad-the-flying-princess-and-the-secret-island/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131501Z"
    },
    {
      "id": "0072533a9bad4acb8f09b2e23724a0cc",
      "title": "Shinchan: Pursuit of the Balls of Darkness",
      "image": "https://image.tmdb.org/t/p/w500/8NlnDeZtscTjOEFTzDRZzI2vIXJ.jpg",
      "url": "https://watchanimeworld.in/movies/shinchan-pursuit-of-the-balls-of-darkness/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131650Z"
    },
    {
      "id": "8b4fcd69e8a627f9591b265e62a508ed",
      "title": "Sinbad - Night at High Noon and the Wonder Gate",
      "image": "https://image.tmdb.org/t/p/w500/iAkWdZuhBuyLPmOQR3LH5IFjrYI.jpg",
      "url": "https://watchanimeworld.in/movies/sinbad-night-at-high-noon-and-the-wonder-gate/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131789Z"
    },
    {
      "id": "c777f610c4a7cecd0cb495c01da214ee",
      "title": "Evangelion: 3.0+1.0 Thrice Upon a Time",
      "image": "https://image.tmdb.org/t/p/w500/md5wZRRj8biHrGtyitgBZo7674t.jpg",
      "url": "https://watchanimeworld.in/movies/evangelion-3-01-0-thrice-upon-a-time/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.131936Z"
    },
    {
      "id": "ce9dd51b0b29719f611de5b1273a523d",
      "title": "Pokémon the Movie: Genesect and the Legend Awakened",
      "image": "https://image.tmdb.org/t/p/w500/5Yn9WvhVzrssgJqS5tnStITBGRN.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-genesect-and-the-legend-awakened/",
      "sourcePage": "https://watchanimeworld.in/movies/page/4/",
      "timestamp": "2025-10-20T17:49:17.132079Z"
    },
    {
      "id": "0fc49fbf40356961a58f48a823744cb5",
      "title": "Pokémon: Destiny Deoxys",
      "image": "https://image.tmdb.org/t/p/w500/uEeLCGLIXH1ElS53hyUQInJB0Ub.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-destiny-deoxys/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.493070Z"
    },
    {
      "id": "2458a205ba4fe51b3d3f6182a0208f08",
      "title": "Pokémon: The Rise of Darkrai",
      "image": "https://image.tmdb.org/t/p/w500/3yuYC7ZOaVUjHlkztjt9fEuCinK.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-rise-of-darkrai/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.493347Z"
    },
    {
      "id": "066820684a6ec68d139716cded1c115c",
      "title": "Pokémon the Movie: Diancie and the Cocoon of Destruction",
      "image": "https://image.tmdb.org/t/p/w500/t5a4J7Ctnl0w1FWg2ld0mKNvizK.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-diancie-and-the-cocoon-of-destruction/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.493564Z"
    },
    {
      "id": "c041b8f7e41a53e26fcf8cfc33e2f537",
      "title": "Pokémon the Movie 2000",
      "image": "https://image.tmdb.org/t/p/w500/rBeh11AHRIyQw738pXLoJ2tLxyN.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-2000/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.493790Z"
    },
    {
      "id": "691ff173cb57853396f2191aff9ede17",
      "title": "Pokémon: Arceus and the Jewel of Life",
      "image": "https://image.tmdb.org/t/p/w500/u5dybbTyhgJ3Trof4QZvfN5UoOP.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-arceus-and-the-jewel-of-life/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.493989Z"
    },
    {
      "id": "9f0c70502a6b8965583ef9c4b9471ada",
      "title": "Evangelion: 3.0 You Can (Not) Redo",
      "image": "https://image.tmdb.org/t/p/w500/d0s1xvykzl0kz7fP5S2ROYqphdz.jpg",
      "url": "https://watchanimeworld.in/movies/evangelion-3-0-you-can-not-redo/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.494202Z"
    },
    {
      "id": "ba623e4b07de9550d8068c882ba3aba9",
      "title": "Pokémon the Movie: Black - Victini and Reshiram",
      "image": "https://image.tmdb.org/t/p/w500/qPfo5ooRJWUczk3KXv8CnUmNkTl.jpg",
      "url": "https://watchanimeworld.in/movies/pokemon-the-movie-black-victini-and-reshiram/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.494409Z"
    },
    {
      "id": "c210ed1b6ad208c1709c09a5907403a0",
      "title": "Evangelion: 2.0 You Can (Not) Advance",
      "image": "https://image.tmdb.org/t/p/w500/7VLYN2CfJpB6PrcuzDKKqdGSUi6.jpg",
      "url": "https://watchanimeworld.in/movies/evangelion-2-0-you-can-not-advance/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.494622Z"
    },
    {
      "id": "ef0aea51a2fcd3708e79b4e95dfdec2b",
      "title": "Stand by Me Doraemon 2",
      "image": "https://image.tmdb.org/t/p/w500/vBv8iOFPLnXmtELUjcFc7OKHsR4.jpg",
      "url": "https://watchanimeworld.in/movies/stand-by-me-doraemon-2/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.494830Z"
    },
    {
      "id": "49c8850a1d118aa8574a00ee4fb5f575",
      "title": "Evangelion: 1.0 You Are (Not) Alone",
      "image": "https://image.tmdb.org/t/p/w500/pETU4GurpeEjBOM8oytMH0yNBHx.jpg",
      "url": "https://watchanimeworld.in/movies/evangelion-1-0-you-are-not-alone/",
      "sourcePage": "https://watchanimeworld.in/movies/page/5/",
      "timestamp": "2025-10-20T17:49:18.495033Z"
    },
    {
      "id": "a723d2f022ae1cebc7113415983cfbc1",
      "title": "Metal Fight Beyblade vs the Sun: Sol Blaze, the Scorching Hot Invader",
      "image": "https://image.tmdb.org/t/p/w500/m8qr20ROuawaRWNGPA4lZinT3Xz.jpg",
      "url": "https://watchanimeworld.in/movies/metal-fight-beyblade-vs-the-sun-sol-blaze-the-scorching-hot-invader/",
      "sourcePage": "https://watchanimeworld.in/movies/page/6/",
      "timestamp": "2025-10-20T17:49:19.746993Z"
    },
    {
      "id": "38683aa1ffda869b4c07faa35abf38ae",
      "title": "Beyblade the Movie: Fierce Battle",
      "image": "https://image.tmdb.org/t/p/w500/48na9Jhxix2zFCZEyD3hkNxxpaV.jpg",
      "url": "https://watchanimeworld.in/movies/beyblade-the-movie-fierce-battle/",
      "sourcePage": "https://watchanimeworld.in/movies/page/6/",
      "timestamp": "2025-10-20T17:49:19.747234Z"
    },
    {
      "id": "7bcafec35b72ff695c3b574e63d8dfbc",
      "title": "The Adventures of Tintin",
      "image": "https://image.tmdb.org/t/p/w500/mKYkNro2btaWMsnYSuyqrBdHQo3.jpg",
      "url": "https://watchanimeworld.in/movies/the-adventures-of-tintin/",
      "sourcePage": "https://watchanimeworld.in/movies/page/6/",
      "timestamp": "2025-10-20T17:49:19.748533Z"
    },
    {
      "id": "97a85fc3c1a958da834cc803e72df536",
      "title": "Ben 10: Race Against Time",
      "image": "https://image.tmdb.org/t/p/w500/fXGAMKFtm74TICGaSTCLGTvyBk4.jpg",
      "url": "https://watchanimeworld.in/movies/ben-10-race-against-time/",
      "sourcePage": "https://watchanimeworld.in/movies/page/7/",
      "timestamp": "2025-10-20T17:49:20.880263Z"
    },
    {
      "id": "08a7c2328ffd8016701d425bc334101a",
      "title": "Ben 10 Alien Swarm",
      "image": "https://image.tmdb.org/t/p/w500/wROzAzrcSsRTu1fQQu2QdaUER2X.jpg",
      "url": "https://watchanimeworld.in/movies/ben-10-alien-swarm/",
      "sourcePage": "https://watchanimeworld.in/movies/page/7/",
      "timestamp": "2025-10-20T17:49:20.880615Z"
    },
    {
      "id": "7b5a4c91bb8e1b2c1938486f3d006237",
      "title": "My Oni Girl",
      "image": "https://image.tmdb.org/t/p/w500/k69kkwsipkPn7Nzq488kHGQTPo.jpg",
      "url": "https://watchanimeworld.in/movies/my-oni-girl/",
      "sourcePage": "https://watchanimeworld.in/movies/page/7/",
      "timestamp": "2025-10-20T17:49:20.880788Z"
    },
    {
      "id": "8fe453d71f74e6be5ed8819885145bcc",
      "title": "New Saga",
      "image": "https://image.tmdb.org/t/p/w500/dmZ74VyWi3I8ZqJ1m3Fmcc1etgp.jpg",
      "url": "https://watchanimeworld.in/series/new-saga/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.443605Z"
    },
    {
      "id": "96a68b59cdd8dfd1149ee3949ee0db6a",
      "title": "Reborn as a Vending Machine, I Now Wander the Dungeon",
      "image": "https://image.tmdb.org/t/p/w500/bY6oLDoxDyP7JNLVGjeO3udND4g.jpg",
      "url": "https://watchanimeworld.in/series/reborn-as-a-vending-machine-i-now-wander-the-dungeon/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.443777Z"
    },
    {
      "id": "88002992b9f257600820a8a0f461c55c",
      "title": "Horimiya",
      "image": "https://image.tmdb.org/t/p/w500/iSOKGl5KIeOCAtigUDCfFZe2cOi.jpg",
      "url": "https://watchanimeworld.in/series/horimiya/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.443966Z"
    },
    {
      "id": "ce8e57ceae9acc77cd2ff637c9c75cd9",
      "title": "Lord of Mysteries",
      "image": "https://image.tmdb.org/t/p/w500/c8fHePq3yTn3WvZd4hupkHwsjm5.jpg",
      "url": "https://watchanimeworld.in/series/lord-of-mysteries/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.444153Z"
    },
    {
      "id": "2fb82fc41f26f636da247e3aa93e1fac",
      "title": "Ultraviolet: Code 044",
      "image": "https://image.tmdb.org/t/p/w500/kn3hzWSL3HIrrApz0UsXvnZFNHh.jpg",
      "url": "https://watchanimeworld.in/series/ultraviolet-code-044/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.444331Z"
    },
    {
      "id": "d6f4b0ef5be29d57833e35ce383af03f",
      "title": "Viper's Creed",
      "image": "https://image.tmdb.org/t/p/w500/3UiSM3pcJnjKZxJYE70BXueAtCv.jpg",
      "url": "https://watchanimeworld.in/series/vipers-creed/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.444514Z"
    },
    {
      "id": "85ca4da29535cb42ea3a291c365c5e47",
      "title": "Akuma Kun",
      "image": "https://image.tmdb.org/t/p/w500/zPPYeLhEFbZjImIvGcfvZEIBFQl.jpg",
      "url": "https://watchanimeworld.in/series/akuma-kun/",
      "sourcePage": "https://watchanimeworld.in/series/page/3/",
      "timestamp": "2025-10-20T17:49:25.444690Z"
    },
    {
      "id": "adab7110e41d6cd9d239cbcdf1d39f18",
      "title": "Kurozuka",
      "image": "https://image.tmdb.org/t/p/w500/hez6h5LZxedDfzHHPu3iqj2Gm82.jpg",
      "url": "https://watchanimeworld.in/series/kurozuka/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.620734Z"
    },
    {
      "id": "077fed04c0a9d0e05d3325a398d56a0e",
      "title": "Guin Saga",
      "image": "https://image.tmdb.org/t/p/w500/4bipHVo1teci5N8dc0pe0VO5UHm.jpg",
      "url": "https://watchanimeworld.in/series/guin-saga/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.620984Z"
    },
    {
      "id": "a014e3ca2a7fffb2978dd68a7dca6b9a",
      "title": "Valkyria Chronicles",
      "image": "https://image.tmdb.org/t/p/w500/arkbuM5HIZv7cRoftRpZEnGT24E.jpg",
      "url": "https://watchanimeworld.in/series/valkyria-chronicles/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.621201Z"
    },
    {
      "id": "e5e0e323f52359921fa6e4ed6cbd6046",
      "title": "Sakamoto Days",
      "image": "https://image.tmdb.org/t/p/w500/lBOHMPWetQprntjjtGquHwIHSvx.jpg",
      "url": "https://watchanimeworld.in/series/sakamoto-days/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.621423Z"
    },
    {
      "id": "45d84d4e03502443931d590af853f204",
      "title": "Garouden: The Way of the Lone Wolf",
      "image": "https://image.tmdb.org/t/p/w500/ozOjfhE6ADlWto0IKgVtniRvUOW.jpg",
      "url": "https://watchanimeworld.in/series/garouden-the-way-of-the-lone-wolf/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.621634Z"
    },
    {
      "id": "3e07bc9fdf08d66dc03d91e7646f7c45",
      "title": "Even Given the Worthless \"Appraiser\" Class, I'm Actually the Strongest",
      "image": "https://image.tmdb.org/t/p/w500/lUAGrruGGj2PB6CYkw6tGLQD41G.jpg",
      "url": "https://watchanimeworld.in/series/even-given-the-worthless-appraiser-class-im-actually-the-strongest/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.621838Z"
    },
    {
      "id": "5e85c721b5a006b97f170fe6b1256f1a",
      "title": "Leviathan",
      "image": "https://image.tmdb.org/t/p/w500/7HIswF211LMu6PxerdByCgKSuAS.jpg",
      "url": "https://watchanimeworld.in/series/leviathan/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.622051Z"
    },
    {
      "id": "23ff6c2de70a2c2c10c7bbfb224f77cf",
      "title": "Gachiakuta",
      "image": "https://image.tmdb.org/t/p/w500/84LdrRRvpWk8g0EaaW7z3eKdfum.jpg",
      "url": "https://watchanimeworld.in/series/gachiakuta/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.622254Z"
    },
    {
      "id": "ca40ae86aa8c4c25d8449d9c65d20154",
      "title": "Welcome to the Outcast's Restaurant!",
      "image": "https://image.tmdb.org/t/p/w500/caWU2F1DSrrJgoJCSclpSoCWnge.jpg",
      "url": "https://watchanimeworld.in/series/welcome-to-the-outcasts-restaurant/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.622456Z"
    },
    {
      "id": "7a6a9274425d1aa73e5fb1176c29528b",
      "title": "Clevatess",
      "image": "https://image.tmdb.org/t/p/w500/31I6eGFgYbbn5FMwzxOVlZfYETW.jpg",
      "url": "https://watchanimeworld.in/series/clevatess/",
      "sourcePage": "https://watchanimeworld.in/series/page/4/",
      "timestamp": "2025-10-20T17:49:26.622674Z"
    },
    {
      "id": "360cf42e97b23206f4496d923bdc8010",
      "title": "Paradox Live THE ANIMATION",
      "image": "https://image.tmdb.org/t/p/w500/tlPG08mmtFPb6K0PpymddXvuzzt.jpg",
      "url": "https://watchanimeworld.in/series/paradox-live-the-animation/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.257411Z"
    },
    {
      "id": "00b9c84e144be2383af8c8f8c555122a",
      "title": "Kaguya-sama: Love Is War",
      "image": "https://image.tmdb.org/t/p/w500/5khbC6AuNgnvnoDbjIMKCOhEtIc.jpg",
      "url": "https://watchanimeworld.in/series/kaguya-sama-love-is-war/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.258826Z"
    },
    {
      "id": "916e0ca3c72ce59d66b7188fec6c0274",
      "title": "Mob Psycho 100",
      "image": "https://image.tmdb.org/t/p/w500/vR7hwaGQ0ySRoq1WobiNRaPs4WO.jpg",
      "url": "https://watchanimeworld.in/series/mob-psycho-100/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.259553Z"
    },
    {
      "id": "923326351862e5a0e7787cc40d2cabed",
      "title": "Teogonia",
      "image": "https://image.tmdb.org/t/p/w500/zGHrnnFc0p5Pf25qUaAv95JpnJC.jpg",
      "url": "https://watchanimeworld.in/series/teogonia/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.259864Z"
    },
    {
      "id": "d5190c4f94e71dcc75081e94517e6ae4",
      "title": "One-Punch Man",
      "image": "https://image.tmdb.org/t/p/w500/jbYJuxfZMpYDalkiOnBcCv9TaL.jpg",
      "url": "https://watchanimeworld.in/series/one-punch-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.260214Z"
    },
    {
      "id": "ba0087e647519413fce4d0a04f923618",
      "title": "The Shiunji Family Children",
      "image": "https://image.tmdb.org/t/p/w500/tvhXMejlXyOUo24we09pXSgKw5j.jpg",
      "url": "https://watchanimeworld.in/series/the-shiunji-family-children/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.260695Z"
    },
    {
      "id": "f6d3d42bc4a073154672d72ecf26fd81",
      "title": "The Gorilla God's Go-To Girl",
      "image": "https://image.tmdb.org/t/p/w500/wsVUjE78BP7v2KayDnlAKbiY3Av.jpg",
      "url": "https://watchanimeworld.in/series/the-gorilla-gods-go-to-girl/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.261037Z"
    },
    {
      "id": "fbfa366bf75319ceaa8036d4fdbf5eae",
      "title": "I Parry Everything",
      "image": "https://image.tmdb.org/t/p/w500/arYDvPe3MS4lgt6K4gYRlXCJhXS.jpg",
      "url": "https://watchanimeworld.in/series/i-parry-everything/",
      "sourcePage": "https://watchanimeworld.in/series/page/5/",
      "timestamp": "2025-10-20T17:49:28.261352Z"
    },
    {
      "id": "d37fe059610ee8cfb012295a5bb17b0c",
      "title": "Overlord",
      "image": "https://image.tmdb.org/t/p/w500/aSjpVCanDAwCopdjIgWwrxOWnWf.jpg",
      "url": "https://watchanimeworld.in/series/overlord/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.420133Z"
    },
    {
      "id": "668df4a639d7d514044ac8c33ea77cc5",
      "title": "Catch Me at the Ballpark!",
      "image": "https://image.tmdb.org/t/p/w500/iJLVG8W3kp0JTPejChjPWrXEwI3.jpg",
      "url": "https://watchanimeworld.in/series/catch-me-at-the-ballpark/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.420513Z"
    },
    {
      "id": "48f6dc8ab9fa56226240bad755934927",
      "title": "Once Upon a Witch's Death",
      "image": "https://image.tmdb.org/t/p/w500/5Gr2mDFSGHhiEYrNfP6vbYtuNrT.jpg",
      "url": "https://watchanimeworld.in/series/once-upon-a-witchs-death/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.420841Z"
    },
    {
      "id": "e1eaf64bead02410ee9217f83ca7e039",
      "title": "Mobile Suit Gundam GQuuuuuuX",
      "image": "https://image.tmdb.org/t/p/w500/jb5d4vqHmKSQh9rB2T394e3z5To.jpg",
      "url": "https://watchanimeworld.in/series/mobile-suit-gundam-gquuuuuux/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.421056Z"
    },
    {
      "id": "63d7d49de8e8959905c45d8df14c11d8",
      "title": "JoJo's Bizarre Adventure",
      "image": "https://image.tmdb.org/t/p/w500/ogAWwbh3frWtiTyyXrZaVFtqCgp.jpg",
      "url": "https://watchanimeworld.in/series/jojos-bizarre-adventure/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.421288Z"
    },
    {
      "id": "bc18fe8c8396ee49774802bd95415a4c",
      "title": "The Beginning After the End",
      "image": "https://image.tmdb.org/t/p/w500/az0jQSgRLezKw5uHaEjPH20NexD.jpg",
      "url": "https://watchanimeworld.in/series/the-beginning-after-the-end/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.421814Z"
    },
    {
      "id": "de439eeec781f7546d2e83f0369ed528",
      "title": "The Unaware Atelier Meister",
      "image": "https://image.tmdb.org/t/p/w500/uZ7uXnU2CeJ3vlmzth1Owd2hVm4.jpg",
      "url": "https://watchanimeworld.in/series/the-unaware-atelier-meister/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.422091Z"
    },
    {
      "id": "91fb4f810112d4adb3c3516518bdae81",
      "title": "The Magical Girl and the Evil Lieutenant Used to Be Archenemies",
      "image": "https://image.tmdb.org/t/p/w500/r5mp5XoWP9q8fTvx4rLZbC8qtgj.jpg",
      "url": "https://watchanimeworld.in/series/the-magical-girl-and-the-evil-lieutenant-used-to-be-archenemies/",
      "sourcePage": "https://watchanimeworld.in/series/page/6/",
      "timestamp": "2025-10-20T17:49:29.422329Z"
    },
    {
      "id": "789b8e69837cc0fdb470779361df4d1d",
      "title": "Inside Job",
      "image": "https://image.tmdb.org/t/p/w500/qwJUDMJ4i3KBYjeUFK9Js87iJEa.jpg",
      "url": "https://watchanimeworld.in/series/inside-job-2/",
      "sourcePage": "https://watchanimeworld.in/series/page/7/",
      "timestamp": "2025-10-20T17:49:30.948508Z"
    },
    {
      "id": "ac57b93ced2cadd912012e7576101c51",
      "title": "Captain Laserhawk: A Blood Dragon Remix",
      "image": "https://image.tmdb.org/t/p/w500/wo9wJyuZnjeXYUjZSElmbm33crC.jpg",
      "url": "https://watchanimeworld.in/series/captain-laserhawk-a-blood-dragon-remix/",
      "sourcePage": "https://watchanimeworld.in/series/page/8/",
      "timestamp": "2025-10-20T17:49:32.580923Z"
    },
    {
      "id": "1cd60aebcc8af9e0a840597d2b1616de",
      "title": "INVINCIBLE",
      "image": "https://image.tmdb.org/t/p/w500/jBn4LWlgdsf6xIUYhYBwpctBVsj.jpg",
      "url": "https://watchanimeworld.in/series/invincible/",
      "sourcePage": "https://watchanimeworld.in/series/page/8/",
      "timestamp": "2025-10-20T17:49:32.581024Z"
    },
    {
      "id": "f8e74158e2ae155b2bfcc7c962f74d01",
      "title": "Zig and Sharko",
      "image": "https://image.tmdb.org/t/p/w500/cdnKMeCCji3nA5HPt2qboIFPzOc.jpg",
      "url": "https://watchanimeworld.in/series/zig-and-sharko/",
      "sourcePage": "https://watchanimeworld.in/series/page/8/",
      "timestamp": "2025-10-20T17:49:32.581121Z"
    },
    {
      "id": "93b6f70235c179a6c56bf58a3cf881f1",
      "title": "Twilight of the Gods",
      "image": "https://image.tmdb.org/t/p/w500/n0rqWDT1oYGcNIuLydZD4J4JpwK.jpg",
      "url": "https://watchanimeworld.in/series/twilight-of-the-gods/",
      "sourcePage": "https://watchanimeworld.in/series/page/8/",
      "timestamp": "2025-10-20T17:49:32.581218Z"
    },
    {
      "id": "102fdd4f3b2370ceedbf891fa33b68d1",
      "title": "Arcane",
      "image": "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      "url": "https://watchanimeworld.in/series/arcane/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.727755Z"
    },
    {
      "id": "a50a047e1c67fc92bd42adeb4704bd91",
      "title": "Jentry Chau vs the Underworld",
      "image": "https://image.tmdb.org/t/p/w500/gCVwVPOajqfILlAUwKGmNwVZofb.jpg",
      "url": "https://watchanimeworld.in/series/jentry-chau-vs-the-underworld/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.727963Z"
    },
    {
      "id": "f054734684e920d07d16c5dc56d76c42",
      "title": "Batman: Caped Crusader",
      "image": "https://image.tmdb.org/t/p/w500/imuZQcnPNKNygPw28TESUq4tNsb.jpg",
      "url": "https://watchanimeworld.in/series/batman-caped-crusader/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.728156Z"
    },
    {
      "id": "0bf37ded3fe5a1daebdf01a8b6433f7d",
      "title": "The Legend of Vox Machina",
      "image": "https://image.tmdb.org/t/p/w500/b5A0qkGrZJTyVv3gT6b8clFEz9R.jpg",
      "url": "https://watchanimeworld.in/series/the-legend-of-vox-machina/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.728335Z"
    },
    {
      "id": "2c1e28ccc4a011d686611079f87e7995",
      "title": "Castlevania: Nocturne",
      "image": "https://image.tmdb.org/t/p/w500/4XJwo95ktJ7xupw1bCMuP91kyYr.jpg",
      "url": "https://watchanimeworld.in/series/castlevania-nocturne/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.728508Z"
    },
    {
      "id": "62a830f52dbf2db91858873737a95347",
      "title": "Castlevania",
      "image": "https://image.tmdb.org/t/p/w500/ubDtIBwdS9b29sBofAkqWz3PqkT.jpg",
      "url": "https://watchanimeworld.in/series/castlevania/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.728702Z"
    },
    {
      "id": "69257afb38b003ccb107fc793586204a",
      "title": "The God of High School",
      "image": "https://image.tmdb.org/t/p/w500/AnXFYG7y2A65dr5noYvZSdVq8l3.jpg",
      "url": "https://watchanimeworld.in/series/the-god-of-high-school/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.728888Z"
    },
    {
      "id": "9e934437f78e2ed87f398368e79752e3",
      "title": "The Dragon Prince",
      "image": "https://image.tmdb.org/t/p/w500/d7PIRa6ez7ZEl9D4JUrnSsmcnVD.jpg",
      "url": "https://watchanimeworld.in/series/the-dragon-prince/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.729098Z"
    },
    {
      "id": "86d648d04f3fb9b04ba9910ff4e8e34f",
      "title": "As a Reincarnated Aristocrat, I'll Use My Appraisal Skill to Rise in the World",
      "image": "https://image.tmdb.org/t/p/w500/kYjQNi15IWz76nbqFBFPlVsO9lL.jpg",
      "url": "https://watchanimeworld.in/series/as-a-reincarnated-aristocrat-ill-use-my-appraisal-skill-to-rise-in-the-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.729381Z"
    },
    {
      "id": "369322d905399bf0fbf4eee4c2e7eff0",
      "title": "The Maid I Hired Recently Is Mysterious",
      "image": "https://image.tmdb.org/t/p/w500/prmCIIk3HBIfpLlhR8ikVqgPJnP.jpg",
      "url": "https://watchanimeworld.in/series/the-maid-i-hired-recently-is-mysterious/",
      "sourcePage": "https://watchanimeworld.in/series/page/9/",
      "timestamp": "2025-10-20T17:49:33.729584Z"
    },
    {
      "id": "ee4d574feeb3e0bbf2a8437211809ee4",
      "title": "Delicious in Dungeon",
      "image": "https://image.tmdb.org/t/p/w500/9t3DYdGxK3i4WRzKvIZwJd4kBnr.jpg",
      "url": "https://watchanimeworld.in/series/delicious-in-dungeon/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.937994Z"
    },
    {
      "id": "3d06efbc3e34252cfe576f2ab4bf26db",
      "title": "The Strongest Tank's Labyrinth Raids -A Tank with a Rare 9999 Resistance Skill Got Kicked from the Hero's Party-",
      "image": "https://image.tmdb.org/t/p/w500/3Uf8L7wl4dokMukJ855cBLVxQj5.jpg",
      "url": "https://watchanimeworld.in/series/the-strongest-tanks-labyrinth-raids-a-tank-with-a-rare-9999-resistance-skill-got-kicked-from-the-heros-party/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.938230Z"
    },
    {
      "id": "e91129644a2c75718c3264b319c891ba",
      "title": "Attack on Titan",
      "image": "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      "url": "https://watchanimeworld.in/series/attack-on-titan/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.938429Z"
    },
    {
      "id": "efa5d097ed6383e0d87b0e8e8d34a433",
      "title": "Re Zero - Starting Life in Another World",
      "image": "https://image.tmdb.org/t/p/w500/aRwmcX36r1ZpR5Xq5mmFcpUDQ8J.jpg",
      "url": "https://watchanimeworld.in/series/re-zero-starting-life-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.938625Z"
    },
    {
      "id": "7386f289e4801c5f36ddc0dc66f2f8a4",
      "title": "Aoashi",
      "image": "https://image.tmdb.org/t/p/w500/erwRgEPtUtyv3Vkmxt0MhjKi5kA.jpg",
      "url": "https://watchanimeworld.in/series/aoashi/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.938829Z"
    },
    {
      "id": "92b51a1ced5635daeb5d286667a0100f",
      "title": "Chillin' in Another World with Level 2 Super Cheat Powers",
      "image": "https://image.tmdb.org/t/p/w500/29z2Qja0nXaCsfig7RCFCo1LP1d.jpg",
      "url": "https://watchanimeworld.in/series/chillin-in-another-world-with-level-2-super-cheat-powers/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.939022Z"
    },
    {
      "id": "114f12ba45f8d1fdf6a8f8dc2054c5d1",
      "title": "She Professed Herself Pupil of the Wise Man",
      "image": "https://image.tmdb.org/t/p/w500/j8QFzP0Jh80hYZtwI6UF8R81Ahw.jpg",
      "url": "https://watchanimeworld.in/series/she-professed-herself-pupil-of-the-wise-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.939221Z"
    },
    {
      "id": "c77b018934bc9b6a484e5fd579afc970",
      "title": "The Angel Next Door Spoils Me Rotten",
      "image": "https://image.tmdb.org/t/p/w500/twCEEzmZZkgQIPXzw0JF350GO0P.jpg",
      "url": "https://watchanimeworld.in/series/the-angel-next-door-spoils-me-rotten/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.939422Z"
    },
    {
      "id": "e638e676d8fc9f523d162809666c9c28",
      "title": "Summer Time Rendering",
      "image": "https://image.tmdb.org/t/p/w500/m9e7chRW8Q8Go1Dv00RCUHbMoNe.jpg",
      "url": "https://watchanimeworld.in/series/summer-time-rendering/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.939613Z"
    },
    {
      "id": "85394de418bc28b8aee825070f3a4bbe",
      "title": "More Than a Married Couple, But Not Lovers",
      "image": "https://image.tmdb.org/t/p/w500/tEdCclmak7CHR5OzbusD94zdhUW.jpg",
      "url": "https://watchanimeworld.in/series/more-than-a-married-couple-but-not-lovers/",
      "sourcePage": "https://watchanimeworld.in/series/page/10/",
      "timestamp": "2025-10-20T17:49:34.939814Z"
    },
    {
      "id": "8c4c3be2acb5d4f9e08c94a39ce52877",
      "title": "Mobile Suit Gundam: The Witch from Mercury",
      "image": "https://image.tmdb.org/t/p/w500/gBkDlMaAVOVMRWWlRUHhkLAhNE3.jpg",
      "url": "https://watchanimeworld.in/series/mobile-suit-gundam-the-witch-from-mercury/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.346877Z"
    },
    {
      "id": "6838178f446a3298e9b2b905981501f0",
      "title": "Junji Ito Collection",
      "image": "https://image.tmdb.org/t/p/w500/umJEelwoLi3x123sbJ9pMTPA5Lt.jpg",
      "url": "https://watchanimeworld.in/series/junji-ito-collection/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.347260Z"
    },
    {
      "id": "612ccaf571240ef1da24c9288335282a",
      "title": "Rent-a-Girlfriend",
      "image": "https://image.tmdb.org/t/p/w500/6ZpDPUNtVw6UdJoStvVlRZ62yAi.jpg",
      "url": "https://watchanimeworld.in/series/rent-a-girlfriend/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.347682Z"
    },
    {
      "id": "4615628dee54c657779692ea5fc07169",
      "title": "Re:Monster",
      "image": "https://image.tmdb.org/t/p/w500/AmFrA0jX0p9twH1IKfxcGWVz2X3.jpg",
      "url": "https://watchanimeworld.in/series/remonster/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.348051Z"
    },
    {
      "id": "e173d89f93750d6b55df77a8e099797f",
      "title": "Villainess Level 99: I May Be the Hidden Boss But I'm Not the Demon Lord",
      "image": "https://image.tmdb.org/t/p/w500/hhJxMizNJNX0oNWHm2KhECugYvu.jpg",
      "url": "https://watchanimeworld.in/series/villainess-level-99-i-may-be-the-hidden-boss-but-im-not-the-demon-lord/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.348395Z"
    },
    {
      "id": "11bf7fa17836f4254a6eee8eecb12487",
      "title": "Black Butler",
      "image": "https://image.tmdb.org/t/p/w500/iXGs130TRoUplHf0o86zp9MqAYc.jpg",
      "url": "https://watchanimeworld.in/series/black-butler/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.348751Z"
    },
    {
      "id": "9bb0300a96fa471fea62c38a60923ece",
      "title": "My Happy Marriage",
      "image": "https://image.tmdb.org/t/p/w500/5RZIBqSYHhpQF6s8Dgw2aXlA4ZS.jpg",
      "url": "https://watchanimeworld.in/series/my-happy-marriage/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.349087Z"
    },
    {
      "id": "3792acc2cd02b01d39e7c9da7823d9de",
      "title": "Black Rock Shooter: Dawn Fall",
      "image": "https://image.tmdb.org/t/p/w500/4BSM2fT1rOVy0Rcr22lmq4XuXjS.jpg",
      "url": "https://watchanimeworld.in/series/black-rock-shooter-dawn-fall/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.349414Z"
    },
    {
      "id": "d3ff1970d4ebd6adb29efd9e773fd663",
      "title": "Bleach: Thousand-Year Blood War",
      "image": "https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg",
      "url": "https://watchanimeworld.in/series/bleach-thousand-year-blood-war/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.349746Z"
    },
    {
      "id": "0b5a5827c8b4765eee7105cf62894140",
      "title": "Ameku M.D.: Doctor Detective",
      "image": "https://image.tmdb.org/t/p/w500/mjTuJbgOssPGzCVGuqGxbnwS6iA.jpg",
      "url": "https://watchanimeworld.in/series/ameku-m-d-doctor-detective/",
      "sourcePage": "https://watchanimeworld.in/series/page/11/",
      "timestamp": "2025-10-20T17:49:36.350092Z"
    },
    {
      "id": "f62e0a21ad180e50fdcfcc36e0a3173b",
      "title": "Code Geass: Lelouch of the Rebellion",
      "image": "https://image.tmdb.org/t/p/w500/x316WCogkeIwNY4JR8zTCHbI2nQ.jpg",
      "url": "https://watchanimeworld.in/series/code-geass-lelouch-of-the-rebellion/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.540274Z"
    },
    {
      "id": "194c91cf18ef086771111f81ccb5470b",
      "title": "KamiKatsu: Working for God in a Godless World",
      "image": "https://image.tmdb.org/t/p/w500/zIn90M0V83e0F1n9fCudP3My88Q.jpg",
      "url": "https://watchanimeworld.in/series/kamikatsu-working-for-god-in-a-godless-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.540500Z"
    },
    {
      "id": "4294de512f6004557e273ccb72029dc9",
      "title": "Buddy Daddies",
      "image": "https://image.tmdb.org/t/p/w500/200lUtWr0k0iaDfhuX0fFz8tETR.jpg",
      "url": "https://watchanimeworld.in/series/buddy-daddies/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.540725Z"
    },
    {
      "id": "085d7ee07ee8b4af566e9cc51685d14d",
      "title": "Handyman Saitou in Another World",
      "image": "https://image.tmdb.org/t/p/w500/xp404PMU2cGsODMTIkkUizbYhcm.jpg",
      "url": "https://watchanimeworld.in/series/handyman-saitou-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.540929Z"
    },
    {
      "id": "e13deb91e1e792ee31c05725079be56e",
      "title": "I Got a Cheat Skill in Another World and Became Unrivaled in the Real World, Too",
      "image": "https://image.tmdb.org/t/p/w500/2kTYmmOU8SsDxSijIDpz9vkT9la.jpg",
      "url": "https://watchanimeworld.in/series/i-got-a-cheat-skill-in-another-world-and-became-unrivaled-in-the-real-world-too/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.541180Z"
    },
    {
      "id": "0e944242b933ccb8e851cb030af98b12",
      "title": "Akudama Drive",
      "image": "https://image.tmdb.org/t/p/w500/1s3fwsH3AjuyzObYHiptiYRgFa.jpg",
      "url": "https://watchanimeworld.in/series/akudama-drive/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.541382Z"
    },
    {
      "id": "576b9cb31b22e184ffb7296121f04d65",
      "title": "Hunter x Hunter",
      "image": "https://image.tmdb.org/t/p/w500/i2EEr2uBvRlAwJ8d8zTG2Y19mIa.jpg",
      "url": "https://watchanimeworld.in/series/hunter-x-hunter/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.541581Z"
    },
    {
      "id": "58bd06cca57277cdb7a5d4594e6b7bfb",
      "title": "Berserk of Gluttony",
      "image": "https://image.tmdb.org/t/p/w500/wQMcq5YUjMfoIEqLRzrNQVt4ROl.jpg",
      "url": "https://watchanimeworld.in/series/berserk-of-gluttony/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.541775Z"
    },
    {
      "id": "a9f4a41fa0b671a25b4987482ff0a2db",
      "title": "A Salad Bowl of Eccentrics",
      "image": "https://image.tmdb.org/t/p/w500/6dumHhfa0BMzjwEZpj9o4uVcGpP.jpg",
      "url": "https://watchanimeworld.in/series/a-salad-bowl-of-eccentrics/",
      "sourcePage": "https://watchanimeworld.in/series/page/12/",
      "timestamp": "2025-10-20T17:49:37.541990Z"
    },
    {
      "id": "71478f66177f9b6d6dd98fb54baac26a",
      "title": "My One-Hit Kill Sister",
      "image": "https://image.tmdb.org/t/p/w500/hQEgYVrTUxV0yXqLxdwdXIaofGt.jpg",
      "url": "https://watchanimeworld.in/series/my-one-hit-kill-sister/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.981376Z"
    },
    {
      "id": "ddbf108ed471db954049d2b8e528eafe",
      "title": "Reign of the Seven Spellblades",
      "image": "https://image.tmdb.org/t/p/w500/kqjLHtt539Sm6aasMvlJ7tuBr4i.jpg",
      "url": "https://watchanimeworld.in/series/reign-of-the-seven-spellblades/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.981625Z"
    },
    {
      "id": "dab28d2920a5686702ce1b974d65eb5a",
      "title": "Zom 100: Bucket List of the Dead",
      "image": "https://image.tmdb.org/t/p/w500/bTYMgERNC9rVdmxTSzKuex4GWbF.jpg",
      "url": "https://watchanimeworld.in/series/zom-100-bucket-list-of-the-dead/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.981857Z"
    },
    {
      "id": "6fbed47d3030a33f63dfa8ff273d94ec",
      "title": "Masamune-kun's Revenge",
      "image": "https://image.tmdb.org/t/p/w500/iBYBHuL4o6UkB5GPQFcUheAsUJM.jpg",
      "url": "https://watchanimeworld.in/series/masamune-kuns-revenge/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.982061Z"
    },
    {
      "id": "511cc4a7ecaf7fee9ecde03e711fb0f3",
      "title": "The Case Study of Vanitas",
      "image": "https://image.tmdb.org/t/p/w500/hk9joSlfsrVTmcoYzQ7rFg028Fq.jpg",
      "url": "https://watchanimeworld.in/series/the-case-study-of-vanitas/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.982262Z"
    },
    {
      "id": "7aa779187ef78c2410f6518063bf0924",
      "title": "My Love Story with Yamada-kun at Lv999",
      "image": "https://image.tmdb.org/t/p/w500/6RTMDyXZpzACsSg5AcRSUHMO8m2.jpg",
      "url": "https://watchanimeworld.in/series/my-love-story-with-yamada-kun-at-lv999/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.982487Z"
    },
    {
      "id": "1b78fb0b5c3c972be25e3873127799cc",
      "title": "I'm in Love with the Villainess",
      "image": "https://image.tmdb.org/t/p/w500/29jtBbv4eSk0QHdVMLwl8P4p6NX.jpg",
      "url": "https://watchanimeworld.in/series/im-in-love-with-the-villainess/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.982688Z"
    },
    {
      "id": "ab42805207d87456dc4ee7244b559d57",
      "title": "Trapped in a Dating Sim: The World of Otome Games Is Tough for Mobs",
      "image": "https://image.tmdb.org/t/p/w500/8AhHtqY4yPquNrprkVbzUKw8kRh.jpg",
      "url": "https://watchanimeworld.in/series/trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.982896Z"
    },
    {
      "id": "42351101235d4edd2088b614c8494dcc",
      "title": "Tomo-chan Is a Girl!",
      "image": "https://image.tmdb.org/t/p/w500/h9TN2BltJ9Q7FZ5BYGQcHfYfEGp.jpg",
      "url": "https://watchanimeworld.in/series/tomo-chan-is-a-girl/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.983094Z"
    },
    {
      "id": "116740227db3b75ce6d2f9291522e042",
      "title": "Fairy Tail",
      "image": "https://image.tmdb.org/t/p/w500/iuRJ2QRRNMIu2VdEIuLIaJvt1PZ.jpg",
      "url": "https://watchanimeworld.in/series/fairy-tail/",
      "sourcePage": "https://watchanimeworld.in/series/page/13/",
      "timestamp": "2025-10-20T17:49:38.983296Z"
    },
    {
      "id": "c2bd8286b687232ea2a4d6c78ffb8500",
      "title": "The Wrong Way to Use Healing Magic",
      "image": "https://image.tmdb.org/t/p/w500/uQEbcmuUwDfPiVUIRCF6d57eErM.jpg",
      "url": "https://watchanimeworld.in/series/the-wrong-way-to-use-healing-magic/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.129635Z"
    },
    {
      "id": "867b64d19fee2528fddd4cd2ee71813f",
      "title": "Fairy Tail: 100 Years Quest",
      "image": "https://image.tmdb.org/t/p/w500/95lYuqEYofq6bjQb6sgOzLBA6ja.jpg",
      "url": "https://watchanimeworld.in/series/fairy-tail-100-years-quest/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.129849Z"
    },
    {
      "id": "c35ab0f546d422d31e9dcb9812581c3e",
      "title": "The World's Finest Assassin Gets Reincarnated in Another World as an Aristocrat",
      "image": "https://image.tmdb.org/t/p/w500/iusQCT2pje1Mc8A8LKnW1uZ5BOO.jpg",
      "url": "https://watchanimeworld.in/series/the-worlds-finest-assassin-gets-reincarnated-in-another-world-as-an-aristocrat/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.130051Z"
    },
    {
      "id": "8c6e98b7d03ca5e645c2ce1040d57731",
      "title": "ReLIFE",
      "image": "https://image.tmdb.org/t/p/w500/aRK64bB8hMsuZZnitebPyKqOR5d.jpg",
      "url": "https://watchanimeworld.in/series/relife/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.130260Z"
    },
    {
      "id": "bb208479d3ee5db9c2c8f9f0e58043aa",
      "title": "Ranking of Kings: The Treasure Chest of Courage",
      "image": "https://image.tmdb.org/t/p/w500/9txbeJIHla2QXW3bGi3pgjIsVp5.jpg",
      "url": "https://watchanimeworld.in/series/ranking-of-kings-the-treasure-chest-of-courage/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.130446Z"
    },
    {
      "id": "01c9bc4acbf167024f8c58beb29916c6",
      "title": "Ranking of Kings",
      "image": "https://image.tmdb.org/t/p/w500/ujMjMUi6z02uOfQEerEDC4rH6aG.jpg",
      "url": "https://watchanimeworld.in/series/ranking-of-kings/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.130647Z"
    },
    {
      "id": "f131a0c683d993cb7b791637414b7995",
      "title": "Frieren: Beyond Journey's End",
      "image": "https://image.tmdb.org/t/p/w500/dqZENchTd7lp5zht7BdlqM7RBhD.jpg",
      "url": "https://watchanimeworld.in/series/frieren-beyond-journeys-end/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.130847Z"
    },
    {
      "id": "566125cc5c64972c0284285ad25670e7",
      "title": "RADIANT",
      "image": "https://image.tmdb.org/t/p/w500/yPeqnwD63wf23ZHlzEFeQLnZD3K.jpg",
      "url": "https://watchanimeworld.in/series/radiant/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.131073Z"
    },
    {
      "id": "dd9f15a3fe37e9418da8eca6a0927fec",
      "title": "The Red Ranger Becomes an Adventurer in Another World",
      "image": "https://image.tmdb.org/t/p/w500/ZkvF2ASZD3gLDnn2ZJ7L7RGSBc.jpg",
      "url": "https://watchanimeworld.in/series/the-red-ranger-becomes-an-adventurer-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.131325Z"
    },
    {
      "id": "6b3cd350e2a9b5b61d86a29551c507a6",
      "title": "Solo Leveling",
      "image": "https://image.tmdb.org/t/p/w500/rsOApVLbIQEcNkqSlOxNPyg3FyI.jpg",
      "url": "https://watchanimeworld.in/series/solo-leveling/",
      "sourcePage": "https://watchanimeworld.in/series/page/14/",
      "timestamp": "2025-10-20T17:49:40.131619Z"
    },
    {
      "id": "1c94ef66b1dd813d7291f7c7f2ab02be",
      "title": "I'm Getting Married to a Girl I Hate in My Class",
      "image": "https://image.tmdb.org/t/p/w500/k0Yb8KjspVjNlmvHNgqRRbhZ6LA.jpg",
      "url": "https://watchanimeworld.in/series/im-getting-married-to-a-girl-i-hate-in-my-class/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.289811Z"
    },
    {
      "id": "b65adbdff2bc6907691f97d8fb1b26c3",
      "title": "Possibly the Greatest Alchemist of All Time",
      "image": "https://image.tmdb.org/t/p/w500/4TyTS9O7ECH3mXpazQ6GpJXCqNm.jpg",
      "url": "https://watchanimeworld.in/series/possibly-the-greatest-alchemist-of-all-time/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.290204Z"
    },
    {
      "id": "cebbc9b737ab13b71544ed1469ed9d71",
      "title": "Vampire Dormitory",
      "image": "https://image.tmdb.org/t/p/w500/y4HvRKul54BSRFBeY5uaA3354Bz.jpg",
      "url": "https://watchanimeworld.in/series/vampire-dormitory/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.291169Z"
    },
    {
      "id": "23655d4dc86c06e234485a9f82707f57",
      "title": "The Reincarnation of the Strongest Exorcist in Another World",
      "image": "https://image.tmdb.org/t/p/w500/ppnnpGWK9mUD8EHjKTRzQOD7uey.jpg",
      "url": "https://watchanimeworld.in/series/the-reincarnation-of-the-strongest-exorcist-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.291764Z"
    },
    {
      "id": "226c6ba68a8c68064815a710d9766f92",
      "title": "The Many Sides of Voice Actor Radio",
      "image": "https://image.tmdb.org/t/p/w500/733lDek9YYMfxplg0ELoi3mkRuH.jpg",
      "url": "https://watchanimeworld.in/series/the-many-sides-of-voice-actor-radio/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.292160Z"
    },
    {
      "id": "8365b9d66d5ea68cbf76b79ecee96def",
      "title": "The Great Cleric",
      "image": "https://image.tmdb.org/t/p/w500/zkzYTYdhaNqRaGyKsBunt3y5vs0.jpg",
      "url": "https://watchanimeworld.in/series/the-great-cleric/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.292512Z"
    },
    {
      "id": "dd95dd8fbd6a8532f95efe0165c8a1d6",
      "title": "The Detective Is Already Dead",
      "image": "https://image.tmdb.org/t/p/w500/8gCOlj0bXa2cQnXSl4wRX5tVIA0.jpg",
      "url": "https://watchanimeworld.in/series/the-detective-is-already-dead/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.292858Z"
    },
    {
      "id": "a200c5352b5a392c096effe73ceaf11a",
      "title": "The Apothecary Diaries",
      "image": "https://image.tmdb.org/t/p/w500/e3ojpANrFnmJCyeBNTinYwyBCIN.jpg",
      "url": "https://watchanimeworld.in/series/the-apothecary-diaries/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.293179Z"
    },
    {
      "id": "2c15a1f7aec34afd1925d53196f34188",
      "title": "The Ancient Magus' Bride",
      "image": "https://image.tmdb.org/t/p/w500/8jnA4eaJLj3GByaYIw2JroVln40.jpg",
      "url": "https://watchanimeworld.in/series/the-ancient-magus-bride/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.293495Z"
    },
    {
      "id": "52a6d02cc27470c1f130dd6921f6d6a4",
      "title": "Welcome to Demon School! Iruma-kun",
      "image": "https://image.tmdb.org/t/p/w500/aed6I1EMR4Lbk8bdikWrndbn5Og.jpg",
      "url": "https://watchanimeworld.in/series/welcome-to-demon-school-iruma-kun/",
      "sourcePage": "https://watchanimeworld.in/series/page/15/",
      "timestamp": "2025-10-20T17:49:41.293812Z"
    },
    {
      "id": "7b4cf3f237a17737152785ae9e9534ea",
      "title": "Dead Mount Death Play",
      "image": "https://image.tmdb.org/t/p/w500/oOlg3bPWOKBgy5kgOTVe8pJz4HI.jpg",
      "url": "https://watchanimeworld.in/series/dead-mount-death-play/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.609966Z"
    },
    {
      "id": "51f2e84aa0eb94ec5216107001bcf3af",
      "title": "An Archdemon's Dilemma: How to Love Your Elf Bride",
      "image": "https://image.tmdb.org/t/p/w500/yrtmTLOnHWJxlqDHNyxm0eUHr1U.jpg",
      "url": "https://watchanimeworld.in/series/an-archdemons-dilemma-how-to-love-your-elf-bride/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.610335Z"
    },
    {
      "id": "d1d4ffba6cdbff74bdcf0b3b2f198fe8",
      "title": "Why Raeliana Ended Up at the Duke's Mansion",
      "image": "https://image.tmdb.org/t/p/w500/4yY40FOXCpY0I2AQLkwPSSkzE5z.jpg",
      "url": "https://watchanimeworld.in/series/why-raeliana-ended-up-at-the-dukes-mansion/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.610672Z"
    },
    {
      "id": "b9e4cc32afed1b489c507a45f66dc545",
      "title": "My Unique Skill Makes Me OP Even at Level 1",
      "image": "https://image.tmdb.org/t/p/w500/cIrptxkpf3SNcPty3JaywvWRJ5w.jpg",
      "url": "https://watchanimeworld.in/series/my-unique-skill-makes-me-op-even-at-level-1/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.611004Z"
    },
    {
      "id": "911fb1d8650f2ed97231d0d6732c4bae",
      "title": "My Tiny Senpai",
      "image": "https://image.tmdb.org/t/p/w500/7zSPXGCvXjkVCR7797UbRDPfV2B.jpg",
      "url": "https://watchanimeworld.in/series/my-tiny-senpai/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.611317Z"
    },
    {
      "id": "4bba5778249c4f1852e8e3de63c2fb83",
      "title": "Metallic Rouge",
      "image": "https://image.tmdb.org/t/p/w500/dcUWxOeCiEM7n7KdIYk1O8Xzgzp.jpg",
      "url": "https://watchanimeworld.in/series/metallic-rouge/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.611648Z"
    },
    {
      "id": "e728aa06c9edfe91903dc1569de2d030",
      "title": "True Beauty",
      "image": "https://image.tmdb.org/t/p/w500/9gpc8kIhNEG7r0VTkyI9aVBxdO3.jpg",
      "url": "https://watchanimeworld.in/series/true-beauty/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.612067Z"
    },
    {
      "id": "cc18228640a458972d6176d8003237e1",
      "title": "BARTENDER Glass of God",
      "image": "https://image.tmdb.org/t/p/w500/aefIsbDvm2kDkZGEllkYWoMONrl.jpg",
      "url": "https://watchanimeworld.in/series/bartender-glass-of-god/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.612479Z"
    },
    {
      "id": "09ec5778ae398c1eeff9799a182dfe99",
      "title": "Dr. STONE",
      "image": "https://image.tmdb.org/t/p/w500/xbZQ3fDl0y5mt0ARwfeyrgQ4JTw.jpg",
      "url": "https://watchanimeworld.in/series/dr-stone/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.612805Z"
    },
    {
      "id": "6600d5fc78e1caaf16620145f7716e47",
      "title": "Kiteretsu",
      "image": "https://image.tmdb.org/t/p/w500/rkCwT6NmATLsm1SNLEFNZ3JCzva.jpg",
      "url": "https://watchanimeworld.in/series/kiteretsu-daihyakka/",
      "sourcePage": "https://watchanimeworld.in/series/page/16/",
      "timestamp": "2025-10-20T17:49:42.613138Z"
    },
    {
      "id": "1dc5c303e3a3dcba19d64da2ca95775b",
      "title": "ZENSHU",
      "image": "https://image.tmdb.org/t/p/w500/okRnvNLpduDKPUIyZbMxJkeek8D.jpg",
      "url": "https://watchanimeworld.in/series/zenshu/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.769994Z"
    },
    {
      "id": "89c81a49b2c520440c060de2a47cb2ac",
      "title": "Magic Maker: How to Make Magic in Another World",
      "image": "https://image.tmdb.org/t/p/w500/wKe1FmUAcSukpfEn5s6747pBwLD.jpg",
      "url": "https://watchanimeworld.in/series/magic-maker-how-to-make-magic-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.770362Z"
    },
    {
      "id": "64a63dae547159eebe5ffbed2700326a",
      "title": "A Condition Called Love",
      "image": "https://image.tmdb.org/t/p/w500/e1ao8YAdgbN0wCUSatCESTPwaAh.jpg",
      "url": "https://watchanimeworld.in/series/a-condition-called-love/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.770714Z"
    },
    {
      "id": "330b8be6e9b9950e710305a1948167d5",
      "title": "Tokyo 24th Ward",
      "image": "https://image.tmdb.org/t/p/w500/3NYB8HfKALKQ4cHGx8Rx4Dhd0YE.jpg",
      "url": "https://watchanimeworld.in/series/tokyo-24th-ward/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.771046Z"
    },
    {
      "id": "1d2d9a400d67b32449aa31f9eb6edf34",
      "title": "Miss Kuroitsu From the Monster Development Department",
      "image": "https://image.tmdb.org/t/p/w500/yP0gRkxo9puHGAc9PgwUj9Ym0h.jpg",
      "url": "https://watchanimeworld.in/series/miss-kuroitsu-from-the-monster-development-department/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.771373Z"
    },
    {
      "id": "25db931e2e923adbffb18f18e5693669",
      "title": "The Weakest Tamer Began a Journey to Pick Up Trash",
      "image": "https://image.tmdb.org/t/p/w500/za2EAhBtO08JJw9Q25zKyrY5Jkd.jpg",
      "url": "https://watchanimeworld.in/series/the-weakest-tamer-began-a-journey-to-pick-up-trash/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.771713Z"
    },
    {
      "id": "e94b4ce5275a08d0becc18aec88bc3e0",
      "title": "Mashle: Magic And Muscles",
      "image": "https://image.tmdb.org/t/p/w500/yORTvQOQTZzZ9JRIpRH4QaIaQBm.jpg",
      "url": "https://watchanimeworld.in/series/mashle-magic-and-muscles/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.772361Z"
    },
    {
      "id": "24b04567fc678c12ac2f656c912cdfc0",
      "title": "Hokkaido Gals Are Super Adorable!",
      "image": "https://image.tmdb.org/t/p/w500/nCJKNJ3rtgLDAhAN5S881z8PHKU.jpg",
      "url": "https://watchanimeworld.in/series/hokkaido-gals-are-super-adorable/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.772683Z"
    },
    {
      "id": "2d022735f8524e7114aacaf036492968",
      "title": "BUCCHIGIRI?!",
      "image": "https://image.tmdb.org/t/p/w500/bhtkmLdMleHtGTq267VqhePgp5S.jpg",
      "url": "https://watchanimeworld.in/series/bucchigiri/",
      "sourcePage": "https://watchanimeworld.in/series/page/17/",
      "timestamp": "2025-10-20T17:49:43.773010Z"
    },
    {
      "id": "0f93f552ecc9809f87785502a39b215f",
      "title": "The Iceblade Sorcerer Shall Rule the World",
      "image": "https://image.tmdb.org/t/p/w500/xBlJYF8ROyYppm6RbZ1Ga8nERWs.jpg",
      "url": "https://watchanimeworld.in/series/the-iceblade-sorcerer-shall-rule-the-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.992220Z"
    },
    {
      "id": "2308e38daf5a499e42d6c6d9e95e360e",
      "title": "I Shall Survive Using Potions!",
      "image": "https://image.tmdb.org/t/p/w500/rXejTl7hZEqHEUvPFI9WBZ9B0uQ.jpg",
      "url": "https://watchanimeworld.in/series/i-shall-survive-using-potions/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.992639Z"
    },
    {
      "id": "f4561d35ad5d55663e26b101ebe2becc",
      "title": "Viral Hit",
      "image": "https://image.tmdb.org/t/p/w500/1kZBsmNYgjRxFPBfrFxkQGwS7xX.jpg",
      "url": "https://watchanimeworld.in/series/viral-hit/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.992975Z"
    },
    {
      "id": "0efc12467b8ae51a1c6421f4cbcecb6c",
      "title": "Wind Breaker",
      "image": "https://image.tmdb.org/t/p/w500/3kTFL3PAeTyS8gGZAh0iYG6NNjt.jpg",
      "url": "https://watchanimeworld.in/series/wind-breaker/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.993289Z"
    },
    {
      "id": "13b91619dff2fa07c718f42e24578ea1",
      "title": "One Piece",
      "image": "https://image.tmdb.org/t/p/w500/uiIB9ctqZFbfRXXimtpmZb5dusi.jpg",
      "url": "https://watchanimeworld.in/series/one-piece/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.993599Z"
    },
    {
      "id": "66887fdb01451eda0b260873ed080fab",
      "title": "Tsukimichi -Moonlit Fantasy-",
      "image": "https://image.tmdb.org/t/p/w500/kkWkdoB5GbVALlmNfsALh9OdsPl.jpg",
      "url": "https://watchanimeworld.in/series/tsukimichi-moonlit-fantasy/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.993920Z"
    },
    {
      "id": "0ab8cc0a99de9a794ab33a9d20e13761",
      "title": "Fire Force",
      "image": "https://image.tmdb.org/t/p/w500/xwKGTFXL2kKz6P0WI23Q2ecaGOO.jpg",
      "url": "https://watchanimeworld.in/series/fire-force/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.994225Z"
    },
    {
      "id": "926cc9cfe4d97b86238d2ec8694a03b7",
      "title": "Tokyo Revengers",
      "image": "https://image.tmdb.org/t/p/w500/arB3L9pZZBSzUPSC8BEv8c3X0bF.jpg",
      "url": "https://watchanimeworld.in/series/tokyo-revengers/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.994569Z"
    },
    {
      "id": "1e0d4d2289d51eb54748cf73ccd23e6f",
      "title": "Campfire Cooking in Another World with My Absurd Skill",
      "image": "https://image.tmdb.org/t/p/w500/dkfXGsDMPNUlbAieTbn8yQgrf4Q.jpg",
      "url": "https://watchanimeworld.in/series/campfire-cooking-in-another-world-with-my-absurd-skill/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.994905Z"
    },
    {
      "id": "32936892c16f60baa9e3ae54d6c6bfc5",
      "title": "Sword Art Online Alternative: Gun Gale Online",
      "image": "https://image.tmdb.org/t/p/w500/mkFSXuWzPemM1Ok0sBHl0SAsFbX.jpg",
      "url": "https://watchanimeworld.in/series/sword-art-online-alternative-gun-gale-online/",
      "sourcePage": "https://watchanimeworld.in/series/page/18/",
      "timestamp": "2025-10-20T17:49:44.995319Z"
    },
    {
      "id": "4c81ad663d77266f2db355fd1310cd71",
      "title": "Spy x Family",
      "image": "https://image.tmdb.org/t/p/w500/3r4LYFuXrg3G8fepysr4xSLWnQL.jpg",
      "url": "https://watchanimeworld.in/series/spy-x-family/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.271590Z"
    },
    {
      "id": "1e29539e33866323ec6dbcffc50e79dc",
      "title": "The Daily Life of the Immortal King",
      "image": "https://image.tmdb.org/t/p/w500/fR6QmzmINCDaCJ3KDM9x3o4g6RL.jpg",
      "url": "https://watchanimeworld.in/series/the-daily-life-of-the-immortal-king/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.271848Z"
    },
    {
      "id": "7c78fe35e310f04309a545228c5c8812",
      "title": "Sword Art Online",
      "image": "https://image.tmdb.org/t/p/w500/p8KOAD8CQpjnvge8v2O357uBbPj.jpg",
      "url": "https://watchanimeworld.in/series/sword-art-online/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.272074Z"
    },
    {
      "id": "f06fe42959ba8639d4312f33985e6d84",
      "title": "Dragon Ball Daima",
      "image": "https://image.tmdb.org/t/p/w500/fHJgkdisqyP4aHM9HFcDDjJJaLX.jpg",
      "url": "https://watchanimeworld.in/series/dragon-ball-daima/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.272318Z"
    },
    {
      "id": "f5bb30943df660f9505e8327ce9a47b2",
      "title": "Rurouni Kenshin (2023)",
      "image": "https://image.tmdb.org/t/p/w500/8KHxcHpsAaHCvIW6AT7TfzGgUbH.jpg",
      "url": "https://watchanimeworld.in/series/rurouni-kenshin-2023/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.272524Z"
    },
    {
      "id": "e3768fe149dcf2de44ce7098135891ec",
      "title": "Mushoku Tensei: Jobless Reincarnation",
      "image": "https://image.tmdb.org/t/p/w500/gLKOYIMyKlUHW0SVdskhgf9C0yy.jpg",
      "url": "https://watchanimeworld.in/series/mushoku-tensei-jobless-reincarnation/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.272952Z"
    },
    {
      "id": "45cd81f89516c902394e132beaa495f3",
      "title": "You are Ms. Servant",
      "image": "https://image.tmdb.org/t/p/w500/eyFOI6GkIN9JI1qaGLpEkrRlXdc.jpg",
      "url": "https://watchanimeworld.in/series/you-are-ms-servant/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.273157Z"
    },
    {
      "id": "0f9db995e3e7156b9e98357ebf990494",
      "title": "Demon Lord, Retry!",
      "image": "https://image.tmdb.org/t/p/w500/d5hXGaqit05qhYP4cqZs0BUrLG.jpg",
      "url": "https://watchanimeworld.in/series/demon-lord-retry/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.273363Z"
    },
    {
      "id": "9a8ca027e4fd53db2f63611e1fa3bc5f",
      "title": "Shangri-La Frontier",
      "image": "https://image.tmdb.org/t/p/w500/xjhFYCzH9l2j3eH7TVnj4qTam2f.jpg",
      "url": "https://watchanimeworld.in/series/shangri-la-frontier/",
      "sourcePage": "https://watchanimeworld.in/series/page/19/",
      "timestamp": "2025-10-20T17:49:46.273578Z"
    },
    {
      "id": "4aeabd969ffa32c4a2f4ab964b7bb41b",
      "title": "Lookism",
      "image": "https://image.tmdb.org/t/p/w500/qkoM63HDuCOSwxGfb0pljrgns9I.jpg",
      "url": "https://watchanimeworld.in/series/lookism/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.478291Z"
    },
    {
      "id": "b475a4bd6eb3c19f417008c5fb44c4a7",
      "title": "Trillion Game",
      "image": "https://image.tmdb.org/t/p/w500/pL4nFHx4lChRXLrJzRX0sAl8SfG.jpg",
      "url": "https://watchanimeworld.in/series/trillion-game/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.478717Z"
    },
    {
      "id": "d856a95f116892ca68443baaaeaa82f1",
      "title": "Good Bye Dragon Life",
      "image": "https://image.tmdb.org/t/p/w500/n15iwXmYASiAEWUvkfoVKEIoqWq.jpg",
      "url": "https://watchanimeworld.in/series/good-bye-dragon-life/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.479105Z"
    },
    {
      "id": "0b6f5766a102e51b8294981e944e18b5",
      "title": "365 Days to the Wedding",
      "image": "https://image.tmdb.org/t/p/w500/lMVkOrMaWEkHZLdPksKGcdi6hJg.jpg",
      "url": "https://watchanimeworld.in/series/365-days-to-the-wedding/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.479809Z"
    },
    {
      "id": "933be551cad081c12cd339a004490e57",
      "title": "Dan Da Dan",
      "image": "https://image.tmdb.org/t/p/w500/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg",
      "url": "https://watchanimeworld.in/series/dan-da-dan/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.480539Z"
    },
    {
      "id": "e6d16845bfe4fc9a36e710c4dd96fdaf",
      "title": "Assassination Classroom",
      "image": "https://image.tmdb.org/t/p/w500/qf0l0nQ2t06Es3cSXflqx6l6vsJ.jpg",
      "url": "https://watchanimeworld.in/series/assassination-classroom/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.481124Z"
    },
    {
      "id": "dccae3ec3b699c2501f769f253a7d5a2",
      "title": "I'll Become a Villainess Who Goes Down in History",
      "image": "https://image.tmdb.org/t/p/w500/lTDWs3IjKwiBz00c8bzVmrgLa3A.jpg",
      "url": "https://watchanimeworld.in/series/ill-become-a-villainess-who-goes-down-in-history/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.481810Z"
    },
    {
      "id": "20dfd4d605dfd260a4f7d98fcc808a86",
      "title": "Tying the Knot with an Amagami Sister",
      "image": "https://image.tmdb.org/t/p/w500/15xFmoqTEryUWL7kUjY1QSby8XY.jpg",
      "url": "https://watchanimeworld.in/series/tying-the-knot-with-an-amagami-sister/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.482538Z"
    },
    {
      "id": "7af86bd998455d0bac997e40fa6dfc07",
      "title": "Nina the Starry Bride",
      "image": "https://image.tmdb.org/t/p/w500/goE7QiiaRkzVLnwaODRNKarWljv.jpg",
      "url": "https://watchanimeworld.in/series/nina-the-starry-bride/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.482925Z"
    },
    {
      "id": "ff8a58e6fea7751d4eab9c22d803f666",
      "title": "Teen Titans",
      "image": "https://image.tmdb.org/t/p/w500/gxe4wIp3kYfw4QSkLMt99HfLkok.jpg",
      "url": "https://watchanimeworld.in/series/teen-titans/",
      "sourcePage": "https://watchanimeworld.in/series/page/20/",
      "timestamp": "2025-10-20T17:49:47.483308Z"
    },
    {
      "id": "0d217cd7388103b6644dc716cf8a1a34",
      "title": "Darling in the FranXX",
      "image": "https://image.tmdb.org/t/p/w500/oO5tir7lV4slZHTyhW8lTFrgyif.jpg",
      "url": "https://watchanimeworld.in/series/darling-in-the-franxx/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.733850Z"
    },
    {
      "id": "bf5d6041045460eeaeca8ad23c406f27",
      "title": "Inside Job",
      "image": "https://image.tmdb.org/t/p/w500/qwJUDMJ4i3KBYjeUFK9Js87iJEa.jpg",
      "url": "https://watchanimeworld.in/series/inside-job/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.734089Z"
    },
    {
      "id": "f6d8e641e5fb18cfc263bb64b4558629",
      "title": "The Amazing World of Gumball",
      "image": "https://image.tmdb.org/t/p/w500/VYnnyA2hyxi3VUPgCA71mMtt69.jpg",
      "url": "https://watchanimeworld.in/series/the-amazing-world-of-gumball/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.734294Z"
    },
    {
      "id": "551dca6fbb6e0c3b32b203878340b866",
      "title": "Chainsaw Man",
      "image": "https://image.tmdb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg",
      "url": "https://watchanimeworld.in/series/chainsaw-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.734488Z"
    },
    {
      "id": "3ffd9ea8d5a635d1552befe79fca7504",
      "title": "Haikyu!!",
      "image": "https://image.tmdb.org/t/p/w500/ecQ84z2sR0XapZu435MnFuEBzD8.jpg",
      "url": "https://watchanimeworld.in/series/haikyu/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.734690Z"
    },
    {
      "id": "3c06aa186e6acb1c5cb0f7ad723605b8",
      "title": "Dragon Ball",
      "image": "https://image.tmdb.org/t/p/w500/onCLyCOgszTIyyVs2XKYSkKPOPG.jpg",
      "url": "https://watchanimeworld.in/series/dragon-ball/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.734881Z"
    },
    {
      "id": "be3cf00c1f85e1a678bf577fa3d5772d",
      "title": "Log Horizon",
      "image": "https://image.tmdb.org/t/p/w500/vrCAD2KvtGJPwABIPd4z0gChi4g.jpg",
      "url": "https://watchanimeworld.in/series/log-horizon/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.735080Z"
    },
    {
      "id": "5b7ed2276d7f0813f8611e1aaab727fd",
      "title": "Vinland Saga",
      "image": "https://image.tmdb.org/t/p/w500/kuTXfeVHNKjd7ejYHEDkHF8OFpc.jpg",
      "url": "https://watchanimeworld.in/series/vinland-saga/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.735285Z"
    },
    {
      "id": "92a30e0b75e9ad12fc93d7157eb42265",
      "title": "Transformers: Rescue Bots",
      "image": "https://image.tmdb.org/t/p/w500/wtugHPxksnORftAs7EOGK3Oy0I5.jpg",
      "url": "https://watchanimeworld.in/series/transformers-rescue-bots/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.735479Z"
    },
    {
      "id": "9ea4f519c95f385d3781d3904ba4c589",
      "title": "Kim Possible",
      "image": "https://image.tmdb.org/t/p/w500/qsDNX8DPwWydDn9oUIhe1WcTuUH.jpg",
      "url": "https://watchanimeworld.in/series/kim-possible/",
      "sourcePage": "https://watchanimeworld.in/series/page/21/",
      "timestamp": "2025-10-20T17:49:48.735671Z"
    },
    {
      "id": "8207c1eb48bf4553eb766b73c6c0c4dd",
      "title": "Pokémon Horizons: The Series",
      "image": "https://image.tmdb.org/t/p/w500/amemXW39lMbNBJFRMJ5W7q9mLP2.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-horizons-the-series/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.958615Z"
    },
    {
      "id": "afaa2b23a5725004008d93b025f22741",
      "title": "No Longer Allowed in Another World",
      "image": "https://image.tmdb.org/t/p/w500/mKOeQuH7BRrd6Fu4Exx2r0rJF5b.jpg",
      "url": "https://watchanimeworld.in/series/no-longer-allowed-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.958837Z"
    },
    {
      "id": "b1fcd6bd9a13313dcc3fd46437683e61",
      "title": "VTuber Legend: How I Went Viral After Forgetting to Turn Off My Stream",
      "image": "https://image.tmdb.org/t/p/w500/c6eB42kmJWGZgKecme6jhDeNMQr.jpg",
      "url": "https://watchanimeworld.in/series/vtuber-legend-how-i-went-viral-after-forgetting-to-turn-off-my-stream/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.959059Z"
    },
    {
      "id": "d4743175b36a43a843ea80994095721b",
      "title": "Wistoria: Wand and Sword",
      "image": "https://image.tmdb.org/t/p/w500/5n0IZQA9MiXn5JBKZibtNhhFSAZ.jpg",
      "url": "https://watchanimeworld.in/series/wistoria-wand-and-sword/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.959255Z"
    },
    {
      "id": "83737f9928502109e67d51ddfb550024",
      "title": "Why Does Nobody Remember Me in This World?",
      "image": "https://image.tmdb.org/t/p/w500/u9C9lYBA6dujAaYXjxlgcEqVc1d.jpg",
      "url": "https://watchanimeworld.in/series/why-does-nobody-remember-me-in-this-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.959455Z"
    },
    {
      "id": "b71353a401da9d9b809a2f549cd406ff",
      "title": "Makeine: Too Many Losing Heroines!",
      "image": "https://image.tmdb.org/t/p/w500/oRsm8wiA9QJHT4YNpU7jzsyujAS.jpg",
      "url": "https://watchanimeworld.in/series/makeine-too-many-losing-heroines/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.959666Z"
    },
    {
      "id": "7cc90dc34810a486b5971f7917091b03",
      "title": "The Elusive Samurai",
      "image": "https://image.tmdb.org/t/p/w500/wVJjyUbns2USXo1bolF2vGanvf6.jpg",
      "url": "https://watchanimeworld.in/series/the-elusive-samurai/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.959893Z"
    },
    {
      "id": "2997b484e33826c56a8db27d1f264f4f",
      "title": "Twilight Out of Focus",
      "image": "https://image.tmdb.org/t/p/w500/21bYoggswt5hFKqqsUBLUx1smHz.jpg",
      "url": "https://watchanimeworld.in/series/twilight-out-of-focus/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.960086Z"
    },
    {
      "id": "f0407b0c0ae1e12df51db98cce203e74",
      "title": "Days with My Stepsister",
      "image": "https://image.tmdb.org/t/p/w500/vNeq9t40tzddaZls9YntaHeaVdn.jpg",
      "url": "https://watchanimeworld.in/series/days-with-my-stepsister/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.960287Z"
    },
    {
      "id": "d296024c950fd17aea71e9ec38016d08",
      "title": "Naruto",
      "image": "https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg",
      "url": "https://watchanimeworld.in/series/naruto/",
      "sourcePage": "https://watchanimeworld.in/series/page/22/",
      "timestamp": "2025-10-20T17:49:49.960486Z"
    },
    {
      "id": "ae78549426bfc7f927e360de91644042",
      "title": "Bye Bye Earth",
      "image": "https://image.tmdb.org/t/p/w500/iuo2jor1Hya3bT1imNxEScgoh5o.jpg",
      "url": "https://watchanimeworld.in/series/bye-bye-earth/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.116983Z"
    },
    {
      "id": "c504134f3f087d00b562b9385e6bf521",
      "title": "Alya Sometimes Hides Her Feelings in Russian",
      "image": "https://image.tmdb.org/t/p/w500/hfnzByZIRj6rx8xaxzS2zDilei1.jpg",
      "url": "https://watchanimeworld.in/series/alya-sometimes-hides-her-feelings-in-russian/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.117252Z"
    },
    {
      "id": "ee43f5079796d32dff08db30ec024946",
      "title": "The Strongest Magician in the Demon Lord's Army Was a Human",
      "image": "https://image.tmdb.org/t/p/w500/z0udnWYj8tXjzqYzT6MSBbZ1sMf.jpg",
      "url": "https://watchanimeworld.in/series/the-strongest-magician-in-the-demon-lords-army-was-a-human/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.117466Z"
    },
    {
      "id": "6ceeac4dad5048275333e0f0e2c6cadd",
      "title": "Black Clover",
      "image": "https://image.tmdb.org/t/p/w500/kaMisKeOoTBPxPkbC3OW7Wgt6ON.jpg",
      "url": "https://watchanimeworld.in/series/black-clover/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.117694Z"
    },
    {
      "id": "f8851536abc4803649d8d078993877e8",
      "title": "Banished from the Hero's Party I Decided to Live a Quiet Life in the Countryside",
      "image": "https://image.tmdb.org/t/p/w500/hk5qqvJLRBDaPYBc8lKkSYQrR1c.jpg",
      "url": "https://watchanimeworld.in/series/banished-from-the-heros-party-i-decided-to-live-a-quiet-life-in-the-countryside/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.117919Z"
    },
    {
      "id": "d7d6c24e380e276d185462e19ecfba7c",
      "title": "Jujutsu Kaisen",
      "image": "https://image.tmdb.org/t/p/w500/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg",
      "url": "https://watchanimeworld.in/series/jujutsu-kaisen/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.118113Z"
    },
    {
      "id": "eca57dfbd34dfb7d95d6112d571fb910",
      "title": "That Time I Got Reincarnated as a Slime",
      "image": "https://image.tmdb.org/t/p/w500/jQb1ztdko9qc4aCdnMXShcIHXRG.jpg",
      "url": "https://watchanimeworld.in/series/that-time-i-got-reincarnated-as-a-slime/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.118310Z"
    },
    {
      "id": "f611701d6f23a6af5e9ee2270fa350c6",
      "title": "Dragon Ball Z Kai",
      "image": "https://image.tmdb.org/t/p/w500/ykl67ghR2ug6KGFH3CQcI01pzQJ.jpg",
      "url": "https://watchanimeworld.in/series/dragon-ball-z-kai/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.118495Z"
    },
    {
      "id": "989e6c0f2e3e741bd93ee0913fc383c6",
      "title": "Kaiju No. 8",
      "image": "https://image.tmdb.org/t/p/w500/g4Da5pToG1E0moyaMhP4RewTBCl.jpg",
      "url": "https://watchanimeworld.in/series/kaiju-no-8/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.118669Z"
    },
    {
      "id": "3afea9023354b5bce9e6c004aa79125e",
      "title": "Gods' Games We Play",
      "image": "https://image.tmdb.org/t/p/w500/gkpFc791zeyQEO7Ds7mlnaC1cmj.jpg",
      "url": "https://watchanimeworld.in/series/gods-games-we-play/",
      "sourcePage": "https://watchanimeworld.in/series/page/23/",
      "timestamp": "2025-10-20T17:49:51.118841Z"
    },
    {
      "id": "2ed1689bda2ca5efd663ce59dd9901c3",
      "title": "Akebi's Sailor Uniform",
      "image": "https://image.tmdb.org/t/p/w500/kGMOxl3o9QNeRzAvmeDJaaxLrtV.jpg",
      "url": "https://watchanimeworld.in/series/akebis-sailor-uniform/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.284933Z"
    },
    {
      "id": "b0fad0033a4d489353d8ce42ea3944aa",
      "title": "Quality Assurance in Another World",
      "image": "https://image.tmdb.org/t/p/w500/toNVPhr8BpCbJ4LUGdiOGJpcy80.jpg",
      "url": "https://watchanimeworld.in/series/quality-assurance-in-another-world/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.285172Z"
    },
    {
      "id": "ae0a7d3701af95bdec06ddaf1f5208a6",
      "title": "Tower of God",
      "image": "https://image.tmdb.org/t/p/w500/vF62NCc1IQ0EUWvD1o9rE4X62kh.jpg",
      "url": "https://watchanimeworld.in/series/tower-of-god/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.285376Z"
    },
    {
      "id": "98a8da85440b41d01fc00fb42cf11579",
      "title": "BLUE LOCK",
      "image": "https://image.tmdb.org/t/p/w500/fT9W86KFA9Khy2hIbkfClI8IYDH.jpg",
      "url": "https://watchanimeworld.in/series/blue-lock/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.285566Z"
    },
    {
      "id": "4dfe168be8a0c3948cfa1b2fc3f95200",
      "title": "Doraemon (1979)",
      "image": "https://image.tmdb.org/t/p/w500/bHMqPDsW7Lb71CVHXq4PuEvQ4NY.jpg",
      "url": "https://watchanimeworld.in/series/doraemon/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.285756Z"
    },
    {
      "id": "2a373073e740a4e366413f9c25c7b45a",
      "title": "Shinchan",
      "image": "https://image.tmdb.org/t/p/w500/2fV83573hGUljQ2Mlly632fgUx6.jpg",
      "url": "https://watchanimeworld.in/series/shinchan/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.285939Z"
    },
    {
      "id": "b2904736c66bde0a4f85ca0998408cf4",
      "title": "BeyWheelz",
      "image": "https://image.tmdb.org/t/p/w500/8xN1xNPzvxNMZlc7c9FsNbk1wN5.jpg",
      "url": "https://watchanimeworld.in/series/beywheelz/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.286137Z"
    },
    {
      "id": "1a5c09b3c8546a04e32ac9707c802abc",
      "title": "Hoops",
      "image": "https://image.tmdb.org/t/p/w500/3umUQ5DcZe7mSZGImCAStl2FRbm.jpg",
      "url": "https://watchanimeworld.in/series/hoops/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.286322Z"
    },
    {
      "id": "6620c4bc89147d05b8c1520e26602a9c",
      "title": "BoBoiBoy",
      "image": "https://image.tmdb.org/t/p/w500/zRZ1Y90mhKXrLDYnnfJf4By8hca.jpg",
      "url": "https://watchanimeworld.in/series/boboiboy/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.286557Z"
    },
    {
      "id": "85a7f1aae3e48c73cfae24558bab97db",
      "title": "The Gutsy Frog",
      "image": "https://image.tmdb.org/t/p/w500/tINZLA1slqie76LvFDrVR7kMB0E.jpg",
      "url": "https://watchanimeworld.in/series/the-gutsy-frog/",
      "sourcePage": "https://watchanimeworld.in/series/page/24/",
      "timestamp": "2025-10-20T17:49:52.286780Z"
    },
    {
      "id": "40d9c8822fd34f0df18f7415ab11d884",
      "title": "Ben 10: Classic",
      "image": "https://image.tmdb.org/t/p/w500/eogRp6oAPK0SEvQmCrQ78LTlSdp.jpg",
      "url": "https://watchanimeworld.in/series/ben-10/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.659635Z"
    },
    {
      "id": "c0c51e6657a06396307ed5579145b2a9",
      "title": "Pacific Rim: The Black",
      "image": "https://image.tmdb.org/t/p/w500/zZyKvdT5oukcWZbcEp2G6ZlVu58.jpg",
      "url": "https://watchanimeworld.in/series/pacific-rim-the-black/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.659844Z"
    },
    {
      "id": "0c0917d89d20b9c2460153604c56ade1",
      "title": "Marvel's Ultimate Spider-Man",
      "image": "https://image.tmdb.org/t/p/w500/91hqeylCZsMLfcBuuflaVJ5w2nm.jpg",
      "url": "https://watchanimeworld.in/series/marvels-ultimate-spider-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660022Z"
    },
    {
      "id": "30936a14fed4230f63e5ee9100ebaf84",
      "title": "Ghost in the Shell: SAC_2045",
      "image": "https://image.tmdb.org/t/p/w500/tPK8BER0Pyq68IGKHrTemGlxBV4.jpg",
      "url": "https://watchanimeworld.in/series/ghost-in-the-shell-sac_2045/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660207Z"
    },
    {
      "id": "17343d81877af79768f643d8db1f40ef",
      "title": "Marvel's Spider-Man",
      "image": "https://image.tmdb.org/t/p/w500/dKdcyyHUR5WTMnrbPdYN5y9xPVp.jpg",
      "url": "https://watchanimeworld.in/series/marvels-spider-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660388Z"
    },
    {
      "id": "97ee6d923024208f9a725757257bbcc4",
      "title": "Dino Girl Gauko",
      "image": "https://image.tmdb.org/t/p/w500/cH7utN2b5YbqPTcz9p24YVUf1Za.jpg",
      "url": "https://watchanimeworld.in/series/dino-girl-gauko/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660565Z"
    },
    {
      "id": "0637b7f1252d923039835aa104634d3e",
      "title": "TRON: Uprising",
      "image": "https://image.tmdb.org/t/p/w500/9KuIDiBuWQ5VjezynTZ8YJCPBsL.jpg",
      "url": "https://watchanimeworld.in/series/tron-uprising/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660736Z"
    },
    {
      "id": "acff9ee10e8c874bccd639802709c0c3",
      "title": "The Legend of Korra",
      "image": "https://image.tmdb.org/t/p/w500/kl60aLEtfUi1O6c0N8OtrEq7hSu.jpg",
      "url": "https://watchanimeworld.in/series/the-legend-of-korra/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.660907Z"
    },
    {
      "id": "5ee943775b87749e1b6bc0dbacd3a446",
      "title": "Digimon Adventure:",
      "image": "https://image.tmdb.org/t/p/w500/7Qspx2eFX0uBSQLLlAKnYrjZgse.jpg",
      "url": "https://watchanimeworld.in/series/digimon-adventure/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.661085Z"
    },
    {
      "id": "46646c653cbe35290a8be93e3bef82a3",
      "title": "DOTA: Dragon's Blood",
      "image": "https://image.tmdb.org/t/p/w500/6Qwwam0TQEMQmFMagjtLmcQHJYs.jpg",
      "url": "https://watchanimeworld.in/series/dota-dragons-blood/",
      "sourcePage": "https://watchanimeworld.in/series/page/25/",
      "timestamp": "2025-10-20T17:49:53.661275Z"
    },
    {
      "id": "e95661ab94a35647a86c2ab3a0510424",
      "title": "Ben 10: Alien Force",
      "image": "https://image.tmdb.org/t/p/w500/sEocAE3h5iu8CUNhdx1gHan7QJf.jpg",
      "url": "https://watchanimeworld.in/series/ben-10-alien-force/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.801749Z"
    },
    {
      "id": "7de310d552dd321cd566c3204c6fb2b8",
      "title": "Ninja Hattori Returns",
      "image": "https://image.tmdb.org/t/p/w500/gt0jlGyGW11Q1HQ7AtFAvioKOV9.jpg",
      "url": "https://watchanimeworld.in/series/ninja-hattori-returns/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.801958Z"
    },
    {
      "id": "ef52f8161035b516f21bf1a0817bb023",
      "title": "Johnny Bravo",
      "image": "https://image.tmdb.org/t/p/w500/obbdeoOk8XSXzJrWGiBbaeMMSMl.jpg",
      "url": "https://watchanimeworld.in/series/johnny-bravo/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.802143Z"
    },
    {
      "id": "fe4f2f7938dfad54cf040e6273201ce0",
      "title": "Inspector Gadget",
      "image": "https://image.tmdb.org/t/p/w500/ayYkEcvuArO5mpI4Dxnqq3Z5WEQ.jpg",
      "url": "https://watchanimeworld.in/series/inspector-gadget/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.802338Z"
    },
    {
      "id": "e03013b6cc579ba36b63a13ad81676e3",
      "title": "Ninja Hattori (1981)",
      "image": "https://watchanimeworld.in/files/Poster/2775.webp",
      "url": "https://watchanimeworld.in/series/ninja-hattori-1981/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.802523Z"
    },
    {
      "id": "06d2af0ea7bc4f85caa61e9f18d98f0e",
      "title": "Disenchantment",
      "image": "https://image.tmdb.org/t/p/w500/1WynayCqKRzrl4cFZR8NOfiDwd6.jpg",
      "url": "https://watchanimeworld.in/series/disenchantment/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.802692Z"
    },
    {
      "id": "37a1e79ce8554ed7c78ea67648436182",
      "title": "Horrid Henry",
      "image": "https://image.tmdb.org/t/p/w500/7ZBlUaLeJaE66BTttAlox3fTU4u.jpg",
      "url": "https://watchanimeworld.in/series/horrid-henry/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.802881Z"
    },
    {
      "id": "9ff70d93a594097b66c3dfe7c584f780",
      "title": "Beyblade: Metal Saga",
      "image": "https://image.tmdb.org/t/p/w500/9Z247cCZOggsLoD4vY4Bg6QsH4U.jpg",
      "url": "https://watchanimeworld.in/series/beyblade-metal-saga/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.803052Z"
    },
    {
      "id": "e5c7b914af80d0854c3894ce90c673f7",
      "title": "Kid Cosmic",
      "image": "https://image.tmdb.org/t/p/w500/88HdcCMumGqGAt2kR3vVOr8NYiA.jpg",
      "url": "https://watchanimeworld.in/series/kid-cosmic/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.803219Z"
    },
    {
      "id": "0e5ad4aa52b1d623baa9dde25af9fbc2",
      "title": "He-Man and the Masters of the Universe",
      "image": "https://image.tmdb.org/t/p/w500/khU0nt0PAbX0t6IpBBvTxm1uzoZ.jpg",
      "url": "https://watchanimeworld.in/series/he-man-and-the-masters-of-the-universe/",
      "sourcePage": "https://watchanimeworld.in/series/page/26/",
      "timestamp": "2025-10-20T17:49:54.803395Z"
    },
    {
      "id": "dbf883b8cb83891998062b8cef1e0c77",
      "title": "Beyblade Burst",
      "image": "https://image.tmdb.org/t/p/w500/7gNPKHaW3VB2UlDVxpfcTQBPk9N.jpg",
      "url": "https://watchanimeworld.in/series/beyblade-burst/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.320483Z"
    },
    {
      "id": "fb28b4e95e9b864588501cd593f06450",
      "title": "The Last Kids on Earth",
      "image": "https://image.tmdb.org/t/p/w500/lTpGn2hgB0WGFGp6Q6ArkEWWTsk.jpg",
      "url": "https://watchanimeworld.in/series/the-last-kids-on-earth/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.320822Z"
    },
    {
      "id": "37bf344d9f6a0078e1f024019dd01cbf",
      "title": "Doraemon (2005)",
      "image": "https://image.tmdb.org/t/p/w500/9ZN1P32SHviL3SV51qLivxycvcx.jpg",
      "url": "https://watchanimeworld.in/series/doraemon-2005/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.320998Z"
    },
    {
      "id": "021cdde3696dd4a31be9fec9485c3c98",
      "title": "The Incredible Hulk",
      "image": "https://image.tmdb.org/t/p/w500/wa60s9NSvrH87NFCArmobnIyNnh.jpg",
      "url": "https://watchanimeworld.in/series/the-incredible-hulk/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.321164Z"
    },
    {
      "id": "8113e65e4b41428b2371bf4c0527baba",
      "title": "Super Shiro",
      "image": "https://image.tmdb.org/t/p/w500/iDYOQEXxAx3t8sJXABVSNbwQfwh.jpg",
      "url": "https://watchanimeworld.in/series/super-shiro/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.321345Z"
    },
    {
      "id": "06856233508b52370576b2fea2fba3bc",
      "title": "Blood of Zeus",
      "image": "https://image.tmdb.org/t/p/w500/zXRR5tgGLtKrRmuN4ko9SLAdCiZ.jpg",
      "url": "https://watchanimeworld.in/series/blood-of-zeus/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.321543Z"
    },
    {
      "id": "d52f5c7aa312e69aefc1541cfda15ce6",
      "title": "Wizards: Tales of Arcadia",
      "image": "https://image.tmdb.org/t/p/w500/aAMcPNLzCML40q7qmuB0jrZIcsI.jpg",
      "url": "https://watchanimeworld.in/series/wizards-tales-of-arcadia/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.321730Z"
    },
    {
      "id": "f59ea67a48ca94d0629179f1c499691e",
      "title": "Dragon Ball Super",
      "image": "https://image.tmdb.org/t/p/w500/qEUrbXJ2qt4Rg84Btlx4STOhgte.jpg",
      "url": "https://watchanimeworld.in/series/dragon-ball-super/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.321924Z"
    },
    {
      "id": "31bbf24e26a8ab58ac8b92176c877429",
      "title": "3Below: Tales of Arcadia",
      "image": "https://image.tmdb.org/t/p/w500/eWoplw8QJhSGDnhyYCrs9OugdTj.jpg",
      "url": "https://watchanimeworld.in/series/3below-tales-of-arcadia/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.322108Z"
    },
    {
      "id": "44ec4b309af31ac61dc22bb289fbc727",
      "title": "Trollhunters: Tales of Arcadia",
      "image": "https://image.tmdb.org/t/p/w500/9VZmMzINVdO3ZYGsKItU39pNO2l.jpg",
      "url": "https://watchanimeworld.in/series/trollhunters-tales-of-arcadia/",
      "sourcePage": "https://watchanimeworld.in/series/page/27/",
      "timestamp": "2025-10-20T17:49:56.322286Z"
    },
    {
      "id": "d277ebb6d2dd67e15a0bf14b5c425550",
      "title": "Dragon Ball Z",
      "image": "https://image.tmdb.org/t/p/w500/6VKOfL6ihwTiB5Vibq6QTfzhxA6.jpg",
      "url": "https://watchanimeworld.in/series/dragon-ball-z/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.563276Z"
    },
    {
      "id": "a9d8b491146d1a3a083f9e6f48476885",
      "title": "Star Trek: Lower Decks",
      "image": "https://image.tmdb.org/t/p/w500/hzwFdjfh0TvkmDEBe5orhQ95JXz.jpg",
      "url": "https://watchanimeworld.in/series/star-trek-lower-decks/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.563701Z"
    },
    {
      "id": "e355f1c2887ed23ed6b72a5df5c2990f",
      "title": "Niko and the Sword of Light",
      "image": "https://image.tmdb.org/t/p/w500/AsiXFOliQUKM6bOO4FfkGDAffko.jpg",
      "url": "https://watchanimeworld.in/series/niko-and-the-sword-of-light-2/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.564072Z"
    },
    {
      "id": "95f136cf545b73ee70c655651ab5b42e",
      "title": "Pokémon Journeys: The Series",
      "image": "https://image.tmdb.org/t/p/w500/4oTX1UCgKlMjaWY8KIdkhXZQiSA.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-journeys-the-series/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.564426Z"
    },
    {
      "id": "c9ebe5bd4024a6d03ee0664175e204a7",
      "title": "StarBeam",
      "image": "https://image.tmdb.org/t/p/w500/ijJruqW5r7YtxUfWHbcV49y8NJ8.jpg",
      "url": "https://watchanimeworld.in/series/starbeam/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.564789Z"
    },
    {
      "id": "a218d94a26b7e580ef2983c2222cc450",
      "title": "Big City Greens",
      "image": "https://image.tmdb.org/t/p/w500/buRk2Vrz8UhF5nZUOADSRZLEU1f.jpg",
      "url": "https://watchanimeworld.in/series/big-city-greens/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.565528Z"
    },
    {
      "id": "9db0969f845f8072a17bce96c6d07159",
      "title": "Timon and Pumbaa",
      "image": "https://image.tmdb.org/t/p/w500/sn9PTOwI6ktLHZcysCrP8cqOw1b.jpg",
      "url": "https://watchanimeworld.in/series/timon-and-pumbaa/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.565941Z"
    },
    {
      "id": "fae9b55b13ea2766d13e687131608021",
      "title": "Pokémon the Series: Sun & Moon",
      "image": "https://image.tmdb.org/t/p/w500/fuOpNNenRUyOA0BjvXqcdzQxo3J.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-sun-moon/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.566294Z"
    },
    {
      "id": "4ccda47b9ee311f094ff154b9955a8a2",
      "title": "Supa Strikas - Rookie Season",
      "image": "https://image.tmdb.org/t/p/w500/pwTWXcWYThMrZWuDCIKxzS2YdEA.jpg",
      "url": "https://watchanimeworld.in/series/supa-strikas/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.566661Z"
    },
    {
      "id": "b9cf1ddb5addbfce89221568df62687f",
      "title": "Jurassic World Camp Cretaceous",
      "image": "https://image.tmdb.org/t/p/w500/nkCbCmlwjwT6QL44DqG7qE9ch8H.jpg",
      "url": "https://watchanimeworld.in/series/jurassic-world-camp-cretaceous/",
      "sourcePage": "https://watchanimeworld.in/series/page/28/",
      "timestamp": "2025-10-20T17:49:57.567134Z"
    },
    {
      "id": "408599b11fbe561809d0b7862e7ba4f2",
      "title": "Pokémon the Series: XY",
      "image": "https://image.tmdb.org/t/p/w500/hxr5aqt77sSf1POYwSFFWDqgb2u.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-xy/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.697861Z"
    },
    {
      "id": "bdce51c2233a70beb8ae4abdeba7cb4d",
      "title": "Guardians of the Galaxy",
      "image": "https://image.tmdb.org/t/p/w500/oXwe3wVhdvvxiixL9UJf6PgBybZ.jpg",
      "url": "https://watchanimeworld.in/series/marvels-guardians-of-the-galaxy/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.698223Z"
    },
    {
      "id": "7e532223411cd0b141519e4420559bc1",
      "title": "American Dragon: Jake Long",
      "image": "https://image.tmdb.org/t/p/w500/sAgoJOdvuMa3DD0JDpos9bdaF9S.jpg",
      "url": "https://watchanimeworld.in/series/american-dragon-jake-long/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.698549Z"
    },
    {
      "id": "54651a0fcfed8ea83e384b1c367f25a0",
      "title": "Johnny Test",
      "image": "https://image.tmdb.org/t/p/w500/drA7JI2BqdI3sdvPIUyp2gDMkBN.jpg",
      "url": "https://watchanimeworld.in/series/johnny-test-2/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.698891Z"
    },
    {
      "id": "53be74ceb499b5bae1b61a71b00a7bd6",
      "title": "Pokémon the Series: Black & White",
      "image": "https://image.tmdb.org/t/p/w500/xU3wZY32o104FPfabra8LTjDEZ3.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-black-white/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.699204Z"
    },
    {
      "id": "9b84bc0793fde51cc5b0f962b3cf577a",
      "title": "Star Wars: The Bad Batch",
      "image": "https://image.tmdb.org/t/p/w500/cDQAvfgAqnKuklerrZylZr6PCQa.jpg",
      "url": "https://watchanimeworld.in/series/star-wars-the-bad-batch/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.699515Z"
    },
    {
      "id": "93f3fa18bc3bcb4215ede9998aa34395",
      "title": "Star Wars Resistance",
      "image": "https://image.tmdb.org/t/p/w500/xul6SG8rar3wkHPY8YusUtxcdlZ.jpg",
      "url": "https://watchanimeworld.in/series/star-wars-resistance/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.699861Z"
    },
    {
      "id": "ccae6ba39bb39ba627e002a435f43496",
      "title": "Star Wars Rebels",
      "image": "https://image.tmdb.org/t/p/w500/jmgR8330sKEJehr27rQ3bODnrlP.jpg",
      "url": "https://watchanimeworld.in/series/star-wars-rebels/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.700167Z"
    },
    {
      "id": "9e8ae3ad1fccb347bce3e11dd61c88f0",
      "title": "Pokémon the Series: Diamond and Pearl",
      "image": "https://image.tmdb.org/t/p/w500/hwRJwucYman0LnOPxpumq3uXmbP.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-diamond-and-pearl/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.700480Z"
    },
    {
      "id": "cbe179fabf4f71cb53d3903edcdff446",
      "title": "Young Justice",
      "image": "https://image.tmdb.org/t/p/w500/zMJw34G4OJhcd9NjKSRjJdDqjbR.jpg",
      "url": "https://watchanimeworld.in/series/young-justice/",
      "sourcePage": "https://watchanimeworld.in/series/page/29/",
      "timestamp": "2025-10-20T17:49:58.700848Z"
    },
    {
      "id": "b20308b9c672e32dabb1594081e0db37",
      "title": "Kick Buttowski: Suburban Daredevil",
      "image": "https://image.tmdb.org/t/p/w500/syxcG3suyf3U00z5HOuLbZ9eozl.jpg",
      "url": "https://watchanimeworld.in/series/kick-buttowski-suburban-daredevil/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.883522Z"
    },
    {
      "id": "1aadb368d2087f42bb4b25fc24249e29",
      "title": "Gravity Falls",
      "image": "https://image.tmdb.org/t/p/w500/bCPbHgdMa3kUUQ4kja7h1RAhMj2.jpg",
      "url": "https://watchanimeworld.in/series/gravity-falls/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.884158Z"
    },
    {
      "id": "f1e82ea0fbbe32b7bd1f8767131d7238",
      "title": "Marvel's Hulk and the Agents of S.M.A.S.H.",
      "image": "https://image.tmdb.org/t/p/w500/xxJbuRwU3ssxxrxrI38URtLkf6L.jpg",
      "url": "https://watchanimeworld.in/series/marvels-hulk-and-the-agents-of-s-m-a-s-h/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.884656Z"
    },
    {
      "id": "5c4e2a3b561a77b3ff842ecab0a89e88",
      "title": "Fast & Furious Spy Racers",
      "image": "https://image.tmdb.org/t/p/w500/ejqbIUDbSWlgDeCoKBFGwbFML3N.jpg",
      "url": "https://watchanimeworld.in/series/fast-furious-spy-racers/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.885219Z"
    },
    {
      "id": "fd0ad5c637b524ad280fc3eec0b8afc1",
      "title": "Oggy and the Cockroaches",
      "image": "https://image.tmdb.org/t/p/w500/aFAN9aKm0OblOr30ROejJCV8rGf.jpg",
      "url": "https://watchanimeworld.in/series/oggy-and-the-cockroaches/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.885753Z"
    },
    {
      "id": "93da0e9e0d1b7997a38e25b5a74f98c7",
      "title": "Phineas and Ferb",
      "image": "https://image.tmdb.org/t/p/w500/oSLwJMOOQGAsyJNMi4Y3MO44iAJ.jpg",
      "url": "https://watchanimeworld.in/series/phineas-and-ferb/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.886302Z"
    },
    {
      "id": "126c9f608c41fba443e390743ba9458b",
      "title": "Pokémon the Series: Ruby and Sapphire",
      "image": "https://image.tmdb.org/t/p/w500/azAGp7eYAOUqrUvdK3e3PkXdvKh.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-ruby-and-sapphire/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.886912Z"
    },
    {
      "id": "3a295f591ceae99ef1ff440e5018cd38",
      "title": "What If...?",
      "image": "https://image.tmdb.org/t/p/w500/rWg4Jk7NwVEz2BtU1aKKDoDJPeB.jpg",
      "url": "https://watchanimeworld.in/series/what-if/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.887436Z"
    },
    {
      "id": "e86cd7348a94efdbc64ab8d43b6a8961",
      "title": "Love, Death & Robots",
      "image": "https://image.tmdb.org/t/p/w500/cRiDlzzZC5lL7fvImuSjs04SUIJ.jpg",
      "url": "https://watchanimeworld.in/series/love-death-robots/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.887837Z"
    },
    {
      "id": "d84297db8a0fa2f0683069e5258eee85",
      "title": "Iron Man: Armored Adventures",
      "image": "https://image.tmdb.org/t/p/w500/lV9a5hVTrnTWkbYv1nq6fICCYUy.jpg",
      "url": "https://watchanimeworld.in/series/iron-man-armored-adventures/",
      "sourcePage": "https://watchanimeworld.in/series/page/30/",
      "timestamp": "2025-10-20T17:49:59.888270Z"
    },
    {
      "id": "9378a08a10f0c12022c7a0b9a0d13b55",
      "title": "Pokémon the Series: Gold and Silver",
      "image": "https://image.tmdb.org/t/p/w500/2xHTQQUDq0YFYylRQCOhHWZGMvJ.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-gold-and-silver/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.230651Z"
    },
    {
      "id": "5dcc33551b7031b1e6d99bedc1b2e51b",
      "title": "Iron Man",
      "image": "https://image.tmdb.org/t/p/w500/nTQWWH6CFtl37x1nPx8HRwbwvGn.jpg",
      "url": "https://watchanimeworld.in/series/iron-man/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.231058Z"
    },
    {
      "id": "ff6be56195ed131ecfa04294b3746818",
      "title": "Star Wars: Visions",
      "image": "https://image.tmdb.org/t/p/w500/6NgLGcOHscy6yLXpKCQi4Mz1yVa.jpg",
      "url": "https://watchanimeworld.in/series/star-wars-visions/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.231423Z"
    },
    {
      "id": "b720d82cf249e856fbdc36c946f5cdd2",
      "title": "Generator Rex",
      "image": "https://image.tmdb.org/t/p/w500/3F93j1Yuu9wtPO06BlPSVbLdxaP.jpg",
      "url": "https://watchanimeworld.in/series/generator-rex/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.231823Z"
    },
    {
      "id": "ac736fa603abdb7ef128c90a6fb7c3da",
      "title": "Kung Fu Panda: The Paws of Destiny",
      "image": "https://image.tmdb.org/t/p/w500/x4yvmIVuXxYKfTlgRtSJnGC1Izs.jpg",
      "url": "https://watchanimeworld.in/series/kung-fu-panda-the-paws-of-destiny/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.232560Z"
    },
    {
      "id": "0a257d233feec13970b2d8269f6cae83",
      "title": "Pokémon the Series: The Beginning",
      "image": "https://image.tmdb.org/t/p/w500/zJtki1K18iC1DhQTi7ZVbsUTviL.jpg",
      "url": "https://watchanimeworld.in/series/pokemon-the-series-the-beginning/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.233269Z"
    },
    {
      "id": "854f175d31cf3c6eaca320b0cb12e4b3",
      "title": "Avatar: The Last Airbender",
      "image": "https://image.tmdb.org/t/p/w500/9jUuxbMSp3cwC2DDrSAs2F43Ric.jpg",
      "url": "https://watchanimeworld.in/series/avatar-the-last-airbender/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.233840Z"
    },
    {
      "id": "b5adfa68f34562c32fa0b1dcb7ed3e02",
      "title": "Transformers: Robots In Disguise",
      "image": "https://image.tmdb.org/t/p/w500/pbRpKAGbXnASnNFHCGFC4CwVPla.jpg",
      "url": "https://watchanimeworld.in/series/transformers-robots-in-disguise/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.234433Z"
    },
    {
      "id": "245efaf4ffb00504bc7e004dacab651f",
      "title": "Transformers: War for Cybertron Trilogy",
      "image": "https://image.tmdb.org/t/p/w500/nuIs51TTXdLvZx2tV3ZOMAStdSW.jpg",
      "url": "https://watchanimeworld.in/series/transformers-war-for-cybertron-trilogy/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.234954Z"
    },
    {
      "id": "ec772cd194ff8e0f1025136b17c45eb5",
      "title": "Transformers: Prime",
      "image": "https://image.tmdb.org/t/p/w500/ilOKsGRHYc78R2tSMusAd3xGJWq.jpg",
      "url": "https://watchanimeworld.in/series/transformers-prime/",
      "sourcePage": "https://watchanimeworld.in/series/page/31/",
      "timestamp": "2025-10-20T17:50:01.235476Z"
    },
    {
      "id": "f0a0f56b694510e5870da23d7ba6c64b",
      "title": "Teen Titans Go!",
      "image": "https://image.tmdb.org/t/p/w500/mTMAxrRaDp0TFpdFVinD3grrqr9.jpg",
      "url": "https://watchanimeworld.in/series/teen-titans-go/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.871622Z"
    },
    {
      "id": "bfea653d2cad37ac509e34cf61866869",
      "title": "The Avengers: Earth's Mightiest Heroes",
      "image": "https://image.tmdb.org/t/p/w500/8MwwAuDy6dc1GbiBUZdvWtQczqR.jpg",
      "url": "https://watchanimeworld.in/series/https-anthe-avengers-earths-mightiest-heroes/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.872000Z"
    },
    {
      "id": "6f027fb6f6948327b3e7656533fa0c8f",
      "title": "Marvel's Future Avengers",
      "image": "https://image.tmdb.org/t/p/w500/buxBvftqx3g57FTYtdrfGSHlWfQ.jpg",
      "url": "https://watchanimeworld.in/series/future-avengers/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.872327Z"
    },
    {
      "id": "00c65dbe56a308a8c7c6bf30a3a03c76",
      "title": "Marvel's Avengers",
      "image": "https://image.tmdb.org/t/p/w500/vchDkX1DtqTy3bIDJ7YqmSbX965.jpg",
      "url": "https://watchanimeworld.in/series/avengers-assemble/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.872663Z"
    },
    {
      "id": "6612d4d5278111d8e225d99bc77b9d76",
      "title": "Slugterra",
      "image": "https://image.tmdb.org/t/p/w500/hbAHSGKr0aJStev8w5ebWWZboh1.jpg",
      "url": "https://watchanimeworld.in/series/slugterra/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.872998Z"
    },
    {
      "id": "074581603de36d49acfbe55e65f43252",
      "title": "Miraculous: Tales of Ladybug & Cat Noir",
      "image": "https://image.tmdb.org/t/p/w500/3bxuTGk0c98gQkgBcKzC6HxQ8B6.jpg",
      "url": "https://watchanimeworld.in/series/miraculous-tales-of-ladybug-cat-noir/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.873306Z"
    },
    {
      "id": "cbe5b9dd8b5ab8d14c6ef4e41842b59a",
      "title": "Ben 10: Reboot",
      "image": "https://image.tmdb.org/t/p/w500/gd0rHCpaj755YFdTLD8Quhmu1TO.jpg",
      "url": "https://watchanimeworld.in/series/ben-10-reboot/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.873635Z"
    },
    {
      "id": "fb6f4dfc72578e9c28849a09bb798edb",
      "title": "Ben 10: Omniverse",
      "image": "https://image.tmdb.org/t/p/w500/Re9I5tauOspaJxYCIqRqavKT4F.jpg",
      "url": "https://watchanimeworld.in/series/ben-10-omniverse/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.873947Z"
    },
    {
      "id": "070300ca7bdf4e9b6f662d75dae11c79",
      "title": "Ben 10: Ultimate Alien",
      "image": "https://image.tmdb.org/t/p/w500/4mk8iFUbTyUtjeYZDU5zgPm2o1s.jpg",
      "url": "https://watchanimeworld.in/series/ben-10-ultimate-alien/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.875023Z"
    },
    {
      "id": "5eea173f5ee93d734c2288d15828478f",
      "title": "Demon Slayer",
      "image": "https://image.tmdb.org/t/p/w500/mnpgxMLvUJYSXwydB5E1dqLukwy.jpg",
      "url": "https://watchanimeworld.in/series/demon-slayer/",
      "sourcePage": "https://watchanimeworld.in/series/page/32/",
      "timestamp": "2025-10-20T17:50:02.875972Z"
    },
    {
      "id": "aa65f8dc2e5fbba0369579de7603fcbc",
      "title": "My Hero Academia",
      "image": "https://image.tmdb.org/t/p/w500/phuYuzqWW9ru8EA3HVjE9W2Rr3M.jpg",
      "url": "https://watchanimeworld.in/series/my-hero-academia/",
      "sourcePage": "https://watchanimeworld.in/series/page/33/",
      "timestamp": "2025-10-20T17:50:04.044854Z"
    },
    {
      "id": "8e695cf27ad1f5af809db73b53cbe5ea",
      "title": "Kid vs. Kat",
      "image": "https://image.tmdb.org/t/p/w500/1f3DyCY4Xe6ZxN2blj0gNdWhS71.jpg",
      "url": "https://watchanimeworld.in/series/kid-vs-kat/",
      "sourcePage": "https://watchanimeworld.in/series/page/33/",
      "timestamp": "2025-10-20T17:50:04.045248Z"
    },
    {
      "id": "3ae112136c254dcb3bc2fd438cabe3a9",
      "title": "Transformers: Rescue Bots Academy",
      "image": "https://image.tmdb.org/t/p/w500/osq5D28OW66VjwO4jjtxU5JarRv.jpg",
      "url": "https://watchanimeworld.in/series/transformers-rescue-bots-academy/",
      "sourcePage": "https://watchanimeworld.in/series/page/33/",
      "timestamp": "2025-10-20T17:50:04.045702Z"
    }
  ]
}

// API Statistics
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  anilistRequests: 0
};

// SOURCES configuration
const SOURCES = [
  {
    name: 'satoru.one',
    baseUrl: 'https://satoru.one',
    searchUrl: 'https://satoru.one/filter?keyword=',
    patterns: []
  },
  {
    name: 'watchanimeworld.in',
    baseUrl: 'https://watchanimeworld.in',
    searchUrl: 'https://watchanimeworld.in/?s=',
    patterns: [
      '/episode/{slug}-{season}x{episode}/',
      '/episode/{slug}-episode-{episode}/',
      '/{slug}-episode-{episode}/',
      '/movies/{slug}/',
      '/series/{slug}/'
    ]
  }
];

// Headers function
function getHeaders(referer = 'https://google.com') {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': referer,
    'Cache-Control': 'max-age=0'
  };
}

// AniList function
async function getAnimeTitleFromAniList(anilistId) {
  try {
    apiStats.anilistRequests++;
    
    const ANILIST_API = 'https://graphql.anilist.co';
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
        }
      }
    `;

    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id: parseInt(anilistId) }
    }, { 
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.data?.Media) {
      const media = response.data.data.Media;
      const titles = [
        media.title.english,
        media.title.romaji, 
        media.title.native,
        ...(media.synonyms || [])
      ].filter(Boolean);
      
      return {
        primary: media.title.english || media.title.romaji,
        all: titles
      };
    }
    throw new Error('Anime not found on AniList');
  } catch (err) {
    console.error('AniList error:', err.message);
    throw new Error(`AniList: ${err.message}`);
  }
}

// Satoru scraping function
async function findSatoruEpisode(animeTitle, episodeNum) {
  try {
    console.log(`🎯 Satoru: Searching for "${animeTitle}" episode ${episodeNum}`);
    
    const cleanTitle = animeTitle
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    
    const searchUrl = `https://satoru.one/filter?keyword=${encodeURIComponent(cleanTitle)}`;
    
    const searchResponse = await axios.get(searchUrl, {
      headers: getHeaders('https://satoru.one'),
      timeout: 15000
    });

    const $ = cheerio.load(searchResponse.data);
    let animeId = null;
    let bestMatch = null;
    let bestScore = 0;
    
    $('.flw-item, .film_list-wrap .flw-item, .film_list-wrap > div').each((i, el) => {
      const name = $(el).find('.film-name a, .film-detail-fix-title a, .film-name').text().trim();
      const dataId = $(el).find('.film-poster-ahref, .film-poster a, a.film-poster').attr('data-id') || 
                    $(el).find('a').first().attr('href')?.split('/').pop();
      
      if (name && dataId) {
        const nameLower = name.toLowerCase();
        const searchLower = cleanTitle;
        
        let score = 0;
        if (nameLower.includes(searchLower)) score += 10;
        if (nameLower === searchLower) score += 5;
        if (nameLower.startsWith(searchLower)) score += 3;
        
        if (score > bestScore) {
          bestScore = score;
          animeId = dataId;
          bestMatch = name;
        }
      }
    });

    if (!animeId) throw new Error(`Anime not found - searched: "${cleanTitle}"`);
    console.log(`✅ Satoru found: "${bestMatch}" (ID: ${animeId})`);

    // Get episode list
    const episodeUrl = `https://satoru.one/ajax/episode/list/${animeId}`;
    const episodeResponse = await axios.get(episodeUrl, {
      headers: getHeaders('https://satoru.one'),
      timeout: 15000
    });

    if (!episodeResponse.data.html) {
      throw new Error('No episode list returned');
    }

    const $$ = cheerio.load(episodeResponse.data.html);
    let epId = null;
    
    $$('.ep-item, .eps-item, li').each((i, el) => {
      const num = $$(el).attr('data-number') || $$(el).find('.episode-num').text().match(/\d+/)?.[0];
      const id = $$(el).attr('data-id') || $$(el).find('a').attr('data-id');
      if (num && id && parseInt(num) === parseInt(episodeNum)) {
        epId = id;
        return false;
      }
    });

    if (!epId) throw new Error(`Episode ${episodeNum} not found`);

    // Get servers
    const serversUrl = `https://satoru.one/ajax/episode/servers?episodeId=${epId}`;
    const serversResponse = await axios.get(serversUrl, {
      headers: getHeaders('https://satoru.one'),
      timeout: 15000
    });

    const $$$ = cheerio.load(serversResponse.data.html);
    let serverSourceId = null;
    
    $$$('.server-item, .server-select option').each((i, el) => {
      const serverId = $$$(el).attr('data-id') || $$$(el).attr('value');
      const serverName = $$$(el).text().toLowerCase();
      
      if (serverId && !serverSourceId) {
        if (serverName.includes('vidstream') || serverName.includes('gogo') || i === 0) {
          serverSourceId = serverId;
        }
      }
    });

    if (!serverSourceId) {
      const firstServer = $$$('.server-item, .server-select option').first();
      serverSourceId = firstServer.attr('data-id') || firstServer.attr('value');
    }

    if (!serverSourceId) throw new Error('No server source ID found');

    // Get source URL
    const sourceUrl = `https://satoru.one/ajax/episode/sources?id=${serverSourceId}`;
    const sourceResponse = await axios.get(sourceUrl, {
      headers: getHeaders('https://satoru.one'),
      timeout: 15000
    });

    if (!sourceResponse.data || !sourceResponse.data.link) {
      throw new Error('No source link available');
    }
    
    const iframeUrl = sourceResponse.data.link;
    
    if (iframeUrl.toLowerCase().includes('youtube') || iframeUrl.toLowerCase().includes('youtu.be')) {
      throw new Error('YouTube source filtered out');
    }

    console.log(`🎬 Satoru iframe URL found: ${iframeUrl}`);

    return {
      url: iframeUrl,
      servers: [{
        name: 'Satoru Stream',
        url: iframeUrl,
        type: 'iframe',
        server: 'Satoru'
      }],
      source: 'satoru.one',
      valid: true
    };

  } catch (err) {
    console.error(`💥 Satoru error: ${err.message}`);
    throw new Error(`Satoru: ${err.message}`);
  }
}

// AnimeWorld scraping function
async function findAnimeWorldEpisode(animeTitle, season, episode, sourceName) {
  const source = SOURCES.find(s => s.name === sourceName);
  if (!source) return null;

  try {
    console.log(`🔍 ${source.name}: Searching for "${animeTitle}" S${season}E${episode}`);
    
    const searchTitle = animeTitle
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const searchUrl = `${source.searchUrl}${encodeURIComponent(searchTitle)}`;
    const searchResponse = await axios.get(searchUrl, {
      headers: getHeaders(source.baseUrl),
      timeout: 15000
    });

    const $ = cheerio.load(searchResponse.data);
    let slug = null;
    let foundTitle = null;
    let foundUrl = null;
    
    $('.item, .post, .anime-card, article, .film-list, .series-item, .result-item, .search-result').each((i, el) => {
      const $el = $(el);
      const title = $el.find('h3, h2, .title, a, .name, .entry-title, .film-name').first().text().trim();
      const url = $el.find('a').first().attr('href');
      
      if (title && url) {
        const titleLower = title.toLowerCase();
        const searchLower = searchTitle.toLowerCase();
        
        if (titleLower.includes(searchLower) || 
            searchLower.includes(titleLower) ||
            titleLower.replace(/[^\w]/g, '').includes(searchLower.replace(/[^\w]/g, ''))) {
          
          foundTitle = title;
          foundUrl = url;
          
          const slugMatch = url.match(/\/(anime|series|movies)\/([^\/]+)/) || 
                           url.match(/\/([^\/]+)-episode/) ||
                           url.match(/\/([^\/]+)$/);
          
          if (slugMatch) {
            slug = slugMatch[2] || slugMatch[1];
            console.log(`✅ ${source.name} found: "${title}" -> ${slug}`);
            return false;
          }
        }
      }
    });

    if (!slug && foundUrl) {
      slug = foundUrl.split('/').filter(Boolean).pop();
      console.log(`🔄 ${source.name} using fallback slug: ${slug}`);
    }

    if (!slug) throw new Error('Anime not found in search results');

    // Try direct URL first
    if (foundUrl && !foundUrl.includes('/page/') && !foundUrl.includes('/search/')) {
      console.log(`🔗 ${source.name} trying direct URL: ${foundUrl}`);
      try {
        const directData = await tryEpisodeUrl(foundUrl, source.baseUrl);
        if (directData && directData.servers.length > 0) {
          return {
            ...directData,
            source: source.name,
            usedPattern: 'direct'
          };
        }
      } catch (error) {
        console.log(`❌ Direct URL failed: ${error.message}`);
      }
    }

    // Try all patterns
    for (const pattern of source.patterns) {
      try {
        const url = buildEpisodeUrl(pattern, slug, season, episode, source.baseUrl);
        console.log(`🔗 ${source.name} trying pattern: ${url}`);
        
        const episodeData = await tryEpisodeUrl(url, source.baseUrl);
        if (episodeData && episodeData.servers.length > 0) {
          return {
            ...episodeData,
            source: source.name,
            usedPattern: pattern
          };
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('No working episodes found with any pattern');

  } catch (err) {
    console.error(`💥 ${source.name} error: ${err.message}`);
    throw new Error(`${source.name}: ${err.message}`);
  }
}

// Helper functions
function buildEpisodeUrl(pattern, slug, season, episode, baseUrl) {
  let url = pattern
    .replace('{slug}', slug)
    .replace('{season}', season)
    .replace('{episode}', episode);
  
  url = url.replace(/([^:]\/)\/+/g, '$1');
  
  return url.startsWith('http') ? url : baseUrl + url;
}

async function tryEpisodeUrl(url, baseUrl) {
  try {
    const response = await axios.get(url, {
      headers: getHeaders(baseUrl),
      timeout: 15000,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    if (response.data.includes('404') || 
        response.data.includes('Not Found') || 
        response.data.includes('Page Not Found')) {
      throw new Error('Page not found');
    }

    const $ = cheerio.load(response.data);
    const servers = extractAllServers($, baseUrl);
    
    const filteredServers = servers.filter(server => 
      server.url && 
      !server.url.toLowerCase().includes('youtube') && 
      !server.url.toLowerCase().includes('youtu.be') &&
      server.url.startsWith('http')
    );
    
    if (filteredServers.length === 0) {
      throw new Error('No valid servers found on page');
    }
    
    console.log(`✅ Found ${filteredServers.length} servers`);

    return {
      url: url,
      servers: filteredServers,
      valid: true
    };

  } catch (error) {
    throw new Error(`URL failed: ${error.message}`);
  }
}

function extractAllServers($, baseUrl) {
  const servers = [];
  
  // Extract iframes
  $('iframe').each((i, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src');
    if (src) {
      src = normalizeUrl(src, baseUrl);
      if (src && src.startsWith('http')) {
        servers.push({
          name: `Server ${i + 1}`,
          url: src,
          type: 'iframe',
          server: detectServerType(src)
        });
      }
    }
  });

  // Extract video elements
  $('video source').each((i, el) => {
    let src = $(el).attr('src');
    if (src) {
      src = normalizeUrl(src, baseUrl);
      if (src && src.startsWith('http') && !src.includes('youtube')) {
        servers.push({
          name: `Direct Video ${i + 1}`,
          url: src,
          type: 'direct',
          server: 'Direct'
        });
      }
    }
  });

  return servers;
}

function normalizeUrl(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  if (url.startsWith('http')) return url;
  return baseUrl + url;
}

function detectServerType(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('streamtape')) return 'StreamTape';
  if (urlLower.includes('dood')) return 'DoodStream';
  if (urlLower.includes('filemoon')) return 'FileMoon';
  if (urlLower.includes('mp4upload')) return 'Mp4Upload';
  if (urlLower.includes('vidstream')) return 'VidStream';
  if (urlLower.includes('voe')) return 'Voe';
  if (urlLower.includes('satoru')) return 'Satoru';
  if (urlLower.includes('gogo')) return 'Gogo';
  return 'Direct';
}

// Parallel source search
async function searchAllSourcesParallel(animeTitle, season, episode) {
  const promises = [];
  
  for (const source of SOURCES) {
    const promise = (async () => {
      try {
        console.log(`🚀 Starting search on ${source.name} for "${animeTitle}"`);
        if (source.name === 'satoru.one') {
          return await findSatoruEpisode(animeTitle, episode);
        } else {
          return await findAnimeWorldEpisode(animeTitle, season, episode, source.name);
        }
      } catch (error) {
        console.log(`❌ ${source.name} failed: ${error.message}`);
        return null;
      }
    })();
    
    promises.push(promise);
  }

  console.log(`⏳ Waiting for ${promises.length} sources to complete...`);
  const results = await Promise.allSettled(promises);
  
  // Find first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✅ Found working source: ${result.value.source}`);
      return result.value;
    }
  }
  
  console.log(`❌ All sources failed for "${animeTitle}"`);
  return null;
}

// Frontend HTML
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime Streaming API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #0f0f0f; color: white; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #333; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
        .anime-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        .anime-card { background: #1a1a1a; border-radius: 8px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; border: 1px solid #333; }
        .anime-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .anime-image { width: 100%; height: 280px; object-fit: cover; }
        .anime-info { padding: 15px; }
        .anime-title { font-size: 1rem; font-weight: bold; margin-bottom: 10px; height: 40px; overflow: hidden; }
        .watch-btn { display: block; width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; text-align: center; text-decoration: none; transition: background 0.3s ease; }
        .watch-btn:hover { background: #764ba2; }
        .api-endpoints { background: #1a1a1a; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #333; }
        .endpoint { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
        .endpoint-method { display: inline-block; padding: 5px 10px; background: #667eea; border-radius: 3px; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Anime Streaming API</h1>
            <p>Stream anime from multiple sources with high quality servers</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="totalAnime">${ANIME_DATA.data.length}</div>
                <div>Total Anime</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalRequests">0</div>
                <div>Total Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="successRate">100%</div>
                <div>Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${SOURCES.length}</div>
                <div>Sources</div>
            </div>
        </div>

        <h2>📺 Available Anime</h2>
        <div class="anime-grid" id="animeGrid">
            <!-- Anime cards will be populated here -->
        </div>

        <div class="api-endpoints">
            <h2>🔗 API Endpoints</h2>
            <div class="endpoint">
                <span class="endpoint-method">GET</span>
                <code>/api/anime/:anilistId/:season/:episode</code>
                <p>Stream using AniList ID (supports json parameter)</p>
            </div>
            <div class="endpoint">
                <span class="endpoint-method">GET</span>
                <code>/api/stream/:name/:season/:episode</code>
                <p>Stream using anime name (supports json parameter)</p>
            </div>
            <div class="endpoint">
                <span class="endpoint-method">GET</span>
                <code>/api/discover/all</code>
                <p>Get all available anime data</p>
            </div>
            <div class="endpoint">
                <span class="endpoint-method">GET</span>
                <code>/api/random</code>
                <p>Get a random anime episode</p>
            </div>
            <div class="endpoint">
                <span class="endpoint-method">GET</span>
                <code>/health</code>
                <p>API health and statistics</p>
            </div>
        </div>
    </div>

    <script>
        // Populate anime grid
        const animeGrid = document.getElementById('animeGrid');
        const animeData = ${JSON.stringify(ANIME_DATA.data)};

        animeData.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.innerHTML = \`
                <img src="\${anime.image}" alt="\${anime.title}" class="anime-image" onerror="this.src='https://via.placeholder.com/200x280/333/fff?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title">\${anime.title}</div>
                    <a href="/api/stream/\${encodeURIComponent(anime.title)}/1/1" class="watch-btn" target="_blank">
                        Watch Episode 1
                    </a>
                </div>
            \`;
            animeGrid.appendChild(card);
        });

        // Update stats
        async function updateStats() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                document.getElementById('totalRequests').textContent = data.total_requests;
                document.getElementById('successRate').textContent = data.success_rate;
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }

        // Update stats every 30 seconds
        updateStats();
        setInterval(updateStats, 30000);
    </script>
</body>
</html>
`;

// API Endpoints
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(FRONTEND_HTML);
});

app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { anilistId, season, episode } = req.params;
    const { json, clean } = req.query;

    console.log(`\n⚡ AniList Stream: ID ${anilistId} S${season}E${episode}`);
    apiStats.totalRequests++;

    const titleData = await getAnimeTitleFromAniList(anilistId);
    console.log(`✅ AniList Data: "${titleData.primary}"`);
    
    const searchTitles = [
      titleData.primary,
      ...titleData.all.filter(t => t && t.length > 1)
    ].slice(0, 5);

    let episodeData = null;
    let usedSource = '';
    let usedTitle = '';

    for (const title of searchTitles) {
      if (episodeData) break;
      
      try {
        console.log(`🎯 Searching with: "${title}"`);
        const data = await searchAllSourcesParallel(title, season, episode);
        if (data) {
          episodeData = data;
          usedSource = data.source;
          usedTitle = title;
          console.log(`✅ SUCCESS: Found on ${usedSource} with "${title}"`);
          break;
        }
      } catch (error) {
        console.log(`❌ Search failed with "${title}": ${error.message}`);
      }
    }

    if (!episodeData) {
      apiStats.failedRequests++;
      const responseTime = Date.now() - startTime;
      return res.status(404).json({ 
        error: 'No anime found on any source',
        anime_title: titleData.primary,
        anilist_id: anilistId,
        response_time: `${responseTime}ms`,
        sources_tried: SOURCES.map(s => s.name),
        searched_titles: searchTitles
      });
    }

    apiStats.successfulRequests++;
    const responseTime = Date.now() - startTime;

    if (clean !== 'false') {
      return sendCleanIframe(res, episodeData.servers[0].url, titleData.primary, season, episode);
    }

    if (json) {
      return res.json({
        success: true,
        anilist_id: parseInt(anilistId),
        title: titleData.primary,
        season: parseInt(season),
        episode: parseInt(episode),
        source: usedSource,
        matched_title: usedTitle,
        servers: episodeData.servers,
        total_servers: episodeData.servers.length,
        response_time: `${responseTime}ms`
      });
    }

    return sendEnhancedPlayer(res, titleData.primary, season, episode, 
                            episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 AniList endpoint error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ 
      error: error.message,
      response_time: `${responseTime}ms`
    });
  }
});

app.get('/api/stream/:name/:season/:episode', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { name, season, episode } = req.params;
    const { json, clean } = req.query;

    console.log(`\n🎬 Stream: ${name} S${season}E${episode}`);
    apiStats.totalRequests++;

    const titleVariations = [
      name,
      name.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim(),
      name.replace(/season\s*\d+/i, '').trim(),
      name.replace(/movie:/i, '').replace(/the movie/i, '').trim()
    ].filter((title, index, self) => 
      title && self.indexOf(title) === index
    );

    let episodeData = null;
    let usedTitle = '';

    for (const title of titleVariations) {
      if (episodeData) break;
      
      try {
        console.log(`🎯 Trying title variation: "${title}"`);
        const data = await searchAllSourcesParallel(title, season, episode);
        if (data) {
          episodeData = data;
          usedTitle = title;
          console.log(`✅ SUCCESS: Found with variation "${title}"`);
          break;
        }
      } catch (error) {
        console.log(`❌ Variation failed: ${error.message}`);
      }
    }

    if (!episodeData) {
      apiStats.failedRequests++;
      const responseTime = Date.now() - startTime;
      return res.status(404).json({ 
        error: 'No streaming sources found',
        searched_name: name,
        response_time: `${responseTime}ms`,
        sources_tried: SOURCES.map(s => s.name),
        title_variations: titleVariations
      });
    }

    apiStats.successfulRequests++;
    const responseTime = Date.now() - startTime;

    if (clean !== 'false') {
      return sendCleanIframe(res, episodeData.servers[0].url, name, season, episode);
    }

    if (json) {
      return res.json({
        success: true,
        title: name,
        season: parseInt(season),
        episode: parseInt(episode),
        source: episodeData.source,
        matched_title: usedTitle,
        servers: episodeData.servers,
        response_time: `${responseTime}ms`
      });
    }

    return sendEnhancedPlayer(res, name, season, episode, 
                            episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Stream error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ 
      error: error.message,
      response_time: `${responseTime}ms`,
      searched_name: req.params.name
    });
  }
});

// Player functions
function sendEnhancedPlayer(res, title, season, episode, videoUrl, servers = []) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { overflow: hidden; background: #000; width: 100vw; height: 100vh; font-family: Arial, sans-serif; }
        .player-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; }
        iframe { width: 100%; height: 100%; border: none; background: #000; }
        .player-info { position: fixed; top: 15px; left: 15px; background: rgba(0,0,0,0.85); color: white; padding: 10px 15px; border-radius: 8px; z-index: 1000; font-size: 14px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); max-width: 300px; }
        .server-list { position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 8px; z-index: 1000; font-size: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
        .server-item { padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .server-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="player-info">🎬 ${title} - S${season}E${episode}</div>
        <div class="server-list">
            <div style="margin-bottom: 10px; font-weight: bold;">📡 Available Servers:</div>
            ${servers.map((server, index) => 
                `<div class="server-item">${index + 1}. ${server.name} (${server.server})</div>`
            ).join('')}
        </div>
        <iframe 
            src="${videoUrl}" 
            allow="autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture" 
            allowfullscreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            loading="eager">
        </iframe>
    </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

function sendCleanIframe(res, url, title = 'Player', season = 1, episode = 1) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body,html { margin:0; padding:0; overflow:hidden; background:#000; width:100vw; height:100vh; }
        iframe { width:100%; height:100%; border:none; position:fixed; top:0; left:0; background:#000; }
    </style>
</head>
<body>
    <iframe 
        src="${url}" 
        allow="autoplay; fullscreen; encrypted-media" 
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="eager">
    </iframe>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Additional API endpoints
app.get('/api/discover/all', async (req, res) => {
  try {
    res.json({
      success: true,
      total: ANIME_DATA.data.length,
      anime: ANIME_DATA.data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/random', async (req, res) => {
  try {
    const { player } = req.query;
    
    const randomAnime = ANIME_DATA.data[Math.floor(Math.random() * ANIME_DATA.data.length)];
    const randomEpisode = Math.floor(Math.random() * 12) + 1;
    
    console.log(`🎲 Random: "${randomAnime.title}" Episode ${randomEpisode}`);

    const episodeData = await searchAllSourcesParallel(randomAnime.title, 1, randomEpisode);
    
    const result = {
      anime: randomAnime.title,
      season: 1,
      episode: randomEpisode,
      image: randomAnime.image,
      source: episodeData?.source || 'random',
      success: true
    };

    if (episodeData) {
      result.stream_url = episodeData.servers[0]?.url;
    }

    if (player === 'true' && episodeData) {
      return sendEnhancedPlayer(res, randomAnime.title, 1, randomEpisode, 
                               episodeData.servers[0].url, episodeData.servers);
    }
    
    res.json(result);
  } catch (error) {
    res.json({
      anime: 'One Piece',
      season: 1,
      episode: 1,
      image: 'https://image.tmdb.org/t/p/w500/uiIB9ctqZFbfRXXimtpmZb5dusi.jpg',
      stream_url: '/api/stream/One Piece/1/1',
      source: 'fallback',
      success: true
    });
  }
});

app.get('/health', (req, res) => {
  const successRate = apiStats.totalRequests > 0 ? 
    Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0;
    
  res.json({ 
    status: 'active', 
    version: '1.0.0',
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    success_rate: successRate + '%',
    total_anime: ANIME_DATA.data.length,
    sources: SOURCES.map(s => s.name)
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🎉 ANIME STREAMING API - ES MODULE VERSION
───────────────────────────────────────────
✅ Now using ES Module syntax (import/export)
✅ Includes "Let This Grieving Soul Retire"
✅ Fixed the require() error

🚀 Server running on: http://localhost:${PORT}
📺 Test the new anime: http://localhost:${PORT}/api/stream/Let This Grieving Soul Retire/1/1

✨ Features:
• Complete anime streaming API
• Beautiful frontend
• Multiple sources
• Random episodes
• Health monitoring
───────────────────────────────────────────
  `);
});
