
// ===================== DATA =====================
let BOOKS=[
  {id:0,title:"The Midnight Throne",author:"Elena Rivers",genre:"Fantasy",pages:428,rating:4.8,progress:64,status:"reading",currentChapter:2,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%231a0342'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%232d0b6b'/%3E%3Ccircle cx='90' cy='95' r='42' fill='none' stroke='%237c3aed' stroke-width='3' opacity='0.8'/%3E%3Ccircle cx='90' cy='95' r='22' fill='%237c3aed' opacity='0.3'/%3E%3Ccircle cx='90' cy='95' r='9' fill='%23a78bfa'/%3E%3Cpath d='M72 85 L90 58 L108 85 L90 80Z' fill='%23f59e0b' opacity='0.9'/%3E%3Crect x='28' y='157' width='124' height='18' rx='3' fill='%23a78bfa' opacity='0.9'/%3E%3Crect x='48' y='182' width='84' height='10' rx='2' fill='%23a78bfa' opacity='0.5'/%3E%3Crect x='62' y='198' width='56' height='8' rx='2' fill='%23a78bfa' opacity='0.3'/%3E%3C/svg%3E",
   description:"A dark fantasy epic where kingdoms of shadow and light wage eternal war for the Midnight Throne—a seat of power that grants dominion over death.",
   chapters:[{title:"The Awakening",words:3200,done:true},{title:"Shadows Converge",words:2800,done:true},{title:"The Dark Court",words:3600,done:false},{title:"Ember and Ash",words:3100,done:false},{title:"The Final Throne",words:4200,done:false}]},
  {id:1,title:"Stellar Archives",author:"Marcus Chen",genre:"Sci-Fi",pages:512,rating:4.6,progress:27,status:"reading",currentChapter:1,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%230a1628'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%230f2040'/%3E%3Ccircle cx='90' cy='88' r='38' fill='none' stroke='%2306b6d4' stroke-width='2' opacity='0.6'/%3E%3Ccircle cx='90' cy='88' r='22' fill='none' stroke='%2306b6d4' stroke-width='2' opacity='0.4'/%3E%3Ccircle cx='90' cy='88' r='7' fill='%2306b6d4'/%3E%3Ccircle cx='58' cy='68' r='3' fill='white' opacity='0.8'/%3E%3Ccircle cx='122' cy='60' r='2' fill='white' opacity='0.6'/%3E%3Ccircle cx='112' cy='108' r='2' fill='white' opacity='0.5'/%3E%3Ccircle cx='63' cy='112' r='3' fill='white' opacity='0.7'/%3E%3Crect x='28' y='155' width='124' height='18' rx='3' fill='%2306b6d4' opacity='0.9'/%3E%3Crect x='48' y='179' width='84' height='10' rx='2' fill='%2306b6d4' opacity='0.5'/%3E%3C/svg%3E",
   description:"In 2387, a lone archivist discovers an alien data cache holding blueprints of every civilization that has ever existed—and those yet to come.",
   chapters:[{title:"Signal from Kepler",words:2900,done:true},{title:"The Archive Speaks",words:3400,done:false},{title:"First Contact Protocol",words:3100,done:false},{title:"The Blueprint",words:2800,done:false},{title:"Humanity's Code",words:3900,done:false}]},
  {id:2,title:"The Glass Cipher",author:"Sandra Voss",genre:"Thriller",pages:356,rating:4.5,progress:0,status:"unread",currentChapter:0,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%230f1515'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%23101c1c'/%3E%3Cpath d='M90 42 L42 118 L90 98 L138 118Z' fill='none' stroke='%2306b6d4' stroke-width='2' opacity='0.6'/%3E%3Ccircle cx='90' cy='88' r='18' stroke='%2306b6d4' stroke-width='2' fill='%23061616'/%3E%3Cline x1='82' y1='84' x2='98' y2='84' stroke='%2306b6d4' stroke-width='2'/%3E%3Cline x1='90' y1='76' x2='90' y2='92' stroke='%2306b6d4' stroke-width='2'/%3E%3Crect x='28' y='155' width='124' height='18' rx='3' fill='%2306b6d4' opacity='0.9'/%3E%3Crect x='48' y='179' width='84' height='10' rx='2' fill='%2306b6d4' opacity='0.5'/%3E%3C/svg%3E",
   description:"A cryptographer receives encoded messages from a dead spy—and deciphering them might be the only way to prevent World War III.",
   chapters:[{title:"The First Cipher",words:3000,done:false},{title:"Dead Drops",words:2700,done:false},{title:"The Source",words:3200,done:false},{title:"Running Dark",words:2900,done:false},{title:"Final Decode",words:3800,done:false}]},
  {id:3,title:"Lost Meridian",author:"James Hartley",genre:"Adventure",pages:390,rating:4.7,progress:100,status:"completed",currentChapter:4,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%232a1a00'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%23331f00'/%3E%3Ccircle cx='90' cy='88' r='44' fill='none' stroke='%23f59e0b' stroke-width='2' opacity='0.6'/%3E%3Ccircle cx='90' cy='88' r='5' fill='%23f59e0b'/%3E%3Cline x1='90' y1='47' x2='90' y2='58' stroke='%23f59e0b' stroke-width='2'/%3E%3Cline x1='90' y1='118' x2='90' y2='129' stroke='%23f59e0b' stroke-width='2'/%3E%3Cline x1='49' y1='88' x2='60' y2='88' stroke='%23f59e0b' stroke-width='2'/%3E%3Cline x1='120' y1='88' x2='131' y2='88' stroke='%23f59e0b' stroke-width='2'/%3E%3Crect x='28' y='155' width='124' height='18' rx='3' fill='%23f59e0b' opacity='0.9'/%3E%3Crect x='48' y='179' width='84' height='10' rx='2' fill='%23f59e0b' opacity='0.5'/%3E%3C/svg%3E",
   description:"A disgraced cartographer follows lost coordinates across five continents to find an island that erases memories—and discovers she herself is the map.",
   chapters:[{title:"Coordinates Unknown",words:3100,done:true},{title:"Island of Echoes",words:2800,done:true},{title:"The Memory Tide",words:3300,done:true},{title:"The Grand Traversal",words:2700,done:true},{title:"Home is a Compass",words:3600,done:true}]},
  {id:4,title:"Echo Protocol",author:"Nix Patel",genre:"Sci-Fi",pages:464,rating:4.9,progress:0,status:"unread",currentChapter:0,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%23120028'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%231a003a'/%3E%3Crect x='28' y='52' width='124' height='2' rx='1' fill='%23ec4899' opacity='0.6'/%3E%3Crect x='28' y='66' width='94' height='2' rx='1' fill='%23a78bfa' opacity='0.5'/%3E%3Crect x='28' y='80' width='114' height='2' rx='1' fill='%23ec4899' opacity='0.4'/%3E%3Ccircle cx='90' cy='112' r='27' fill='none' stroke='%23ec4899' stroke-width='2'/%3E%3Cpath d='M78 112 L88 102 L88 112 L102 112 L92 122 L92 112Z' fill='%23ec4899' opacity='0.9'/%3E%3Crect x='28' y='155' width='124' height='18' rx='3' fill='%23ec4899' opacity='0.9'/%3E%3Crect x='48' y='179' width='84' height='10' rx='2' fill='%23a78bfa' opacity='0.5'/%3E%3C/svg%3E",
   description:"When underground hacker Kira Sato discovers every human mind is connected through invisible signals, she must choose between freedom and the end of loneliness.",
   chapters:[{title:"The Signal",words:2800,done:false},{title:"Neural Grid",words:3100,done:false},{title:"Ghost in the Wire",words:3400,done:false},{title:"Protocol Zero",words:2900,done:false},{title:"Echo Infinite",words:4100,done:false}]},
  {id:5,title:"The Crimson Veil",author:"Isabelle Moore",genre:"Romance",pages:318,rating:4.4,progress:88,status:"reading",currentChapter:3,
   cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%23200010'/%3E%3Crect x='8' y='8' width='164' height='244' rx='4' fill='%232a0018'/%3E%3Cpath d='M90 55 C70 75 50 95 90 115 C130 95 110 75 90 55Z' fill='%23ec4899' opacity='0.9'/%3E%3Cpath d='M90 55 C70 35 50 55 90 75 C130 55 110 35 90 55Z' fill='%23f43f8a' opacity='0.7'/%3E%3Crect x='28' y='155' width='124' height='18' rx='3' fill='%23ec4899' opacity='0.9'/%3E%3Crect x='48' y='179' width='84' height='10' rx='2' fill='%23ec4899' opacity='0.5'/%3E%3C/svg%3E",
   description:"Behind Venice's masquerade balls, two strangers fall into a love so forbidden it could shatter both their aristocratic worlds forever.",
   chapters:[{title:"Masquerade Night",words:2600,done:true},{title:"Behind the Veil",words:2900,done:true},{title:"Forbidden Gardens",words:3100,done:true},{title:"The Unmasking",words:2700,done:false},{title:"Forever After Midnight",words:3300,done:false}]}
];
let WISHLIST=[
  {id:10,title:"The Night Circus",author:"Erin Morgenstern",genre:"Fantasy",rating:4.9,progress:0,status:"wishlist",cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%23111'/%3E%3Ccircle cx='90' cy='90' r='50' fill='none' stroke='white' stroke-width='2' opacity='0.5' stroke-dasharray='5,5'/%3E%3Ccircle cx='90' cy='90' r='30' fill='none' stroke='white' stroke-width='1' opacity='0.3'/%3E%3Crect x='28' y='158' width='124' height='16' rx='2' fill='white' opacity='0.8'/%3E%3Crect x='48' y='180' width='84' height='8' rx='1' fill='white' opacity='0.4'/%3E%3C/svg%3E"},
  {id:11,title:"Project Hail Mary",author:"Andy Weir",genre:"Sci-Fi",rating:4.7,progress:0,status:"wishlist",cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%23001428'/%3E%3Ccircle cx='90' cy='82' r='34' fill='%23022050' stroke='%2300bcd4' stroke-width='2'/%3E%3Ccircle cx='90' cy='82' r='14' fill='%2300bcd4' opacity='0.3'/%3E%3Crect x='28' y='158' width='124' height='16' rx='2' fill='%2300bcd4' opacity='0.9'/%3E%3Crect x='48' y='180' width='84' height='8' rx='1' fill='%2300bcd4' opacity='0.4'/%3E%3C/svg%3E"},
  {id:12,title:"The Final Empire",author:"Brandon Sanderson",genre:"Fantasy",rating:4.8,progress:0,status:"wishlist",cover:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='260'%3E%3Crect width='180' height='260' fill='%23100500'/%3E%3Cpath d='M90 40 L110 82 L90 72 L70 82Z' fill='%23f59e0b' opacity='0.9'/%3E%3Ccircle cx='90' cy='66' r='7' fill='%23f59e0b'/%3E%3Crect x='28' y='158' width='124' height='16' rx='2' fill='%23f59e0b' opacity='0.9'/%3E%3Crect x='48' y='180' width='84' height='8' rx='1' fill='%23f59e0b' opacity='0.4'/%3E%3C/svg%3E"}
];

function saveBooks() { try{localStorage.setItem("Bangla Scan_custom_books", JSON.stringify(BOOKS));}catch(e){} }
function loadBooks() { try{const b=localStorage.getItem("Bangla Scan_custom_books");if(b)BOOKS=JSON.parse(b);}catch(e){} }

// Rich chapter content keyed by [bookId][chapterIdx]
const CHAPTER_TEXT={
  0:{
    0:`The palace was not built—it was dreamed into existence by a mad king who had outlived seven successors. Its towers twisted upward like the fingers of a drowning man, and the throne room alone could swallow a cathedral whole. Zara had walked through a hundred palaces in her seventeen years of service, but none made her heart hammer like this one.

She adjusted the silver clasp at her collar and stepped through the obsidian archway. The Midnight Throne—a monument of black crystal and ancient bone—pulsed with cold violet light that made the air taste of iron and old rain. Guards in midnight-blue armor lined the walls like statues, their eyes tracking her every breath.

"The Seer of the Eastern Reaches," announced a herald whose voice echoed for far too long.

Zara bowed, her crimson cloak pooling on the floor like spilled blood. At the top of the dais, shrouded in shadow and something older, the Empath King turned.

His eyes were wrong. Not the wrong color or shape—wrong in a way that defied categories. They held the accumulated grief of a thousand borrowed deaths, and they recognized her before she had spoken a word.

"You've come to kill me," he said, without accusation. Merely stating a fact.

"I've come to understand you, Your Majesty." Zara kept her voice steady. A seer's voice. A liar's voice. "If understanding proves impossible—yes. I will end it."

The king descended a single step. The court fell absolutely silent. Even the candle flames stopped flickering.

"No one has been honest with me in sixty years," he said softly. "Sit down, Zara Vel. Let us understand each other."`,
    1:`Shadows did not merely gather here—they congregated, held counsel, and sent emissaries into the lit world. Zara had learned this during her first year of training, when the High Seer had blindfolded her and asked her to draw a map of the palace using nothing but sound.

She had drawn it perfectly.

Not because she had exceptional hearing, but because the palace whispered. Every stone carried the memory of what it had witnessed—coronations, executions, secret meetings in alcoves half-forgotten by time.

"You know what this throne does," the King said. He hadn't offered her wine. She was grateful. "Every court scholar does. What they don't know—what I never allowed to be recorded—is the price."

"Tell me the price."

"You feel everyone who dies." He touched the crystal arm of the throne as if it were a wound still tender. "Not their pain—death transcends pain—but their particular, intimate absence. The exact shape of the hole they leave behind. Every candle snuffed across all the kingdoms I have ever held." He paused. "I have held eleven kingdoms."

The mathematics of that suffering played out behind Zara's eyes.

"Can you set it down?" she asked. "The throne?"

"Three have tried." He smiled for the first time, and it was the saddest smile she had ever witnessed. "They are the three kingdoms I no longer hold."

The violet light pulsed once, like a heartbeat.`
  },
  1:{
    0:`The signal had been waiting in the noise for four hundred years.

Archivist Thea Solis discovered it at 3:14 AM on a Tuesday—which was, she often thought afterward, exactly the kind of unremarkable moment where history prefers to announce itself. She had been cross-referencing two decades of deep-space radio data against the Kowalski Index when the pattern surfaced, clean and deliberate as a signature amidst static.

Her coffee went cold. Her backup drive clicked through two full cycles. The station's rotation carried her window from darkness into artificial dawn, and still she hadn't moved.

The data cache was not a message in any known language. It was a library in a format she could only describe as perfect—as if someone had solved the problem of communication from first principles and produced a solution so elegant it made every human codec seem like cave painting by comparison.

She named it, alone in her lab with the hum of the station around her and the stars outside, E-Prime.

She told no one for six days.`,
    1:`The Archive Directorate arrived on the seventh day, which meant someone had been watching her searches.

Commander Yuen was young for his rank and had the particular stillness of someone trained to wait people out.

"Show me," he said, without preamble.

She showed him. He watched the data cascade across the hologram display for four minutes without speaking. Complex mathematical structures unfolded like flowers, each petal encoding something she was beginning to understand but could not yet name.

"Who else has access to this terminal?"

"Myself and my research assistant. She's on off-cycle rotation for two more weeks."

Yuen turned from the display. "Authorized personnel only, until I say otherwise. This conversation did not happen. The data is now classified under Protocol Celestine." He reached into his coat and produced a small black device, the kind that erased drives without drama. "You understand what this means?"

Thea looked at the device, and then at the stars, and then back at him.

"It means," she said carefully, "that I have to make a copy right now, before you use that."`
  },
  2:{
    0:`The message arrived in the most mundane possible way: a postcard.

On one side, a faded photograph of the Ponte Vecchio in Florence. On the other, twelve characters in three groups of four, written in red ink she had been trained to recognize but never expected to see again. Below them: DON'T CALL ANYONE.

Mara Steinfeld was a cryptographer. She decoded things for a living—patterns, sequences, ciphers embedded in musical notation, in film grain, in the reflections on corporate tower windows.

She was not good at receiving messages from dead people.

Because that handwriting belonged to Emil Voss. And Emil Voss had died in Budapest of a heart attack seven months ago. She had been one of four people at his funeral.

She decoded the cipher using the system he had taught her twelve years ago in a Vienna safe house. The system only the two of them knew.

The translation made her put down her coffee and stare at the wall for a very long time.

THE KEY IS IN YOUR NAME. THEY COME IN SIXTY HOURS. TRUST THE GLASS.`,
    1:`She spent the first twenty hours refusing to believe it.

Not the cipher—the cipher she believed completely. This was real. He had written this. Which meant either Emil was not dead, or he had written it before his death and arranged its delivery.

Both possibilities kept her awake through a Prague night during which the traffic gradually thinned to silence.

At 4 AM she opened a blank document and began working through the second problem: what the message meant.

THE KEY IS IN YOUR NAME. She had decoded her own name six ways by dawn. Steinfeld. Stone field. The field of stones. MARA: bitter in Hebrew. She circled and crossed out, filling three pages of a yellow legal pad.

At 7:15 AM, with the first proper light coming through her curtain, she found it.

Not in the name itself. In the gap between names.

She picked up her phone with shaking hands. She did not call the police. She pulled up a twelve-year-old contact she had never expected to use, and typed a single sentence.

Emil says the glass.

Three seconds later, the reply: I'm outside.`
  },
  3:{
    0:`The island wasn't on any chart she had ever seen. Which was significant, given that Dr. Petra Vance had personally catalogued seven thousand three hundred and twelve nautical charts over a career spanning two decades.

She found the discrepancy at third remove: a footnote in a Portuguese sailing memoir from 1887 referencing a "place of forgetting" the author had deliberately excised from his published account.

The coordinates were encoded in the page numbering—the kind of elegant stupidity that only makes sense in retrospect.

She photographed forty-three pages and boarded her flight home feeling the particular excitement she hadn't experienced since her doctoral work.

Three weeks later, she quit her job.

Not dramatically. Three-week notice, appropriate paperwork, four cardboard boxes.

"Does this have anything to do with Porto?" her supervisor asked.

"Yes." More honest than he had expected.

"Are you going to find it?"

She taped the last box closed. "I'm going to try."`,
    1:`The ship she chartered was named the Coriolis.

They were three days out of Lisbon when she realized the island might be avoiding them. Not mystically—she was a scientist—but in the straightforward sense that the coordinates kept shifting. Purposefully. As if something beneath the surface were redirecting the isle one current at a time.

She told the navigator. He considered it for a while.

"You want to let it go?" she said.

"I want to let it come to us." He adjusted their heading twelve degrees west. "Something that hides does so because no one has ever just stopped."

It was not a scientific strategy. But on the fourth morning, through a mist that burned off faster than mist had any right to, she saw land.

And the land was exactly where she had first plotted it on her kitchen table in Lisbon, three weeks after Porto, with the windows dark and her hands barely steady enough to hold a pencil.`
  },
  4:{
    0:`You don't feel the signal at first. You have to have been under long enough—immersed in the silence between signals—before you understand that the silence itself communicates something.

Kira Sato had been an underground network operator for six years. She was also, at this precise moment, running flat out across rooftops with something she had taken from a government server farm strapped to her chest.

The drones were persistent tonight.

She had expected two; the server was rated low-priority. Instead there were seven, organized into Protocol Crow—which meant someone had flagged it High Value after she was already inside.

Meaning she had found something they hadn't known was there.

She cleared a three-meter gap between rooftops at a height that would have been unwise to calculate, and landed in a crouch that left both knees screaming.

The case against her ribs weighed almost nothing. That was wrong. Data at this density should have some physical acknowledgment of its own significance.

It contained—she had seen enough to know—a blueprint. Not of a building or a weapon. A blueprint of something that had been broadcasting, at frequencies too low for human biology and too consistent for natural origin, from the Earth's ionosphere.

For sixty years.`,
    1:`The safe house was a restaurant supply depot in Level Three, half-converted into living space in ways that rewarded not looking too closely at the plumbing.

Her mentor, Dispatch, watched from across the room with arms folded.

"How bad?" Dispatch asked.

"Depends on who's asking." Kira opened the case. The data crystal inside was iridescent—prismatic in a way that suggested its manufacturers had never once encountered a constraint. "Government-knows-we-have-it: pretty bad. What's actually on it—"

She connected it to her reader. The protocol requests alone took eleven seconds to resolve.

"Dispatch." She kept her voice flat. "Every human brain is a receiver."

Silence.

"The signal we've assumed was natural background radiation—the one they've studied since the forties and never quite explained—is structured. It's not random. It's a carrier wave." She looked up. "And whatever built it didn't build it for us. We're just picking it up because our biology happened to be sensitive at that frequency."

Dispatch slowly unfolded her arms.

"What's it carrying?" she asked.

Kira looked at the data.

"That's the part I don't have language for yet."`
  },
  5:{
    0:`The carnival mask she wore was a lie made of white porcelain and gold leaf, and it was by far the most honest thing about her.

Cecelia di Fontana had attended the Doge's grand masquerade every year since she was twelve—first as her father's ward, then as her brother's sister, then as a widow whose youth was a polite embarrassment—and she had learned to perform the waltz of social navigation with merciless precision. Smile here. Deflect there. Accept this compliment as if it is not a transaction.

The mask helped. Behind the porcelain, she was permitted to see clearly.

She was not, therefore, accustomed to being caught looking.

"You've been watching the door," said a voice at her left shoulder, "for twelve minutes."

She did not turn immediately. "Many people watch doors at parties. The interesting ones usually come through them."

"And the uninteresting ones escape through them. You're timing something."

Now she turned.

The man beside her wore a black silk mask that gave him the quality of a nocturne portrait. His coat was well cut. His accent was Venetian by origin, educated by something much further away.

"I'm watching for my brother," she said.

"He's in the card room." He nodded toward an interior door. "He's winning, which should please you and apparently doesn't."

"I am," he said, turning toward the dance floor, "exceptionally good at waiting."`,
    1:`His name—the one he offered, which she suspected was true only in the way all partial truths are true—was Luca.

They found the second terrace simultaneously following a redirected supper seating neither had requested. The timing had been too exact for coincidence and neither commented on it.

"Luca what?" she asked.

"That part is complicated." He poured wine with practised ease. "What would you like it to be?"

"I'd like it to be true."

"Fair. Luca Fioravanti. My mother was a Fioravanti, which is the important part. My father is a considerable problem I am in Venice attempting to solve, which is the part I'd rather not discuss at a party."

She accepted the wine. "And does your father's problem intersect with my brother's card debts?"

A pause. Precise in its length.

"You knew," he said.

"I grew up watching men signal to each other across rooms. Eventually you learn the vocabulary." She looked at the canal, black and gold below torchlight. "He owes someone money. I came to find out how much and to whom. Is that someone you?"

"No. But I know who it is. And I can help you, if you'll trust me."

She calculated the risk with the cold precision that had helped her survive the years since her husband's death.

"Tell me why I should," she said.`
  }
};

const WEEKLY_DAYS=["M","T","W","T","F","S","S"];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ===================== STATE =====================
let U=null,bookId=0,chIdx=0,fontSize=18,lineH=1.9,rTheme="dark",rFont="lora";
let tocOpen=false,settingsOpen=false,appTheme="light",lastSY=0,progress={};
let settings_={reminders:true,autosave:true,reports:false,compact:false};
let stats_={booksRead:0,pagesRead:0,hoursRead:0};
let activities_=[];
let weekly_=[0,0,0,0,0,0,0];
let monthly_=[0,0,0,0,0,0,0,0,0,0,0,0];
let streak_={current:0,best:0,lastDate:""};
let modalCb=null;
let sessionStart=0;
let sessionStartProgress=0;

// ===================== AUTH & DATABASE =====================
let USERS = {};
let activeSession = null;

function saveUsers() { try{localStorage.setItem("Bangla Scan_users", JSON.stringify(USERS));}catch(e){} }
function loadUsers() { 
  try{ const u=localStorage.getItem("Bangla Scan_users"); if(u) USERS=JSON.parse(u); }catch(e){}
  // Ensure admin user exists
  if(!USERS[ADMIN_EMAIL]) {
    USERS[ADMIN_EMAIL] = { 
      name: "System Admin", password: "admin2024", progress: {}, 
      settings: {reminders:true,autosave:true,reports:false,compact:false},
      stats: {booksRead:0,pagesRead:0,hoursRead:0},
      activities: [],
      weekly: [0,0,0,0,0,0,0],
      monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
      streak: {current:0,best:0,lastDate:""}
    };
    saveUsers();
  }
  try{ activeSession=localStorage.getItem("Bangla Scan_session"); }catch(e){}
}

function switchAuthTab(t){
  ["signin","signup"].forEach(x=>{document.getElementById("tab-"+x).classList.toggle("active",x===t);document.getElementById(x+"-form").style.display=x===t?"block":"none";});
  document.getElementById("forgot-form").style.display="none";
}
function showForgotPassword(){
  document.getElementById("signin-form").style.display="none";
  document.getElementById("signup-form").style.display="none";
  document.getElementById("forgot-form").style.display="block";
}
function doRecoverPassword(){
  const e=document.getElementById("forgot-email")?.value.trim();
  if(!e) return showToast("⚠️ Please enter your email.");
  if(!USERS[e]) return showToast("❌ Account not found.");
  showToast("✅ Recovery link sent to " + e);
  setTimeout(()=>switchAuthTab('signin'), 2000);
}
function doLogin(){
  const e=document.getElementById("login-email")?.value.trim();
  const p=document.getElementById("login-pw")?.value;
  if(!e || !p) return showToast("⚠️ Please enter email and password.");
  if(adminSettings.maintenance && e !== ADMIN_EMAIL) return showToast("🚧 Platform is under maintenance. Please try again later.");
  if(!USERS[e]) return showToast("❌ Account not found.");
  if(USERS[e].password !== p) return showToast("❌ Incorrect password.");
  startSession(e);
}
function doRegister(){
  if(!adminSettings.allowReg) return showToast("⛔ New registrations are currently disabled by the administrator.");
  const n=document.getElementById("reg-name")?.value.trim();
  const e=document.getElementById("reg-email")?.value.trim();
  const p=document.getElementById("reg-pw")?.value;
  if(!n || !e || !p) return showToast("⚠️ Please fill all fields.");
  if(p.length < 8) return showToast("⚠️ Password must be at least 8 characters.");
  if(USERS[e]) return showToast("❌ Email already exists.");
  USERS[e] = { 
    name: n, password: p, progress: {}, 
    settings: {reminders:true,autosave:true,reports:false,compact:false},
    stats: {booksRead:0,pagesRead:0,hoursRead:0},
    activities: [],
    weekly: [0,0,0,0,0,0,0],
    monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
    streak: {current:0,best:0,lastDate:""}
  };
  saveUsers();
  startSession(e);
}
function startSession(e){
  activeSession = e;
  try{localStorage.setItem("Bangla Scan_session", e);}catch(e){}
  const u = USERS[e];
  U = { name: u.name, email: e };
  progress = u.progress || {};
  settings_ = u.settings || {reminders:true,autosave:true,reports:false,compact:false};
  stats_ = u.stats || {booksRead:0,pagesRead:0,hoursRead:0};
  activities_ = u.activities || [];
  weekly_ = u.weekly || [0,0,0,0,0,0,0];
  monthly_ = u.monthly || [0,0,0,0,0,0,0,0,0,0,0,0];
  streak_ = u.streak || {current:0,best:0,lastDate:""};
  
  const today = new Date().toISOString().split('T')[0];
  if(streak_.lastDate !== today && streak_.lastDate !== "") {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if(streak_.lastDate !== yesterday) streak_.current = 0;
  }
  
  showPage("dashboard");
  document.body.classList.add('sidebar-collapsed');
  document.getElementById("nav-admin").style.display = (e === ADMIN_EMAIL) ? "flex" : "none";
  const mmmAdmin = document.getElementById("mmm-admin");
  if(mmmAdmin) mmmAdmin.style.display = (e === ADMIN_EMAIL) ? "flex" : "none";
  initDash();
}
function enter(){
  loadBooks();
  loadUsers();
  if(!USERS['guest@banglascan.io']) {
    USERS['guest@banglascan.io'] = {
      name: "Guest Reader", password: "guest", progress: {}, 
      settings: {reminders:true,autosave:true,reports:false,compact:false},
      stats: {booksRead:0,pagesRead:0,hoursRead:0},
      activities: [], weekly: [0,0,0,0,0,0,0], monthly: [0,0,0,0,0,0,0,0,0,0,0,0], streak: {current:0,best:0,lastDate:""}
    };
    saveUsers();
  }
  if(activeSession && USERS[activeSession]) {
    startSession(activeSession);
  } else {
    startSession('guest@banglascan.io');
  }
}
function tc(s){return s.replace(/\w+/g,t=>t[0].toUpperCase()+t.slice(1));}
function goToLogin(){
  activeSession = null;
  U = null;
  try{localStorage.removeItem("Bangla Scan_session");}catch(e){}
  document.getElementById("nav-admin").style.display = "none";
  showPage("login");
}

// ===================== PAGES =====================
function showPage(p, skipHistory=false){
  if(!skipHistory && history.state !== p) { history.pushState(p, '', '#'+p); }
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  const target = document.getElementById("page-"+p);
  if(target) target.classList.add("active");
  document.body.style.overflow=(p==="reader"||p==="comic-reader"||p==="series-detail")?"hidden auto":"";
}
window.addEventListener('popstate', e => {
  if (e.state) {
    showPage(e.state, true);
    closeSidebar();
    closeModal();
    if(typeof closeDownloadModal === 'function') closeDownloadModal();
  }
});

// ===================== DASHBOARD =====================
function initDash(){
  if(adminSettings.broadcast) {
    const banner = document.getElementById("dash-broadcast-banner");
    if(banner) {
      banner.style.display = "flex";
      document.getElementById("dash-broadcast-text").textContent = adminSettings.broadcast;
    }
  } else {
    const banner = document.getElementById("dash-broadcast-banner");
    if(banner) banner.style.display = "none";
  }
  loadProgress();updateGreeting();updateUI();
  renderCR();renderHomeLibraryShelf('all');renderCategoryShelf();renderActs();renderStreak();renderWeek();
  renderLib("all");renderWish();renderExplore();renderTrending();
  renderGenres();renderMonthly();syncUI();
}
function updateUI(){
  const n=U?.name||"Alex Johnson";
  const i=n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  ["dash-avatar","topbar-avatar","settings-avatar"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=i;});
  const els={"dash-user-name":n,"hero-name":n.split(" ")[0],"settings-name":n};
  Object.entries(els).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  const inp=document.getElementById("profile-name-input");if(inp&&U)inp.value=U.name;
  
  const loginBtn = document.getElementById('topbar-login-btn');
  const topbarAvatar = document.getElementById('topbar-avatar');
  const mmmLogout = document.getElementById('mmm-logout');
  const mmmLogin = document.getElementById('mmm-login');
  if(loginBtn) {
    loginBtn.style.display = (U?.email === 'guest@banglascan.io') ? 'flex' : 'none';
  }
  if(topbarAvatar) {
    topbarAvatar.style.display = (U?.email === 'guest@banglascan.io') ? 'none' : 'flex';
  }
  if(mmmLogout) {
    mmmLogout.style.display = (U?.email === 'guest@banglascan.io') ? 'none' : 'flex';
  }
  if(mmmLogin) {
    mmmLogin.style.display = (U?.email === 'guest@banglascan.io') ? 'flex' : 'none';
  }
  
  const sidebarLogout = document.getElementById('sidebar-logout');
  const sidebarLogin = document.getElementById('sidebar-login');
  if(sidebarLogout) sidebarLogout.style.display = (U?.email === 'guest@banglascan.io') ? 'none' : 'flex';
  if(sidebarLogin) sidebarLogin.style.display = (U?.email === 'guest@banglascan.io') ? 'flex' : 'none';
  
  const settingsLogout = document.getElementById('settings-logout-row');
  const settingsLogin = document.getElementById('settings-login-row');
  if(settingsLogout) settingsLogout.style.display = (U?.email === 'guest@banglascan.io') ? 'none' : 'flex';
  if(settingsLogin) settingsLogin.style.display = (U?.email === 'guest@banglascan.io') ? 'flex' : 'none';
  
  animateValue("dash-stat-books", 0, stats_.booksRead, 1000);
  animateValue("dash-stat-pages", 0, stats_.pagesRead, 1500);
  animateValue("dash-stat-streak", 0, streak_.current, 1000);
  animateValue("dash-stat-hours", 0, stats_.hoursRead, 1500);
  
  animateValue("dash-card-stat-books", 0, stats_.booksRead, 1000);
  animateValue("dash-card-stat-pages", 0, stats_.pagesRead, 1500);
  animateValue("dash-card-stat-streak", 0, streak_.current, 1000);
  animateValue("dash-card-stat-hours", 0, stats_.hoursRead, 1500);
  
  animateValue("pg-stat-books", 0, stats_.booksRead, 1000);
  animateValue("pg-stat-pages", 0, stats_.pagesRead, 1500);
  animateValue("pg-stat-hours", 0, stats_.hoursRead, 1500, "h");
  
  const b=document.getElementById("dash-stat-best");if(b)b.textContent=`Best: ${streak_.best}`;
  const cb=document.getElementById("dash-card-stat-best");if(cb)cb.textContent=`Best: ${streak_.best}`;
  const s=document.getElementById("side-streak");if(s)s.textContent=streak_.current;
}
function animateValue(id, start, end, duration, suffix="") {
  const obj = document.getElementById(id);
  if(!obj) return;
  if(end === 0) { obj.textContent = "0" + suffix; return; }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    obj.innerHTML = val.toLocaleString() + suffix;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
function updateGreeting(){const h=new Date().getHours();document.getElementById("greeting-time").textContent=h<12?"Good morning ☀️":h<17?"Good afternoon 👋":"Good evening ✨";}
function toggleSidebar(e) { 
  if(e) e.stopPropagation();
  if(window.innerWidth < 1024) {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
  } else {
    document.body.classList.toggle('sidebar-collapsed');
    const mc = document.querySelector('.main-content');
    if(mc) mc.style.marginLeft = document.body.classList.contains('sidebar-collapsed') ? '0' : '';
  }
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}
function openMobileMore() {
  document.getElementById('mobile-more-menu').classList.add('open');
}
function closeMobileMore() {
  document.getElementById('mobile-more-menu').classList.remove('open');
}
function navToMMM(page) {
  closeMobileMore();
  setTimeout(() => {
    if(page === 'admin') openAdminPanel();
    else navTo(page);
  }, 150);
}
function navTo(s){
  ["home","library","stats","wishlist","explore","trending","settings"].forEach(t=>{
    document.getElementById("tab-"+t)?.classList.toggle("active",t===s);
    document.getElementById("nav-"+t)?.classList.toggle("active",t===s);
  });
  const titles={home:"Dashboard",library:"My Library",stats:"Statistics",wishlist:"Wishlist",explore:"Explore",trending:"Trending",settings:"Settings"};
  document.getElementById("topbar-title").textContent=titles[s]||"Dashboard";
  
  const bottomTabs = ['home', 'library', 'explore', 'trending'];
  const backBtn = document.getElementById("topbar-back-btn");
  if(backBtn) {
    if(bottomTabs.includes(s)) {
      backBtn.classList.remove('show-back');
      document.body.classList.remove('has-back-btn');
    } else {
      backBtn.classList.add('show-back');
      document.body.classList.add('has-back-btn');
    }
  }
  
  closeSidebar();
  window.scrollTo(0,0);
}

// ===================== CONTINUE READING =====================
function renderCR(){
  const b=BOOKS[0],p=progress[b.id]??b.progress,ch=b.chapters[b.currentChapter],pg=Math.round(p/100*b.pages);
  document.getElementById("continue-reading-card").innerHTML=`
    <img class="cr-book-cover" src="${b.cover}" alt="${b.title}" />
    <div class="cr-info">
      <div class="cr-label">Continue Reading</div>
      <div class="cr-title">${b.title}</div>
      <div class="cr-author">by ${b.author}</div>
      <div class="progress-meta"><span>${p}% complete</span><span>${pg} / ${b.pages} pages</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
      <div class="cr-chapter">Currently on: ${ch.title}</div>
      <div class="cr-actions">
        <button class="btn-read" onclick="openBook(0)">📖 Open Book</button>
        <button class="btn-outline" onclick="navTo('library')">📚 Library</button>
      </div>
    </div>`;
}

// ===================== BOOK CARDS =====================
function toggleBookMenu(e, bookId) {
  e.stopPropagation();
  // Close any other open dropdowns
  document.querySelectorAll('.book-dropdown.open').forEach(d => {
    if (d.dataset.bid !== String(bookId)) d.classList.remove('open');
  });
  const dd = document.getElementById('bdrop-'+bookId);
  if (dd) dd.classList.toggle('open');
}
document.addEventListener('click', () => {
  document.querySelectorAll('.book-dropdown.open').forEach(d => d.classList.remove('open'));
});
function bc(b){
  const p=progress[b.id]??b.progress??0;
  const s="\u2605".repeat(Math.round(b.rating))+"\u2606".repeat(5-Math.round(b.rating));
  const badge=p>=100?"\u2705":p>0?p+"%":"\u2b1c";
  const bc_=p>=100?"var(--accent-success)":p>0?"var(--accent-2)":"var(--text-muted)";
  const isWish=b.status==="wishlist";
  const readLabel=p>=100?"📖 Reread":p>0?"📖 Continue":"📖 Start";
  return`<div class="book-card" onclick="openBook(${b.id},${isWish})">
    <div class="book-cover-wrap">
      <img src="${b.cover}" alt="${b.title}" loading="lazy"/>
      <div class="book-overlay"><div class="book-read-btn">${readLabel}</div></div>
      <div class="book-genre-badge">${b.genre}</div>
      <div class="book-progress-mini"><div class="book-progress-fill" style="width:${p}%"></div></div>
    </div>
    <div class="book-menu-btn" onclick="toggleBookMenu(event,${b.id})" title="More options">⋯</div>
    <div class="book-dropdown" id="bdrop-${b.id}" data-bid="${b.id}">
      <div class="book-dropdown-item" onclick="event.stopPropagation();openBook(${b.id},${isWish})">${readLabel}</div>
      <div class="book-dropdown-item" onclick="event.stopPropagation();navTo('library')">📚 View in Library</div>
      <div class="book-dropdown-item" onclick="event.stopPropagation();addToWishlist(${b.id})">⭐ Add to Wishlist</div>
      <div class="book-dropdown-divider"></div>
      <div class="book-dropdown-item" onclick="event.stopPropagation();shareBook(${b.id})">🔗 Share</div>
    </div>
    <div class="book-title">${b.title}</div>
    <div class="book-author">${b.author}</div>
    <div class="book-rating"><span style="color:var(--accent-4)">${s.slice(0,5)}</span><span style="color:var(--text-muted);font-size:10px;margin-left:3px">${b.rating}</span><span style="margin-left:auto;font-size:10px;font-weight:700;color:${bc_}">${badge}</span></div>
  </div>`;
}
function addToWishlist(id){const b=BOOKS.find(x=>x.id===id);if(b&&!WISHLIST.find(x=>x.id===id)){WISHLIST.push({...b,status:'wishlist'});saveBooks();renderWish();showToast('⭐ Added to Wishlist');}else{showToast('Already in Wishlist');}}
function shareBook(id){const b=BOOKS.find(x=>x.id===id)||WISHLIST.find(x=>x.id===id);if(!b)return;if(navigator.share){navigator.share({title:b.title,text:`Check out "${b.title}" by ${b.author} on Bangla Scan!`}).catch(()=>{});}else{navigator.clipboard?.writeText(`"${b.title}" by ${b.author} — Bangla Scan`).then(()=>showToast('📋 Copied to clipboard'));}}function showToast(msg){let t=document.getElementById('bs-toast');if(!t){t=document.createElement('div');t.id='bs-toast';t.style.cssText='position:fixed;bottom:calc(80px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);background:var(--bg-overlay);color:var(--text-primary);padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;z-index:9999;border:1px solid var(--glass-border);backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:opacity 0.3s;white-space:nowrap;';document.body.appendChild(t);}t.textContent=msg;t.style.opacity='1';clearTimeout(t._to);t._to=setTimeout(()=>t.style.opacity='0',2500);}
// Build a single shelf book card
function shelfBookCard(b, badgeText) {
  const p = progress[b.id] ?? b.progress ?? 0;
  const stars = '★'.repeat(Math.round(b.rating||0)) + '☆'.repeat(5-Math.round(b.rating||0));
  const isWish = b.status === 'wishlist';
  return `<div class="shelf-book" onclick="openBook(${b.id},${isWish})">
    <div class="shelf-cover">
      <img src="${b.cover}" alt="${b.title}" loading="lazy" />
      ${badgeText ? `<div class="shelf-cover-badge">${badgeText}</div>` : ''}
    </div>
    <div class="shelf-book-name">${b.title}</div>
    <div class="shelf-book-author">${b.author}</div>
    <div class="shelf-book-rating">${stars.slice(0,5)} ${b.rating||''}</div>
    ${p > 0 && p < 100 ? `<div class="shelf-book-prog"><div class="shelf-book-prog-fill" style="width:${p}%"></div></div>` : ''}
  </div>`;
}

// Render My Library shelf on home tab with filter
function renderHomeLibraryShelf(filter) {
  let books = BOOKS;
  if (filter && filter !== 'all') {
    books = BOOKS.filter(b => {
      const p = progress[b.id] ?? b.progress ?? 0;
      if (filter === 'reading') return p > 0 && p < 100;
      if (filter === 'completed') return p >= 100;
      if (filter === 'unread') return p === 0;
      return b.genre === filter || b.status === filter;
    });
  }
  const shelf = document.getElementById('home-library-shelf');
  if (!shelf) return;
  if (!books.length) {
    shelf.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;">No books found in this category.</div>';
    return;
  }
  const badges = { reading: '📖', completed: '✅', unread: '⬜' };
  shelf.innerHTML = books.map(b => {
    const p = progress[b.id] ?? b.progress ?? 0;
    const badgeTxt = p >= 100 ? '✅' : p > 0 ? `${p}%` : '';
    return shelfBookCard(b, badgeTxt);
  }).join('');
}

function homeFilterCat(filter, el) {
  document.querySelectorAll('#home-cat-chips .cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderHomeLibraryShelf(filter);
}

// Render discover category shelves
function renderCategoryShelf() {
  const allBooks = [...BOOKS, ...WISHLIST];
  const sections = [
    {
      id: 'latest', icon: '🆕', title: 'Latest Updates', badge: 'NEW', badgeClass: 'new',
      books: [...allBooks].slice().reverse(),
      getBadge: () => 'New'
    },
    {
      id: 'popular', icon: '🔥', title: 'Popular Right Now', badge: 'HOT', badgeClass: 'hot',
      books: [...allBooks].sort((a,b) => (b.rating||0)-(a.rating||0)),
      getBadge: b => `⭐ ${b.rating}`
    },
    {
      id: 'reading', icon: '📖', title: 'Continue Reading', badge: null, badgeClass: null,
      books: BOOKS.filter(b => { const p=progress[b.id]??b.progress??0; return p>0&&p<100; }),
      getBadge: b => { const p=progress[b.id]??b.progress??0; return p>0?`${p}%`:''; }
    },
    {
      id: 'recommended', icon: '💡', title: 'Recommended For You', badge: 'PICK', badgeClass: 'pick',
      books: [...allBooks].sort(() => Math.random()-0.5).slice(0,6),
      getBadge: () => '✨'
    }
  ];

  const wrap = document.getElementById('category-shelves');
  if (!wrap) return;
  wrap.innerHTML = sections.map(sec => {
    const books = sec.books.slice(0, 10);
    if (!books.length) return '';
    return `<div class="category-shelf">
      <div class="shelf-header">
        <div class="shelf-title">${sec.icon} ${sec.title}
          ${sec.badge ? `<span class="shelf-badge ${sec.badgeClass}">${sec.badge}</span>` : ''}
        </div>
        <div class="shelf-action" onclick="navTo('explore')">See all →</div>
      </div>
      <div class="shelf-scroll">${books.map(b => shelfBookCard(b, sec.getBadge(b))).join('')}</div>
    </div>`;
  }).join('');
}

function renderHomeGrid(){const el=document.getElementById("home-book-grid");if(el)el.innerHTML=BOOKS.slice(0,4).map(bc).join("");}
function renderLib(f){
  let books=BOOKS;
  if(f!=="all")books=BOOKS.filter(b=>{const p=progress[b.id]??b.progress;return f==="reading"?p>0&&p<100:f==="completed"?p>=100:f==="unread"?p===0:b.genre===f;});
  document.getElementById("library-grid").innerHTML=books.length?books.map(bc).join(""):`<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><div class="empty-state-title">No books found</div></div>`;
}
function filterLibrary(f,btn){document.querySelectorAll("#tab-library .filter-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderLib(f);}
function renderWish(){document.getElementById("wishlist-grid").innerHTML=WISHLIST.map(b=>`<div class="book-card" onclick="showToast('📚 Added to your library!')">
  <div class="book-cover-wrap"><img src="${b.cover}" alt="${b.title}" loading="lazy"/><div class="book-overlay"><div class="book-read-btn">Add to Library</div></div><div class="book-genre-badge">${b.genre}</div></div>
  <div class="book-title">${b.title}</div><div class="book-author">${b.author}</div>
  <div class="book-rating"><span style="color:var(--accent-4)">★★★★★</span><span style="margin-left:3px;font-size:10px;color:var(--text-muted)">${b.rating}</span><span style="margin-left:auto">⭐</span></div>
</div>`).join("");}
function renderExplore(){
  const gs=["All","Fantasy","Sci-Fi","Thriller","Adventure","Romance"];
  document.getElementById("explore-genres").innerHTML=gs.map((g,i)=>`<div class="genre-tag ${i===0?"active":""}" onclick="filterExp('${g}',this)">${g}</div>`).join("");
  document.getElementById("explore-grid").innerHTML=[...BOOKS,...WISHLIST].map(bc).join("");
}
function filterExp(g,btn){document.querySelectorAll("#explore-genres .genre-tag").forEach(t=>t.classList.remove("active"));btn.classList.add("active");const all=[...BOOKS,...WISHLIST];document.getElementById("explore-grid").innerHTML=(g==="All"?all:all.filter(b=>b.genre===g)).map(bc).join("");}
function renderTrending(){document.getElementById("trending-grid").innerHTML=[...BOOKS,...WISHLIST].sort((a,b)=>b.rating-a.rating).map(bc).join("");}
function renderGenres(){
  const gs=[{n:"Fantasy",c:4,col:"var(--accent-1)"},{n:"Sci-Fi",c:3,col:"var(--accent-3)"},{n:"Thriller",c:2,col:"var(--accent-4)"},{n:"Adventure",c:2,col:"var(--accent-success)"},{n:"Romance",c:1,col:"var(--accent-5)"}];
  document.getElementById("genre-bars").innerHTML=`<div style="display:flex;gap:20px;flex-wrap:wrap">${gs.map(g=>`<div style="display:flex;flex-direction:column;align-items:center;gap:7px;min-width:70px"><div style="height:100px;width:38px;background:var(--bg-input);border-radius:6px;display:flex;align-items:flex-end;overflow:hidden"><div style="width:100%;height:${g.c/4*100}%;background:${g.col};border-radius:6px;transition:height 1s"></div></div><div style="font-size:11px;font-weight:600;color:var(--text-secondary)">${g.n}</div><div style="font-size:10px;color:var(--text-muted)">${g.c} books</div></div>`).join("")}</div>`;
}
function renderMonthly(){
  const max=Math.max(...monthly_, 1);
  const curMonth = new Date().getMonth();
  document.getElementById("monthly-chart").innerHTML=monthly_.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end"><div style="width:100%;height:${v/max*140}px;background:${i===curMonth?"var(--gradient-accent)":"rgba(124,58,237,0.22)"};border-radius:4px 4px 0 0;min-height:4px;transition:height 1.5s var(--ease-spring)"></div></div>`).join("");
  document.getElementById("monthly-labels").innerHTML=MONTHS.map(l=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted)">${l}</div>`).join("");
}
function renderActs(){
  const list = activities_.length ? activities_ : [{icon:"✨",color:"rgba(124,58,237,0.15)",title:"Welcome to Bangla Scan!",meta:"Start reading to see your activity here.",time:"Just now"}];
  document.getElementById("activity-list").innerHTML=list.slice(0,5).map(a=>`<div class="activity-item"><div class="activity-icon" style="background:${a.color}">${a.icon}</div><div class="activity-text"><div class="activity-title">${a.title}</div><div class="activity-meta">${a.meta}</div></div><div class="activity-time">${a.time}</div></div>`).join("");
}
function renderStreak(){const days=["M","T","W","T","F","S","S"];const today=(new Date().getDay()+6)%7;document.getElementById("streak-days").innerHTML=days.map((d,i)=>`<div class="streak-day ${i<today?"done":i===today?"today":""}">${d}</div>`).join("");}
function renderWeek(){const max=Math.max(...weekly_, 1);const today=(new Date().getDay()+6)%7;document.getElementById("weekly-chart").innerHTML=weekly_.map((v,i)=>`<div class="chart-bar-wrap"><div class="chart-bar ${i===today?"active":""}" style="height:${v/max*100}px"></div><div class="chart-label">${WEEKLY_DAYS[i]}</div></div>`).join("");}

// ===================== READER =====================
function saveSessionData(){
  if(!activeSession)return;
  USERS[activeSession].progress=progress;
  USERS[activeSession].settings=settings_;
  USERS[activeSession].stats=stats_;
  USERS[activeSession].activities=activities_;
  USERS[activeSession].weekly=weekly_;
  USERS[activeSession].monthly=monthly_;
  USERS[activeSession].streak=streak_;
  saveUsers();
}
function addActivity(icon, color, title, meta) {
  activities_.unshift({icon, color, title, meta, time: "Just now"});
  if(activities_.length > 20) activities_.pop();
  saveSessionData();
}

function openBook(id,fromWish=false){
  const b=[...BOOKS,...WISHLIST].find(b=>b.id===id);if(!b)return;
  if(fromWish||b.status==="wishlist"){showToast("📚 Added to your library!");return;}
  bookId=id;chIdx=b.currentChapter||0;
  sessionStart = Date.now();
  sessionStartProgress = progress[id]||0;
  addActivity("📖","rgba(124,58,237,0.15)","Started reading",`${b.title} · Ch. ${chIdx+1}`);
  showPage("reader");renderReader();applyRTheme(rTheme);startScroll();
}
function renderReader(){
  const b=BOOKS.find(b=>b.id===bookId);if(!b)return;
  const ch=b.chapters[chIdx];
  document.getElementById("reader-book-title").textContent=b.title;
  document.getElementById("reader-chapter-label").textContent=`Chapter ${chIdx+1} of ${b.chapters.length}`;
  document.getElementById("reader-ch-title").textContent=`Chapter ${chIdx+1}: ${ch.title}`;
  document.getElementById("reader-ch-meta").textContent=`~${Math.ceil((ch.words||3000)/250)} min read · ${(ch.words||3000).toLocaleString()} words`;
  const text=CHAPTER_TEXT[bookId]?.[chIdx];
  document.getElementById("reader-body").innerHTML=text?text.split("\n\n").map(p=>`<p>${p.replace(/\n/g,"<br/>")}</p>`).join(""):genMock(ch.title);
  renderTOC(b);updateCNav(b);applyRFont(rFont);applyFS(fontSize);
  document.getElementById("reading-progress-fill").style.width="0%";window.scrollTo(0,0);
}
function genMock(title){return["The story enters a new phase here, building carefully on all that has come before. Characters face choices that will echo through the rest of the narrative.","Light filtered through half-drawn blinds in long amber stripes. The room held the particular silence that follows difficult truths—occupied rather than empty, as though the air itself needed time to settle.","She thought back through the chain of events, each link so small when she first encountered it. Only now, looking back, could she see the shape of what it had been building toward.","\"I need to know if you trust me,\" he said quietly. A simple question. The answer would determine everything that followed.","Outside, the world continued its ordinary rhythms entirely unaware. That seemed both wonderful and wrong.","The decision, when it came, arrived not with drama but with clarity—like a door that had always been there, waiting for someone to finally stop walking past it."].map(p=>`<p>${p}</p>`).join("");}
function renderTOC(b){document.getElementById("toc-items").innerHTML=b.chapters.map((c,i)=>`<div class="toc-item ${i===chIdx?"active":""}" onclick="goToChap(${i})"><div class="toc-item-num">${i+1}</div><div class="toc-item-title">${c.title}</div>${c.done?"<div class='toc-item-done'>✓</div>":""}</div>`).join("");}
function goToChap(i){chIdx=i;renderReader();if(window.innerWidth<900&&tocOpen)toggleToc();}
function updateCNav(b){
  const p=document.getElementById("prev-ch-btn"),n=document.getElementById("next-ch-btn"),atS=chIdx===0,atE=chIdx===b.chapters.length-1;
  p.style.opacity=atS?"0.3":"1";p.style.pointerEvents=atS?"none":"auto";n.style.opacity=atE?"0.3":"1";n.style.pointerEvents=atE?"none":"auto";
  p.textContent=chIdx>0?`← ${b.chapters[chIdx-1].title}`:"← Start";n.textContent=!atE?`${b.chapters[chIdx+1].title} →`:"End →";
}
function prevChapter(){if(chIdx>0){chIdx--;renderReader();window.scrollTo(0,0);}}
function nextChapter(){
  const b=BOOKS.find(b=>b.id===bookId);
  if(b&&chIdx<b.chapters.length-1){
    b.chapters[chIdx].done=true;
    chIdx++;
    addActivity("✅","rgba(16,185,129,0.15)","Finished Chapter",`${b.title} · Ch. ${chIdx}`);
    renderReader();window.scrollTo(0,0);spawnConfetti();
  }
}
function exitReader(){
  const b=BOOKS.find(b=>b.id===bookId);
  if(b){
    const pct=parseFloat(document.getElementById("reading-progress-fill").style.width)||0;
    const ov=Math.min(100,Math.round(chIdx/b.chapters.length*100+pct/100*(100/b.chapters.length)));
    progress[b.id]=Math.max(progress[b.id]||0,ov);
    b.currentChapter=chIdx;
    
    const durationMin = Math.floor((Date.now() - sessionStart) / 60000);
    const pagesRead = Math.max(0, Math.floor((progress[b.id] - sessionStartProgress) / 100 * b.pages));
    
    if(pagesRead > 0 || durationMin > 0) {
       stats_.pagesRead += pagesRead;
       stats_.hoursRead = +(stats_.hoursRead + (durationMin / 60)).toFixed(1);
       if(progress[b.id] >= 100 && sessionStartProgress < 100) {
         stats_.booksRead++;
         addActivity("🎉","rgba(245,158,11,0.15)","Finished Book",`${b.title}`);
         monthly_[new Date().getMonth()]++;
       }
       weekly_[(new Date().getDay()+6)%7] += pagesRead;
       
       const today = new Date().toISOString().split('T')[0];
       if(streak_.lastDate !== today) {
         streak_.current++;
         streak_.lastDate = today;
         if(streak_.current > streak_.best) streak_.best = streak_.current;
       }
    }
    saveSessionData();
  }
  updateUI();
  showPage("dashboard");renderCR();renderHomeGrid();renderLib("all");
}
function startScroll(){
  const fill=document.getElementById("reading-progress-fill"),tb=document.getElementById("reader-topbar");
  window.removeEventListener("scroll",window._RSH);
  window._RSH=()=>{const st=window.scrollY,dh=document.documentElement.scrollHeight-window.innerHeight;if(dh>0)fill.style.width=Math.min(100,st/dh*100)+"%";if(st>lastSY+5&&st>100)tb.classList.add("hidden");else if(st<lastSY-5)tb.classList.remove("hidden");lastSY=st;};
  window.addEventListener("scroll",window._RSH,{passive:true});
}
function toggleToc(){tocOpen=!tocOpen;document.getElementById("reader-toc").classList.toggle("hidden",!tocOpen);document.getElementById("reader-main").classList.toggle("toc-open",tocOpen);}
function toggleReaderSettings(){settingsOpen=!settingsOpen;document.getElementById("reader-settings-panel").classList.toggle("open",settingsOpen);}
function changeFontSize(d){fontSize=Math.max(12,Math.min(30,fontSize+d));applyFS(fontSize);document.getElementById("font-size-display").textContent=fontSize+"px";document.getElementById("setting-reader-size").textContent=fontSize+"px";}
function applyFS(s){document.getElementById("reader-body").style.fontSize=s+"px";}
function changeLineHeight(d){lineH=Math.max(1.2,Math.min(3,+(lineH+d).toFixed(1)));document.getElementById("reader-body").style.lineHeight=lineH;document.getElementById("line-height-display").textContent=lineH;}
function setReaderTheme(t){rTheme=t;applyRTheme(t);document.querySelectorAll(".reader-theme-btn").forEach(b=>b.classList.remove("selected"));document.getElementById("rtheme-"+t).classList.add("selected");document.getElementById("setting-reader-theme").textContent=t[0].toUpperCase()+t.slice(1);}
function applyRTheme(t){const v={dark:{bg:"#1a1a2e",text:"#c8d3e0",border:"#2a2a4e"},light:{bg:"#fefefe",text:"#222",border:"#e0e0e0"},sepia:{bg:"#f4eed8",text:"#3d2b1f",border:"#d4b896"}}[t];const pg=document.getElementById("page-reader");pg.style.setProperty("--reader-bg",v.bg);pg.style.setProperty("--reader-text",v.text);pg.style.setProperty("--reader-border",v.border);pg.style.background=v.bg;document.getElementById("reader-body").style.color=v.text;document.getElementById("reader-ch-title").style.color=v.text;}
function setReaderFont(f){rFont=f;applyRFont(f);document.querySelectorAll(".font-family-btn").forEach(b=>b.classList.remove("selected"));document.getElementById("rfont-"+f).classList.add("selected");document.getElementById("setting-reader-font").textContent={lora:"Lora (Serif)",merriweather:"Merriweather",inter:"Inter (Sans)"}[f];}
function applyRFont(f){const fts={lora:"'Lora',serif",merriweather:"'Merriweather',serif",inter:"'Inter',sans-serif"};const s=fts[f];document.getElementById("reader-body").style.fontFamily=s;document.getElementById("reader-ch-title").style.fontFamily=s;}
function addBookmark(){
  showToast("🔖 Bookmark saved!");
  const b=BOOKS.find(b=>b.id===bookId);
  if(b) addActivity("🔖","rgba(245,158,11,0.15)","Bookmarked page",`${b.title}`);
}
function toggleFullscreen(){!document.fullscreenElement?document.documentElement.requestFullscreen?.():document.exitFullscreen?.();}

// ===================== THEME =====================
function toggleTheme(){
  const themes = ["light","dark","midnight","sakura","ocean"];
  setAppTheme(themes[(themes.indexOf(appTheme)+1)%themes.length]);
}
function setAppTheme(t){
  appTheme=t;
  document.documentElement.setAttribute("data-theme",t);
  const icon = {"light":"☀️","dark":"🌙","midnight":"🌌","sakura":"🌸","ocean":"🌊"}[t]||"☀️";
  document.getElementById("theme-icon").textContent=icon;
  const admIcon = document.getElementById("adm-theme-icon");
  if(admIcon) admIcon.textContent=icon;
  document.querySelectorAll(".theme-option").forEach(el=>el.classList.remove("selected"));
  document.getElementById("theme-opt-"+t)?.classList.add("selected");
}

function setReaderMargin(m) {
  document.querySelectorAll(".margin-btn").forEach(el=>el.classList.remove("selected"));
  document.getElementById("rmargin-"+m)?.classList.add("selected");
  const w = {"narrow":"500px","medium":"700px","wide":"900px"}[m]||"700px";
  document.querySelector(".reader-content").style.maxWidth = w;
}

function openDownloadModal(){
  if (!adminSettings.downloads && U.email !== ADMIN_EMAIL) {
    return showToast("⛔ Downloads are currently disabled by the administrator.");
  }
  const b=BOOKS.find(b=>b.id===bookId);
  if(b){
    document.getElementById("dl-modal-title").textContent="\u2b07\ufe0f "+b.title;
    document.getElementById("dl-modal-book").textContent="by "+b.author+" \u00b7 "+b.pages+" pages \u00b7 "+b.chapters.length+" chapters";
    const es=document.getElementById("dl-size-epub");if(es)es.textContent="~"+(b.pages*0.003).toFixed(1)+" MB";
    const ps=document.getElementById("dl-size-pdf");if(ps)ps.textContent="~"+(b.pages*0.008).toFixed(1)+" MB";
    const ts=document.getElementById("dl-size-txt");if(ts)ts.textContent="~"+Math.round(b.pages*0.4)+" KB";
  }
  document.getElementById("dl-progress-bar").style.display="none";
  document.getElementById("dl-progress-fill").style.width="0%";
  const st=document.getElementById("dl-status");if(st)st.style.display="none";
  const ow=document.getElementById("dl-options-wrap");if(ow)ow.style.display="";
  document.getElementById("download-modal").classList.add("open");
}
function closeDownloadModal(){
  document.getElementById("download-modal").classList.remove("open");
}
function getBookFullText(b){
  const L=[];
  L.push(b.title.toUpperCase());L.push("by "+b.author);
  L.push("Genre: "+b.genre+"  |  Pages: "+b.pages);L.push(b.description);L.push("");
  b.chapters.forEach((ch,i)=>{
    L.push("=".repeat(60));L.push("Chapter "+(i+1)+": "+ch.title);L.push("=".repeat(60));
    const txt=CHAPTER_TEXT[b.id]?.[i];
    L.push(txt?txt.replace(/<[^>]+>/g,""):genMock(ch.title).replace(/<[^>]+>/g,""));L.push("");
  });
  return L.join("\n");
}
function downloadTXT(b){
  const blob=new Blob([getBookFullText(b)],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=b.title.replace(/\s+/g,"_")+".txt";a.click();URL.revokeObjectURL(a.href);
}
function downloadPDF(b){
  const chs=b.chapters.map((ch,i)=>{
    const raw=CHAPTER_TEXT[b.id]?.[i];
    const html=raw?raw.split("\n\n").map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join(""):genMock(ch.title);
    return `<div class="chapter"><h2>Chapter ${i+1}: ${ch.title}</h2><div class="chapter-meta">~${Math.ceil((ch.words||3000)/250)} min read</div>${html}</div>`;
  }).join("");
  const w=window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${b.title}</title><style>@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Lora',serif;font-size:12pt;line-height:1.8;color:#1a1a1a;max-width:650px;margin:0 auto;padding:40px 30px;}h1{font-size:26pt;font-weight:700;font-family:'Inter',sans-serif;margin-bottom:6px;}.meta{font-size:10pt;color:#666;}.desc{font-style:italic;color:#444;border-left:3px solid #7c3aed;padding-left:14px;margin:14px 0 30px;font-size:11pt;}.chapter{page-break-before:always;margin-top:40px;}h2{font-size:16pt;font-weight:700;font-family:'Inter',sans-serif;margin-bottom:4px;}.chapter-meta{font-size:9pt;color:#888;padding-bottom:10px;border-bottom:1px solid #eee;margin-bottom:18px;}p{margin-bottom:1.2em;text-indent:1.5em;}p:first-of-type{text-indent:0;}p:first-of-type::first-letter{float:left;font-size:3em;line-height:.8;margin:.06em .1em 0 0;font-weight:700;color:#7c3aed;}@media print{body{padding:0;max-width:100%;}}
    
    /* ===== SERIES DETAIL PAGE (MANGA/MANHWA/COMIC) ===== */
    #page-series-detail { flex-direction:column; min-height:100vh; background:var(--bg-base); }
    .series-banner { width:100%; height:clamp(200px, 30vh, 350px); position:relative; overflow:hidden; }
    .series-banner img { width:100%; height:100%; object-fit:cover; filter:blur(4px) brightness(0.6); transform:scale(1.05); }
    .series-banner-overlay { position:absolute; inset:0; background:linear-gradient(to top, var(--bg-base) 0%, transparent 100%); }
    .series-content { flex:1; max-width:1200px; margin:0 auto; width:100%; padding:0 clamp(16px, 4vw, 32px); position:relative; margin-top:-clamp(60px, 15vw, 120px); z-index:10; }
    .series-header-grid { display:flex; flex-direction:column; gap:24px; margin-bottom:32px; }
    @media(min-width:768px) { .series-header-grid { flex-direction:row; align-items:flex-end; } }
    .series-cover { width:clamp(140px, 25vw, 220px); aspect-ratio:2/3; border-radius:var(--r-xl); box-shadow:0 12px 40px rgba(0,0,0,0.5); border:2px solid var(--glass-border); object-fit:cover; flex-shrink:0; background:var(--bg-elevated); margin: 0 auto; }
    @media(min-width:768px) { .series-cover { margin:0; } }
    .series-info { flex:1; text-align:center; }
    @media(min-width:768px) { .series-info { text-align:left; padding-bottom:12px; } }
    .series-title { font-size:clamp(24px, 4vw, 36px); font-weight:900; line-height:1.2; margin-bottom:8px; background:var(--gradient-accent); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .series-alt-title { font-size:14px; color:var(--text-secondary); margin-bottom:12px; }
    .series-meta { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-bottom:16px; font-size:13px; color:var(--text-muted); font-weight:600; }
    @media(min-width:768px) { .series-meta { justify-content:flex-start; } }
    .series-meta-item { display:flex; align-items:center; gap:6px; }
    .series-tags { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:20px; }
    @media(min-width:768px) { .series-tags { justify-content:flex-start; } }
    .series-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
    @media(min-width:768px) { .series-actions { justify-content:flex-start; } }
    .series-btn { padding:12px 24px; border-radius:var(--r-full); font-size:14px; font-weight:800; cursor:pointer; transition:all var(--t-fast) var(--ease-spring); display:flex; align-items:center; gap:8px; border:none; }
    .series-btn.read { background:var(--gradient-accent); color:white; box-shadow:0 8px 24px rgba(124,58,237,0.4); }
    .series-btn.read:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(124,58,237,0.6); }
    .series-btn.bookmark { background:var(--bg-card); color:var(--text-primary); border:1px solid var(--border); }
    .series-btn.bookmark:hover { border-color:var(--border-accent); color:var(--accent-2); transform:translateY(-2px); }
    .series-btn.bookmark.active { background:rgba(124,58,237,0.15); color:var(--accent-1); border-color:var(--accent-1); }
    .series-layout-grid { display:grid; grid-template-columns:1fr; gap:24px; padding-bottom:60px; }
    @media(min-width:1024px) { .series-layout-grid { grid-template-columns:2fr 1fr; gap:40px; } }
    .series-section { background:var(--gradient-card); border:1px solid var(--glass-border); border-radius:var(--r-xl); padding:clamp(16px, 3vw, 24px); box-shadow:var(--shadow-card); margin-bottom:24px; }
    .series-desc { font-size:14px; line-height:1.7; color:var(--text-secondary); }
    .chapter-list { display:flex; flex-direction:column; gap:10px; margin-top:16px; max-height:500px; overflow-y:auto; padding-right:8px; }
    .chapter-list::-webkit-scrollbar { width:6px; }
    .chapter-item { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--r-md); cursor:pointer; transition:all var(--t-fast); }
    .chapter-item:hover { border-color:var(--border-accent); transform:translateX(4px); box-shadow:var(--shadow-sm); }
    .chapter-item.read-status { opacity:0.7; }
    .chapter-item-left { display:flex; flex-direction:column; gap:4px; }
    .chapter-num { font-size:14px; font-weight:800; color:var(--text-primary); }
    .chapter-date { font-size:11px; color:var(--text-muted); }
    .chapter-item-right { font-size:12px; color:var(--accent-2); font-weight:700; background:rgba(124,58,237,0.1); padding:4px 10px; border-radius:var(--r-full); }
    .topbar-back-series { display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; font-size:14px; color:var(--text-primary); position:absolute; top:16px; left:16px; z-index:50; background:rgba(0,0,0,0.5); backdrop-filter:blur(10px); padding:8px 16px; border-radius:var(--r-full); color:white; border:1px solid rgba(255,255,255,0.2); }
    
    /* ===== COMIC READER PAGE ===== */
    #page-comic-reader { min-height:100vh; background:#000; flex-direction:column; position:relative; }
    .comic-topbar { position:fixed; top:0; left:0; right:0; height:60px; background:rgba(15,15,20,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; padding:0 20px; z-index:200; transition:transform 0.3s var(--ease); color:white; }
    .comic-topbar.hidden { transform:translateY(-100%); }
    .comic-bottombar { position:fixed; bottom:0; left:0; right:0; height:70px; background:rgba(15,15,20,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; gap:20px; padding:0 20px; z-index:200; transition:transform 0.3s var(--ease); color:white; }
    .comic-bottombar.hidden { transform:translateY(100%); }
    .comic-reader-title { font-size:15px; font-weight:800; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:50%; text-align:center; }
    .comic-action-btn { background:none; border:none; color:white; font-size:20px; cursor:pointer; padding:8px; border-radius:var(--r-md); transition:all 0.2s; display:flex; align-items:center; justify-content:center; opacity:0.8; }
    .comic-action-btn:hover { opacity:1; background:rgba(255,255,255,0.1); }
    .comic-content { flex:1; width:100%; max-width:800px; margin:0 auto; display:flex; flex-direction:column; align-items:center; padding-top:60px; padding-bottom:70px; min-height:100vh; }
    .comic-content.fullscreen { padding:0; max-width:100%; }
    .comic-page { width:100%; max-width:800px; display:block; object-fit:contain; margin:0 auto; user-select:none; -webkit-user-drag:none; opacity:0; transition:opacity 0.3s ease; }
    .comic-page.loaded { opacity:1; }
    .comic-mode-h { flex-direction:row; overflow-x:auto; overflow-y:hidden; scroll-snap-type:x mandatory; scroll-behavior:smooth; height:100vh; padding:0; }
    .comic-mode-h .comic-page { width:100vw; height:100vh; object-fit:contain; scroll-snap-align:center; flex-shrink:0; max-width:none; }
    .comic-mode-rtl { flex-direction:row-reverse; }
    .comic-nav-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; background:var(--gradient-accent); color:white; border-radius:var(--r-full); font-weight:700; border:none; cursor:pointer; }
    .comic-nav-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .comic-progress { font-size:13px; font-weight:700; font-variant-numeric:tabular-nums; }
    .comic-settings-modal { position:fixed; bottom:80px; right:20px; width:280px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r-xl); padding:20px; z-index:300; display:none; flex-direction:column; gap:16px; box-shadow:var(--shadow-lg); backdrop-filter:blur(30px); }
    .comic-settings-modal.open { display:flex; animation:popIn 0.3s var(--ease-spring); }
    .comic-setting-row { display:flex; justify-content:space-between; align-items:center; }
    .comic-setting-label { font-size:13px; font-weight:700; color:var(--text-primary); }
    .comic-dir-btn { padding:6px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--r-md); font-size:12px; font-weight:700; color:var(--text-secondary); cursor:pointer; }
    .comic-dir-btn.active { background:var(--gradient-accent); color:white; border-color:transparent; }
    .comic-tap-zone { position:fixed; top:60px; bottom:70px; width:30%; z-index:100; cursor:pointer; }
    .comic-tap-left { left:0; }
    .comic-tap-right { right:0; }
    .comic-tap-center { left:30%; right:30%; width:40%; z-index:90; }

</style></head><body><h1>${b.title}</h1><div class="meta">by ${b.author} &bull; ${b.genre} &bull; ${b.pages} pages</div><div class="desc">${b.description}</div>${chs}<script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
}
async function downloadEPUB(b){
  if(typeof JSZip==="undefined"){showToast("\u26a0\ufe0f JSZip loading\u2026 try again.");return;}
  const zip=new JSZip();
  const safeTitle=b.title.replace(/[^a-zA-Z0-9]/g,"_");
  const chs=b.chapters.map((ch,i)=>{
    const raw=CHAPTER_TEXT[b.id]?.[i];
    const html=raw?raw.split("\n\n").map(p=>`<p>${p.replace(/\n/g,"<br/>")}</p>`).join(""):genMock(ch.title);
    return{title:`Chapter ${i+1}: ${ch.title}`,id:`ch${i}`,html};
  });
  zip.file("mimetype","application/epub+zip",{compression:"STORE"});
  const mi=zip.folder("META-INF");
  mi.file("container.xml",'<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  const o=zip.folder("OEBPS");
  const mf=chs.map(c=>`<item id="${c.id}" href="${c.id}.xhtml" media-type="application/xhtml+xml"/>`).join("");
  const sp=chs.map(c=>`<itemref idref="${c.id}"/>`).join("");
  o.file("content.opf",'<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">Bangla Scan-'+b.id+'-'+Date.now()+'</dc:identifier><dc:title>'+b.title+'</dc:title><dc:creator>'+b.author+'</dc:creator><dc:language>en</dc:language><dc:subject>'+b.genre+'</dc:subject></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/>'+mf+'</manifest><spine>'+sp+'</spine></package>');
  o.file("style.css","body{font-family:Georgia,serif;font-size:1em;line-height:1.8;color:#1a1a1a;max-width:600px;margin:0 auto;padding:1em 2em;}h2{font-family:Arial,sans-serif;font-size:1.4em;margin-bottom:.3em;}p{margin-bottom:1.2em;text-indent:1.5em;}p:first-of-type{text-indent:0;}p:first-of-type::first-letter{font-size:3em;line-height:.8;float:left;margin:0 .1em 0 0;font-weight:700;color:#7c3aed;}");
  const nav=chs.map(c=>`<li><a href="${c.id}.xhtml">${c.title}</a></li>`).join("");
  o.file("nav.xhtml",'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body><nav epub:type="toc"><h1>Contents</h1><ol>'+nav+'</ol></nav></body></html>');
  chs.forEach(c=>{o.file(c.id+".xhtml",'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"/><title>'+c.title+'</title><link rel="stylesheet" href="style.css"/></head><body><h2>'+c.title+'</h2>'+c.html+'</body></html>');});
  const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=safeTitle+".epub";a.click();URL.revokeObjectURL(a.href);
}
function startDownload(format){
  const b=BOOKS.find(b=>b.id===bookId);
  if(!b){showToast("\u26a0\ufe0f No book open.");return;}
  if(format==="AudioBook"){closeDownloadModal();startAudioBook(b);return;}
  const bar=document.getElementById("dl-progress-bar");
  const fill=document.getElementById("dl-progress-fill");
  const st=document.getElementById("dl-status");
  const ow=document.getElementById("dl-options-wrap");
  bar.style.display="block";fill.style.width="0%";
  if(st){st.style.display="block";st.textContent="Preparing "+format+"\u2026";}
  if(ow)ow.style.display="none";
  let p=0;
  const int=setInterval(()=>{p+=Math.random()*10+6;if(p>=88){p=88;clearInterval(int);}fill.style.width=p+"%";},130);
  setTimeout(async()=>{
    try{
      if(format==="TXT")downloadTXT(b);
      else if(format==="PDF")downloadPDF(b);
      else if(format==="EPUB")await downloadEPUB(b);
      clearInterval(int);fill.style.width="100%";
      if(st)st.textContent="\u2705 Saved!";
      setTimeout(()=>{closeDownloadModal();showToast("\u2705 "+format+" \u2014 "+b.title);addActivity("\ud83d\udcbe","rgba(6,182,212,0.15)","Downloaded",b.title+" ("+format+")");},700);
    }catch(e){clearInterval(int);if(st)st.textContent="\u274c "+e.message;}
  },900);
}
// ==================== AUDIOBOOK TTS ====================
let ttsSynth=window.speechSynthesis,ttsBook=null,ttsChIdx=0,ttsPlaying=false;
let ttsSpeeds=[0.8,1,1.2,1.5,1.8],ttsSpeedIdx=1,ttsTimerInt=null,ttsElapsed=0,ttsTotal=0,ttsWordIdx=0,ttsWordCount=0;
function startAudioBook(b){
  stopAudio();
  ttsBook=b;ttsChIdx=b.currentChapter||0;ttsSpeedIdx=1;
  document.getElementById("audio-player").style.display="block";
  speakChapter();
  showToast("\ud83c\udfa7 AudioBook started!");
}
function getChapterPlainText(b,idx){
  const raw=CHAPTER_TEXT[b.id]?.[idx];
  return raw?raw.replace(/<[^>]+>/g,""):genMock(b.chapters[idx]?.title||"" ).replace(/<[^>]+>/g,"");
}
function speakChapter(){
  if(!ttsBook||ttsChIdx>=ttsBook.chapters.length)return;
  if(ttsSynth.speaking)ttsSynth.cancel();
  const ch=ttsBook.chapters[ttsChIdx];
  const txt="Chapter "+(ttsChIdx+1)+": "+ch.title+". "+getChapterPlainText(ttsBook,ttsChIdx);
  ttsWordCount=txt.split(/\s+/).length;ttsWordIdx=0;
  const wpm=160*ttsSpeeds[ttsSpeedIdx];
  ttsTotal=Math.ceil(ttsWordCount/wpm*60);ttsElapsed=0;
  document.getElementById("ap-title").textContent="Ch."+(ttsChIdx+1)+": "+ch.title;
  document.getElementById("ap-book").textContent=ttsBook.title+" \u00b7 "+ttsBook.author;
  updatePlayerTime();
  const utt=new SpeechSynthesisUtterance(txt);
  utt.rate=ttsSpeeds[ttsSpeedIdx];utt.pitch=1;utt.lang="en-US";
  utt.onboundary=e=>{if(e.name==="word"){ttsWordIdx++;document.getElementById("ap-progress-fill").style.width=Math.min(100,ttsWordIdx/ttsWordCount*100)+"%";}};
  utt.onend=()=>{clearInterval(ttsTimerInt);if(ttsPlaying&&ttsBook&&ttsChIdx<ttsBook.chapters.length-1){ttsChIdx++;speakChapter();}else{ttsPlaying=false;document.getElementById("ap-play-btn").innerHTML="&#9654;";}};
  utt.onerror=e=>{if(e.error!=="interrupted")showToast("\u26a0\ufe0f TTS: "+e.error);};
  ttsSynth.speak(utt);ttsPlaying=true;
  document.getElementById("ap-play-btn").innerHTML="&#9646;&#9646;";
  clearInterval(ttsTimerInt);
  ttsTimerInt=setInterval(()=>{if(ttsPlaying&&!ttsSynth.paused){ttsElapsed++;updatePlayerTime();}},1000);
}
function updatePlayerTime(){
  const fmt=s=>{const m=Math.floor(s/60),sec=s%60;return m+":"+(sec<10?"0":"")+sec;};
  document.getElementById("ap-elapsed").textContent=fmt(ttsElapsed);
  document.getElementById("ap-remaining").textContent=fmt(Math.max(0,ttsTotal-ttsElapsed));
}
function toggleAudio(){
  if(!ttsBook)return;
  if(ttsSynth.speaking&&!ttsSynth.paused){ttsSynth.pause();ttsPlaying=false;document.getElementById("ap-play-btn").innerHTML="&#9654;";}
  else if(ttsSynth.paused){ttsSynth.resume();ttsPlaying=true;document.getElementById("ap-play-btn").innerHTML="&#9646;&#9646;";}
  else{speakChapter();}
}
function stopAudio(){
  ttsSynth.cancel();clearInterval(ttsTimerInt);
  ttsPlaying=false;ttsBook=null;
  document.getElementById("audio-player").style.display="none";
}
function prevAudioChapter(){if(!ttsBook||ttsChIdx<=0)return;ttsChIdx--;ttsElapsed=0;speakChapter();}
function nextAudioChapter(){if(!ttsBook||ttsChIdx>=ttsBook.chapters.length-1)return;ttsChIdx++;ttsElapsed=0;speakChapter();}
function cycleSpeed(){
  ttsSpeedIdx=(ttsSpeedIdx+1)%ttsSpeeds.length;
  document.getElementById("ap-speed").textContent=ttsSpeeds[ttsSpeedIdx]+"\u00d7";
  if(ttsSynth.speaking){const was=!ttsSynth.paused;ttsSynth.cancel();ttsElapsed=0;if(was)speakChapter();}
}
function seekAudio(e){
  if(!ttsBook)return;
  const wrap=document.getElementById("ap-progress-wrap");
  const pct=e.offsetX/wrap.offsetWidth;
  ttsChIdx=Math.min(ttsBook.chapters.length-1,Math.floor(pct*ttsBook.chapters.length));
  ttsElapsed=0;speakChapter();
}

// ===================== SETTINGS =====================
function toggleSetting(k){
  settings_[k]=!settings_[k];
  document.getElementById("toggle-"+k)?.classList.toggle("on",settings_[k]);
  if(activeSession && USERS[activeSession]) { USERS[activeSession].settings = settings_; saveUsers(); }
}
function syncUI(){Object.keys(settings_).forEach(k=>document.getElementById("toggle-"+k)?.classList.toggle("on",settings_[k]));const inp=document.getElementById("profile-name-input");if(inp&&U)inp.value=U.name;}
function saveProfile(){
  const inp=document.getElementById("profile-name-input");
  if(inp?.value.trim()){
    U.name=inp.value.trim();
    if(activeSession && USERS[activeSession]) { USERS[activeSession].name = U.name; saveUsers(); }
    updateUI();
    showToast("✅ Profile saved!");
  }
}
function confirmClearData(){openModal("Clear Reading Data","This will reset all reading progress and stats. Cannot be undone.",()=>{progress={};stats_={booksRead:0,pagesRead:0,hoursRead:0};activities_=[];weekly_=[0,0,0,0,0,0,0];monthly_=[0,0,0,0,0,0,0,0,0,0,0,0];streak_={current:0,best:0,lastDate:""};saveSessionData();updateUI();renderCR();renderHomeGrid();renderLib("all");showToast("🗑️ Data cleared.");});}

// ===================== MODAL =====================
function openModal(title,desc,cb){document.getElementById("modal-title").textContent=title;document.getElementById("modal-desc").textContent=desc;modalCb=cb;document.getElementById("confirm-modal").classList.add("open");}
function closeModal(){document.getElementById("confirm-modal").classList.remove("open");modalCb=null;}
function modalConfirm(){if(modalCb)modalCb();closeModal();}

// ===================== SEARCH =====================
function handleSearch(q){
  if(!q.trim())return;navTo("explore");const lq=q.toLowerCase();
  const all=[...BOOKS,...WISHLIST].filter(b=>b.title.toLowerCase().includes(lq)||b.author.toLowerCase().includes(lq)||b.genre.toLowerCase().includes(lq));
  document.getElementById("explore-grid").innerHTML=all.length?all.map(bc).join(""):`<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No results for "${q}"</div></div>`;
}

// ===================== PERSISTENCE =====================
function saveProgress(){
  if(activeSession && USERS[activeSession]) {
    USERS[activeSession].progress = progress;
    saveUsers();
  }
}
function loadProgress(){
  // Handled in startSession
}

// ===================== CONFETTI =====================
function spawnConfetti(){const cs=["#7c3aed","#a78bfa","#06b6d4","#f59e0b","#ec4899","#10b981"];for(let i=0;i<28;i++)setTimeout(()=>{const el=document.createElement("div");el.className="confetti-piece";el.style.cssText=`left:${Math.random()*100}vw;top:-10px;background:${cs[Math.floor(Math.random()*cs.length)]};transform:rotate(${Math.random()*360}deg);animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*0.5}s`;document.body.appendChild(el);setTimeout(()=>el.remove(),4000);},i*35);}

// ===================== TOAST =====================
function showToast(msg){const t=document.getElementById("bookmark-toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}

// ===================== KEYBOARD =====================
document.addEventListener("keydown",e=>{
  const pg=document.querySelector(".page.active");if(!pg)return;
  if(pg.id==="page-reader"){
    if(e.key==="Escape"){settingsOpen?toggleReaderSettings():tocOpen?toggleToc():void 0;}
    if(e.key==="ArrowRight")nextChapter();if(e.key==="ArrowLeft")prevChapter();if(e.key==="b")addBookmark();
  }else if(e.key==="Escape")closeModal();
});

// ===================== ADMIN PANEL =====================
const ADMIN_EMAIL = "admin@Bangla Scan.io";
let adminPassword = "admin2024";
let admLogs = [];
let adminSettings = { allowReg: true, maintenance: false, downloads: true, tracking: true };
let admCurrentFilter = 'all';

function loadAdminState() {
  try {
    const st = localStorage.getItem('Bangla Scan_admin_settings');
    if (st) {
      const p = JSON.parse(st);
      if (p.pw) adminPassword = p.pw;
      if (p.toggles) adminSettings = p.toggles;
    }
    const lg = localStorage.getItem('Bangla Scan_admin_logs');
    if (lg) admLogs = JSON.parse(lg);
  } catch(e) {}
}
function saveAdminState() {
  try {
    localStorage.setItem('Bangla Scan_admin_settings', JSON.stringify({ pw: adminPassword, toggles: adminSettings }));
    localStorage.setItem('Bangla Scan_admin_logs', JSON.stringify(admLogs));
  } catch(e) {}
}
loadAdminState();

let admClockInt = null;

function openAdminPanel(){
  admLog('ok','Admin session started by '+U.email);
  showPage('admin');
  admInitDashboard();
  admStartClock();

  // Initialize settings toggles
  const tgls = ['allowReg', 'maintenance', 'downloads', 'tracking'];
  tgls.forEach(k => {
    const el = document.getElementById('adm-tgl-' + k);
    if(el) el.classList.toggle('on', !!adminSettings[k]);
  });
}
function closeAdminPanel(){
  clearInterval(admClockInt);
  showPage('dashboard');
}

function admStartClock(){
  const el = document.getElementById('adm-clock');
  const tick = ()=>{ if(el) el.textContent = new Date().toLocaleTimeString(); };
  tick(); admClockInt = setInterval(tick,1000);
}

function toggleAdmSidebar(){
  const s = document.querySelector('.adm-sidebar');
  if(s) s.classList.toggle('open');
}

function toggleAdmDropdown(){
  const menu = document.getElementById('adm-nav-more-menu');
  const caret = document.getElementById('adm-more-caret');
  if(menu.style.display === 'none') {
    menu.style.display = 'flex';
    if(caret) caret.innerHTML = '&#x25B2;';
  } else {
    menu.style.display = 'none';
    if(caret) caret.innerHTML = '&#x25BC;';
  }
}

function admNav(sec){
  const sidebar = document.querySelector('.adm-sidebar');
  if(sidebar && window.innerWidth <= 767) sidebar.classList.remove('open');
  document.querySelectorAll('.adm-sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.adm-nav-item').forEach(n=>n.classList.remove('active'));
  const s = document.getElementById('adm-'+sec);
  const n = document.getElementById('adm-nav-'+sec);
  if(s) s.classList.add('active');
  if(n) n.classList.add('active');
  
  if(sec==='library') admRenderBooks();
  if(sec==='updates') admRefreshUpdates();
  if(sec==='history') admRenderHistory();
  if(sec==='settings') admRenderStorageInfo();
}

// ---- Aggregate all users' data from localStorage ----
function admGetAllUsers(){
  try{ return JSON.parse(localStorage.getItem('Bangla Scan_users')||'{}'); }catch(e){ return {}; }
}

function admInitDashboard(){
  admNav('library');
}

function admUpdateFilter(mode, el) {
  document.querySelectorAll('#adm-updates .adm-filter').forEach(f=>f.classList.remove('on'));
  el.classList.add('on');
  admRefreshUpdates();
}

function admRefreshUpdates() {
    // Mock updates fetch
    const list = document.getElementById('adm-latest-updates-list');
    if(list) list.innerHTML = `<div class="adm-log-item"><div class="adm-log-dot dot-info"></div><div class="adm-log-msg">Platform synced successfully.</div><div class="adm-log-time">Just now</div></div>`;
    showToast('Updates refreshed.');
}

function admRenderHistory() {
  const el = document.getElementById('adm-history-timeline');
  if(!el) return;
  const filtered = admLogs; // Can be filtered
  if(!filtered.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px">No activity recorded yet.</div>'; return; }
  el.innerHTML = filtered.map(l=>`<div class="adm-log-item"><div class="adm-log-dot dot-${l.type||'info'}"></div><div class="adm-log-msg">${l.msg}</div><div class="adm-log-time">${l.time}</div></div>`).join('');
}

function admRefreshHistory() {
  admRenderHistory();
  showToast('History refreshed.');
}

function admClearHistory() {
  openModal('Clear History', 'Are you sure you want to clear all history logs?', () => {
    admLogs = [];
    saveAdminState();
    admRenderHistory();
    showToast('🗑️ History cleared.');
  });
}

function admLoadBrowser() {
    const url = document.getElementById('adm-browser-url').value;
    const frame = document.getElementById('adm-browser-frame');
    if(!url) {
        frame.innerHTML = '<div style="font-size:32px;">&#x26A0;&#xFE0F;</div><div>Please enter a valid URL</div>';
        return;
    }
    frame.innerHTML = `<div style="font-size:32px;">&#x1F30D;</div><div style="text-align:center;">Embed functionality disabled due to cross-origin restrictions.<br><br>Target: ${url}</div>`;
}

// Old user functionality placeholders since UI is simplified
function admFilterUsers(){}
function admUserFilter(){}
function admBanUser(e){}
function admViewUser(e){}
function admEditUser(e){}
function admSaveUser(){}



let currentLibCat = 'all';
let currentLibSort = 'latest';
let currentLibSearch = '';

function admFilterLibraryCategory(val) { currentLibCat = val; admRenderBooks(); }
function admSortLibrary(val) { currentLibSort = val; admRenderBooks(); }
function admFilterBooks(val) { currentLibSearch = val.toLowerCase(); admRenderBooks(); }

function admRenderBooks(){
  const el=document.getElementById('adm-books-grid');if(!el)return;
  const icons=['&#x1F31F;','&#x1F680;','&#x1F50F;','&#x1F5FA;&#xFE0F;','&#x26A1;','&#x1F3AD;'];
  
  let books = [...BOOKS];
  if(currentLibSearch.length > 1) {
      books = books.filter(b=>b.title.toLowerCase().includes(currentLibSearch)||b.author.toLowerCase().includes(currentLibSearch));
  }
  if(currentLibCat !== 'all') {
      books = books.filter(b=>b.genre === currentLibCat);
  }
  if(currentLibSort === 'az') books.sort((a,b)=>a.title.localeCompare(b.title));
  else if(currentLibSort === 'za') books.sort((a,b)=>b.title.localeCompare(a.title));
  else books.sort((a,b)=>b.id - a.id); // latest
  
  if(!books.length) { el.innerHTML = '<div style="color:var(--text-muted);padding:20px;">No books found matching criteria.</div>'; return; }
  
  el.innerHTML=books.map((b,i)=>`<div class="adm-book-card">
    <div class="adm-book-img">${icons[i%icons.length]}</div>
    <div class="adm-book-body">
      <div class="adm-book-name">${b.title}</div>
      <div class="adm-book-auth">${b.author}</div>
      <div class="adm-book-row"><span class="adm-chip">${b.genre}</span><span class="adm-chip">&#x2B50; ${b.rating||0}</span><span class="adm-chip">${b.pages}p</span></div>
      <div class="adm-book-acts">
        <button class="adm-act-btn b" onclick="admEditBook(${b.id})">Edit</button>
        <button class="adm-act-btn g" onclick="admFeatureBook(${b.id})">${b.featured?'Unfeature':'Feature'}</button>
        <button class="adm-act-btn r" onclick="admDeleteBook(${b.id})">Del</button>
      </div>
    </div>
  </div>`).join('');
}

function admShowAddBook() {
  document.getElementById('adm-book-modal-title').textContent = 'Add New Book';
  document.getElementById('adm-book-id').value = '';
  document.getElementById('adm-book-title').value = '';
  document.getElementById('adm-book-author').value = '';
  document.getElementById('adm-book-genre').value = 'Fantasy';
  document.getElementById('adm-book-pages').value = '';
  document.getElementById('adm-book-cover').value = '';
  document.getElementById('adm-book-desc').value = '';
  document.getElementById('adm-book-rating').value = '0';
  document.getElementById('adm-book-modal').classList.add('open');
}

function admEditBook(id){
  const b=BOOKS.find(b=>b.id===id);
  if(!b) return;
  document.getElementById('adm-book-modal-title').textContent = 'Edit Book';
  document.getElementById('adm-book-id').value = b.id;
  document.getElementById('adm-book-title').value = b.title || '';
  document.getElementById('adm-book-author').value = b.author || '';
  document.getElementById('adm-book-genre').value = b.genre || 'Fantasy';
  document.getElementById('adm-book-pages').value = b.pages || '';
  document.getElementById('adm-book-cover').value = b.cover || '';
  document.getElementById('adm-book-desc').value = b.description || '';
  document.getElementById('adm-book-rating').value = b.rating || 0;
  document.getElementById('adm-book-modal').classList.add('open');
}

function admSaveBook() {
  const idVal = document.getElementById('adm-book-id').value;
  const title = document.getElementById('adm-book-title').value.trim();
  const author = document.getElementById('adm-book-author').value.trim();
  const genre = document.getElementById('adm-book-genre').value;
  const pages = parseInt(document.getElementById('adm-book-pages').value) || 0;
  const cover = document.getElementById('adm-book-cover').value.trim();
  const description = document.getElementById('adm-book-desc').value.trim();
  const rating = parseFloat(document.getElementById('adm-book-rating').value) || 0;

  if(!title || !author) { showToast('⚠️ Title and Author are required.'); return; }

  if(idVal === '') {
    // Add new
    const newId = BOOKS.length > 0 ? Math.max(...BOOKS.map(b=>b.id)) + 1 : 1;
    BOOKS.push({ id: newId, title, author, genre, pages, cover: cover||'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'260\'%3E%3Crect width=\'180\' height=\'260\' fill=\'%23333\'/%3E%3C/svg%3E', rating, description, chapters: [] });
    admLog('ok', 'Added new book: ' + title);
    showToast('✅ Book added!');
  } else {
    // Edit existing
    const id = parseInt(idVal);
    const idx = BOOKS.findIndex(b=>b.id===id);
    if(idx > -1) {
      BOOKS[idx] = { ...BOOKS[idx], title, author, genre, pages, description, rating };
      if(cover) BOOKS[idx].cover = cover;
      admLog('ok', 'Edited book: ' + title);
      showToast('✅ Book updated!');
    }
  }
  saveBooks();
  document.getElementById('adm-book-modal').classList.remove('open');
  admRenderBooks();
}

function admDeleteBook(id) {
  const idx = BOOKS.findIndex(b=>b.id===id);
  if(idx === -1) return;
  const title = BOOKS[idx].title;
  openModal('Delete Book', 'Are you sure you want to delete "' + title + '"? This will remove it from the library for all users.', () => {
    BOOKS.splice(idx, 1);
    saveBooks();
    admLog('warn', 'Deleted book: ' + title);
    admRenderBooks();
    showToast('🗑️ Book deleted: ' + title);
  });
}

function admFeatureBook(id){
  const b=BOOKS.find(b=>b.id===id);
  if(b){
    b.featured = !b.featured;
    saveBooks();
    showToast(b.featured ? '⭐ Featured: '+b.title : 'Unfeatured: '+b.title);
    admLog('ok', (b.featured ? 'Featured' : 'Unfeatured') + ' book: '+b.title);
    admRenderBooks();
  }
}

// ---- Reports ----
function admRenderReports(){
  const users=admGetAllUsers();
  const keys=Object.keys(users);
  let totalR=0,totalP=0,totalH=0,totalS=0;
  keys.forEach(e=>{const u=users[e];totalR+=u.stats?.booksRead||0;totalP+=u.stats?.pagesRead||0;totalH+=u.stats?.hoursRead||0;totalS+=u.streak?.best||0;});
  const el=document.getElementById('adm-report-stats');
  if(el)el.innerHTML=`Total Users: <strong style="color:#f0f4ff">${keys.length}</strong><br>Total Books Read: <strong style="color:#f0f4ff">${totalR}</strong><br>Total Pages: <strong style="color:#f0f4ff">${totalP}</strong><br>Total Hours: <strong style="color:#f0f4ff">${totalH.toFixed(1)}</strong><br>Best Streak (sum): <strong style="color:#f59e0b">${totalS} days</strong>`;
  const tbody=document.getElementById('adm-report-tbody');
  if(tbody)tbody.innerHTML=keys.map(email=>{
    const u=users[email];
    return `<tr><td style="color:#9ca3af">${u.name||email}</td><td class="adm-stat-number">${u.stats?.booksRead||0}</td><td class="adm-stat-number">${u.stats?.pagesRead||0}</td><td class="adm-stat-number">${(u.stats?.hoursRead||0).toFixed(1)}h</td><td class="adm-stat-number">${u.streak?.best||0} days</td></tr>`;
  }).join('');
}

function admExportReport(type){
  const users=admGetAllUsers();const keys=Object.keys(users);
  if(type==='csv'){
    let csv='Name,Email,BooksRead,PagesRead,HoursRead,BestStreak\n';
    keys.forEach(e=>{const u=users[e];csv+=`"${u.name||''}","${e}",${u.stats?.booksRead||0},${u.stats?.pagesRead||0},${(u.stats?.hoursRead||0).toFixed(1)},${u.streak?.best||0}\n`;});
    const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Bangla Scan_report.csv';a.click();
  } else {
    const blob=new Blob([JSON.stringify(users,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Bangla Scan_report.json';a.click();
  }
  admLog('ok','Report exported as '+type.toUpperCase());
  showToast('&#x2705; Report exported as '+type.toUpperCase());
}

// ---- Analytics ----
function admRenderAnalytics(){
  admInitDashboard();
  const el=document.getElementById('adm-top-books-chart');if(!el)return;
  const users=admGetAllUsers();
  const bookProgress={};
  BOOKS.forEach(b=>{ bookProgress[b.id]={title:b.title,total:0,count:0}; });
  Object.values(users).forEach(u=>{
    if(u.progress)Object.keys(u.progress).forEach(id=>{if(bookProgress[id]){bookProgress[id].total+=u.progress[id];bookProgress[id].count++;}});
  });
  const sorted=Object.values(bookProgress).sort((a,b)=>b.total-a.total);
  el.innerHTML=sorted.map(b=>`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:#9ca3af">${b.title}</span><span style="color:#f0f4ff;font-weight:700">${b.count} readers</span></div><div class="adm-progress"><div class="adm-progress-fill" style="width:${b.count?Math.min(100,b.total/b.count||0):0}%"></div></div></div>`).join('');
}

// ---- Logs ----
function admLog(type,msg){
  admLogs.unshift({type,msg,time:new Date().toLocaleTimeString()});
  if(admLogs.length>100)admLogs.pop();
  saveAdminState();
}
function admRenderLogs(){
  const el=document.getElementById('adm-logs-list');if(!el)return;
  const filtered=admCurrentFilter==='all'?admLogs:admLogs.filter(l=>l.type===admCurrentFilter);
  if(!filtered.length){el.innerHTML='<div style="color:#374151;font-size:13px;padding:20px">No logs to display.</div>';return;}
  el.innerHTML=filtered.map(l=>`<div class="adm-log-item"><div class="adm-log-dot dot-${l.type}"></div><div class="adm-log-msg">${l.msg}</div><div class="adm-log-time">${l.time}</div></div>`).join('');
}
function admLogFilter(mode,el){
  admCurrentFilter=mode;
  document.querySelectorAll('#adm-logs .adm-filter').forEach(f=>f.classList.remove('on'));
  el.classList.add('on');
  admRenderLogs();
}
function admClearLogs(){admLogs=[];saveAdminState();admRenderLogs();showToast('&#x1F9F9; Logs cleared.');}

// ---- Settings ----
function admChangePassword(){
  const p1=document.getElementById('adm-pw-inp')?.value;
  const p2=document.getElementById('adm-pw2-inp')?.value;
  if(!p1||p1.length<6){showToast('&#x26A0;&#xFE0F; Password must be 6+ chars.');return;}
  if(p1!==p2){showToast('&#x26A0;&#xFE0F; Passwords do not match.');return;}
  adminPassword=p1;
  saveAdminState();
  admLog('ok','Admin password changed.');
  showToast('&#x2705; Admin password updated!');
}
function admBroadcast(){
  const msg=document.getElementById('adm-broadcast-msg')?.value?.trim();
  if(!msg){showToast('&#x26A0;&#xFE0F; Message is empty.');return;}
  adminSettings.broadcast = msg;
  saveAdminState();
  showToast('&#x1F4E3; '+msg);
  admLog('ok','Broadcast sent: '+msg);
}
function admToggleSetting(key, el) {
  adminSettings[key] = !adminSettings[key];
  saveAdminState();
  el.classList.toggle('active', adminSettings[key]);
  admLog('warn', key + ' changed to ' + adminSettings[key]);
}
function admRenderStorageInfo(){
  let total=0;try{Object.keys(localStorage).forEach(k=>{total+=localStorage.getItem(k)?.length||0;});}catch(e){}
  const el=document.getElementById('adm-storage-info');
  if(el)el.textContent='localStorage used: ~'+(total/1024).toFixed(1)+' KB';
}
function admExportAllData(){
  const data={users:admGetAllUsers(),exported:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Bangla Scan_backup.json';a.click();
  admLog('ok','Full data backup downloaded.');
  showToast('&#x2705; Backup downloaded!');
}
function admNukeAllData(){
  openModal('DANGER: Clear ALL Data','This will permanently delete all user accounts and reading data. This cannot be undone.',()=>{
    localStorage.removeItem('Bangla Scan_users');
    admLog('err','ALL USER DATA CLEARED by admin.');
    showToast('&#x1F4A5; All data cleared. Reloading...');
    setTimeout(()=>location.reload(),1500);
  });
}

// Initialize App

enter();
