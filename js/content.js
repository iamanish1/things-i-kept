/* ==========================================================================
   THINGS I KEPT — CONTENT
   --------------------------------------------------------------------------
   Everything personal lives in this file. You should never need to open
   index.html or script.js to change words, dates, photos or audio.

   How to edit
   • New line inside any text:  \n        Blank line (new paragraph):  \n\n
   • Image / audio paths are relative to index.html, e.g.
       "assets/images/memories/day-01.jpg"
     (no leading slash — that keeps it working when opened as a file).
   • A missing file never breaks anything: the site shows a quiet,
     intentional placeholder instead ("Some memories don't need a photograph").
   • Set an optional field to null to hide it completely.

   Search this file for  ✎  to jump between the places you should personalise.
   ========================================================================== */


/* --------------------------------------------------------------------------
   DEVELOPER SWITCHES
   -------------------------------------------------------------------------- */

// ✎ true  → skip the countdown and open the site immediately (while you build).
//   false → the site stays locked until CONFIG.unlockAt.
//   ⚠ SET THIS TO false BEFORE YOU SEND HER THE LINK.
//   (While true, sealed letters in Chapter 04 can also be opened early.)
const DEV_MODE = true;

// Rehearse the midnight moment: set a number of seconds (e.g. 10) and the lock
// screen will count down from that, then unlock. Works regardless of DEV_MODE.
// Keep it null for the real thing.
const DEV_COUNTDOWN_SECONDS = null;


/* --------------------------------------------------------------------------
   GENERAL
   -------------------------------------------------------------------------- */

const CONFIG = {
    // ✎ Her name. Used once, softly, on the final page. Leave "" to keep it unnamed.
    girlfriendName: "",

    // ✎ The exact moment the site unlocks, in HER phone's local time.
    //   Format: YYYY-MM-DDTHH:MM:SS
    unlockAt: "2026-10-02T00:00:00",

    // ✎ Dates as they appear on screen.
    startedOn: "02.09.2026",
    anniversaryOn: "02.10.2026",
    anniversaryLabel: "02 • 10 • 2026",

    // Lock screen (before midnight).
    heroMessage: "For the girl who somehow became\nmy favourite part of my days.",
    countdownLabel: "Our first chapter unlocks in",

    // Welcome screen.
    welcomeLead: "Welcome to",
    introMessage: "A small place where I kept\nall the little things that became\nimportant to me.",

    // The first thing she reads after pressing "Start Our Story".
    // Each item is one stanza; they appear one after another. The last one is highlighted.
    prologue: [
        "I don't have hundreds of pictures of us.\nAnd maybe that's okay.",
        "Because I do have your pictures saved in my phone,\nbut the moments we lived together…\nI keep those somewhere else.",
        "In my heart.\nAnd, I hope, in yours.",
        "We were too busy living our little moments\nto stop and capture every one of them.",
        "Some memories were never meant for a camera.\nThey were meant to be lived.",
        "So I kept them here —\nnot as photographs,\nbut as little pieces of us\nthat I never want to forget. ❤️"
    ],

    // Shown only when she arrives through the QR code on the physical card.
    // (Make the QR code point to your URL ending in  ?from=card )
    foundEarlyMessage: "You found it early.\nSome things are worth waiting for.",
    foundMessage: "You found the secret door.",

    // ✎ Optional background music (she turns it on herself — it never autoplays).
    backgroundMusic: "assets/audio/Ed Sheeran - Perfect.mp3",
    musicMissingMessage: "The song for this place is still being chosen.",

    // How letters and notes are signed.
    signature: "— Always, me"
};


/* --------------------------------------------------------------------------
   CHAPTERS  (titles, numbers and the short line under each)
   Changing an id here is not needed — only edit the words.
   -------------------------------------------------------------------------- */

const chapters = [
    {
        id: "before-you",
        number: "01",
        title: "Before You",
        description: "The ordinary days, just before.",
        intro: null
    },
    {
        id: "first-month",
        number: "02",
        title: "The First Month",
        description: "Thirty days. One big feeling.",
        intro: "30 days.\nSo many little moments.\nOne big feeling."
    },
    {
        id: "things-i-notice",
        number: "03",
        title: "Things I Notice",
        description: "What I see, but rarely say.",
        intro: "All the little things I see,\nbut maybe never say out loud."
    },
    {
        id: "twelve-letters",
        number: "04",
        title: "12 Letters",
        description: "For every kind of moment.",
        intro: "Different moments.\nDifferent feelings.\nAlways for you."
    },
    {
        id: "what-you-mean",
        number: "05",
        title: "What You Mean To Me",
        description: "A bouquet that only exists here.",
        intro: null
    },
    {
        id: "our-future",
        number: "06",
        title: "Our Future",
        description: "The next chapter, together.",
        intro: null
    },
    {
        id: "if-i-could",
        number: "07",
        title: "If I Could Be There...",
        description: "For the next few moments, pretend I am.",
        intro: null
    }
];


/* --------------------------------------------------------------------------
   CHAPTER 01 — BEFORE YOU
   -------------------------------------------------------------------------- */

const beforeYou = {
    title: "Before You",

    // The opening line(s), revealed one block at a time.
    opening: [
        "Tumse pehle life honestly kaafi normal si thi."
    ],

    // ✎ Your "diary page" — life just before her. One item = one paragraph.
    paragraphs: [
        "Subah uthna, college/office jaana, apna kaam karna, coding mein laga rehna...\nphir gym jaana, kabhi workout karna aur kabhi bas mann nahi karta tha 😭",
        "Uske baad doston ke saath timepass, gaming, random bakchodi...\naur raat ko room mein aake phone chalana.\nKabhi kuch naya karne ka plan, kabhi pura din bas chill.",
        "Life buri nahi thi meri.\nBas same si thi.",
        "Roz kuch na kuch hota tha, but honestly aisa kuch nahi tha jisko main din khatam hone ke baad baith ke yaad karu."
    ],

    // ✎ A tiny timeline of an ordinary day, before.
    //   note → optional handwritten aside under the entry.
    ordinaryDay: [
        { time: "07:00", title: "Gym", text: "Aaj pakka proper workout karunga.", note: "(Mostly nahi hua 😭)" },
        { time: "10:00", title: "College / Office", text: "Laptop kholo → kaam karo → coding karo → kuch naya seekho → repeat." },
        { time: "19:30", title: "Friends", text: "Thodi bakchodi, thoda gossip, thoda timepass 😂" },
        { time: "22:00", title: "Gaming", text: "Bas ek game aur...", note: "(Phir 2 ghante nikal gaye.)" },
        { time: "00:30", title: "Me time", text: "Phone haath mein, random scrolling, music...\naur phir sochta tha kal jaldi uthunga." }
    ],

    // ✎ Optional handwritten note under the diary page (null to hide).
    marginNote: null,

    // The turning point, then the line that lands with the warm glow.
    turn: "Phir tum meri life mein aayi.",
    climax: null,           // optional big one-liner, e.g. "you happened."
    closing: "Aur mujhe pata bhi nahi chala ki kab meri normal si life mein\ntum itni important ho gayi. ❤️"
};


/* --------------------------------------------------------------------------
   CHAPTER 02 — THE FIRST MONTH  (the interactive timeline)
   --------------------------------------------------------------------------
   day       → 1 to 30. Positions the moment along the 30-day line.
   image     → ✎ a photo or screenshot, e.g. "assets/images/memories/day-01.jpg".
               Missing file = elegant placeholder.  null = text-only card.
   time/date → optional, set to null to hide.
   note      → optional handwritten line at the bottom of the card.
   -------------------------------------------------------------------------- */

// ✎ The timeline moves to the next moment on its own every this-many seconds.
//   Set to 0 to turn it off (she can still tap each day).
const TIMELINE_AUTOPLAY_SECONDS = 6;

const timeline = [
    {
        day: 1,
        label: "The beginning",
        title: "The beginning",
        date: "02 September 2026",
        time: null,
        text: "The first conversation.\n\nI don't think either of us knew it was the first of anything. It just felt easy — like talking to someone I'd already met.",
        image: "assets/images/memories/Day1.jpeg",
        imageAlt: "Her, in a light blue top, looking straight into the camera",
        note: "I still have it."
    },
    {
        day: 4,
        label: "The calls",
        title: "The calls",
        date: "05 September 2026",
        time: null,
        text: "The calls started.\n\n\"Just five minutes\" — and then somehow it was midnight.\nI took a picture of my laptop screen because I didn't want to forget that face.",
        image: "assets/images/memories/Day2.jpeg",
        imageAlt: "Her on a video call on my laptop, pouting at the camera",
        note: null
    },
    {
        day: 7,
        label: "Getting closer",
        title: "Getting closer",
        date: "08 September 2026",
        time: null,
        text: "A week in, and I'd started checking my phone for one name only.\n\nThe conversations got longer.\nThe good nights got later.",
        image: "assets/images/memories/Day3.jpeg",
        imageAlt: "Her smiling in a pink embroidered kurta, showing off her bangles",
        note: null
    },
    {
        day: 14,
        label: "That moment",
        title: "That moment",
        date: "15 September 2026",
        time: "11:42 PM",
        text: "This was the day I realised this wasn't just another conversation.\n\nYou said something small —\nand somehow, I remembered it.",
        image: "assets/images/memories/Day4.jpeg",
        imageAlt: "Her in a white suit, looking back over her shoulder",
        note: "I still remember exactly where I was."
    },
    {
        day: 21,
        label: "Realising more",
        title: "Realising more",
        date: "22 September 2026",
        time: null,
        text: "Three weeks, and I noticed I'd started telling you things first.\n\nGood news. Bad news. Completely pointless news.\nYou became the person I wanted to tell.",
        image: "assets/images/memories/Day5.jpeg",
        imageAlt: "Her at college with a flower in her hair",
        note: null
    },
    {
        day: 25,
        label: "Just you",
        title: "Just you",
        date: "26 September 2026",
        time: null,
        text: "No reason for this one.\n\nSome pictures I keep because of what happened that day.\nThis one I keep just because it's you.",
        image: "assets/images/memories/Day6.jpeg",
        imageAlt: "A tilted selfie of her with a flower filter",
        note: null
    },
    {
        day: 30,
        label: "Here we are",
        title: "Here we are",
        date: "02 October 2026",
        time: "12:00 AM",
        text: "One month.\n\nIt isn't very long. But it's already full of things I don't want to lose.\n\nSo I built somewhere to keep them.",
        // Day7.jpeg was saved sideways; this is an upright copy of it.
        image: "assets/images/memories/Day7-upright.jpeg",
        imageAlt: "The two of us together, her with a flower in her hair",
        note: "Happy one month."
    }
];


/* --------------------------------------------------------------------------
   CHAPTER 03 — THINGS I NOTICE  (10–15 feels right)
   Starting a note with "I notice" styles those words separately.
   -------------------------------------------------------------------------- */

const observations = [
    "I notice how your mood changes\nwhen you're excited.",
    "I notice the way you type\nwhen you're angry.",
    "I notice the smallest details\nabout you.",
    "I notice your little reactions\nwhen you're happy.",
    "I notice how your voice changes\nwhen you're tired.",
    "I notice you go quiet\nright before you say something important.",
    "I notice you always reply faster\nwhen it's late at night.",
    "I notice the way you laugh\nat your own jokes first.",
    "I notice how you take care of everyone\nand forget about yourself.",
    "I notice when you're pretending\nyou're fine.",
    "I notice how you say my name\nwhen you want something.",
    "I notice the little pause\nbefore you say good night."
];

const observationsClosing = "And I haven't stopped noticing.";


/* --------------------------------------------------------------------------
   CHAPTER 04 — 12 LETTERS
   --------------------------------------------------------------------------
   title      → shown on the envelope ("Open when …" is styled automatically).
   text       → ✎ the letter. Use \n\n between paragraphs.
   image      → optional photo inside the letter, e.g. "assets/images/letters/01.jpg".
   date       → optional line under the title.
   mood       → the colour the room turns while she reads:
                "rose" | "lavender" | "candle" | "burgundy" | "dusk"
   unlockDate → optional "YYYY-MM-DD". The envelope stays sealed until then.
   -------------------------------------------------------------------------- */

const letters = [
    {
        title: "Open when you miss me",
        text: "If you're reading this, you miss me.\n\nGood. I mean — not good. But also a little bit good, because it means that wherever you are right now, you're thinking about me too.\n\nClose your eyes for a second. I'm probably thinking about you right now. I usually am.\n\nText me. Even if it's just one word. Especially if it's late.",
        image: null,
        date: null,
        mood: "lavender"
    },
    {
        title: "Open when you're sad",
        text: "I wish I could be there right now, doing nothing except sitting next to you.\n\nYou don't have to explain it. You don't have to be okay yet.\n\nThe version of you that's sad today is still the girl I'm completely taken by. Nothing about today changes that.\n\nDrink some water. Find a blanket. Call me if you want to — I'll pick up.",
        image: null,
        date: null,
        mood: "dusk"
    },
    {
        title: "Open when you're angry with me",
        text: "Okay. I probably deserve this one.\n\nYou're allowed to be angry. I'd rather you tell me than keep it inside, even if it comes out loud.\n\nBut when you're ready — even a little — come and talk to me. I'd rather fix it with you than be right without you.\n\nAnd I'm sorry. Whatever it was. I mean it.",
        image: null,
        date: null,
        mood: "burgundy"
    },
    {
        title: "Open when you feel alone",
        text: "You're not.\n\nMaybe there's no one in the room right now, but you're in my head far more than you'd believe. On the way to places. In the middle of conversations. Right before I sleep.\n\nThere is someone out here who is always, quietly, on your side.\n\nThat's me. That part isn't going anywhere.",
        image: null,
        date: null,
        mood: "dusk"
    },
    {
        title: "Open when you need reassurance",
        text: "Here it is, in writing, so you can come back to it whenever you need to:\n\nI'm not going anywhere.\n\nI chose you on an ordinary day, and I keep choosing you on all the ordinary days after. Not because I have to. Because it's the easiest thing I do.",
        image: null,
        date: null,
        mood: "rose"
    },
    {
        title: "Open when you doubt yourself",
        text: "I've watched you do hard things like they were nothing. I've watched you care about people who didn't make it easy. I've watched you be brave without calling it bravery.\n\nYou are so much more than the voice in your head is telling you right now.\n\nIf you can't believe in yourself today, borrow some of my belief in you. I have more than enough.",
        image: null,
        date: null,
        mood: "candle"
    },
    {
        title: "Open when you want to laugh",
        text: "Think about the most ridiculous thing we've ever said to each other at two in the morning.\n\nYes. That one.\n\nNow imagine me reading it out loud, very seriously, like the evening news.\n\nYou're smiling. I can tell.",
        image: null,
        date: null,
        mood: "candle"
    },
    {
        title: "Open when we fight",
        text: "We're going to fight sometimes. That's okay. It only means we both care about something.\n\nSo here's a promise, written down on a calm day:\n\nIt's us against the problem. Never me against you.\n\nLet's both take a breath. Then let's talk. I'll go first if you want.",
        image: null,
        date: null,
        mood: "burgundy"
    },
    {
        title: "Open when you want to remember our first month",
        text: "Day one: we had no idea.\nDay seven: I started waiting for your messages.\nDay fourteen: I knew.\nDay thirty: here we are.\n\nOne month. It went by so fast, and somehow it already feels like I've known you much longer.\n\nThank you for every single day of it.",
        image: null,
        date: "Written in September 2026",
        mood: "rose"
    },
    {
        title: "Open on our next anniversary",
        text: "Happy anniversary.\n\nIf this envelope finally opened, it means we made it through another month of conversations, bad jokes, late good nights and all the little things in between.\n\nI hope I kept more of them. I'm sure I did.\n\nHere's to the next one.",
        image: null,
        date: null,
        mood: "candle",
        unlockDate: "2026-11-02"
    },
    {
        title: "Open when you wonder why I chose you",
        text: "Because you're kind in ways you don't even notice.\nBecause you laugh with your whole face.\nBecause talking to you feels like coming home.\nBecause you're you.\n\nThat's the short list.\n\nThe long one is this whole website.",
        image: null,
        date: null,
        mood: "rose"
    },
    {
        title: "Open when we complete two months",
        text: "Two months.\n\nDo you remember the three lines you wrote in \"Our Future\"? I hope we've already crossed one of them off.\n\nChapter 2 is written now. It's ours, and it's my favourite so far.\n\nLet's keep going.",
        image: null,
        date: null,
        mood: "lavender",
        unlockDate: "2026-11-02"
    }
];


/* --------------------------------------------------------------------------
   CHAPTER 05 — WHAT YOU MEAN TO ME  (the virtual bouquet)
   --------------------------------------------------------------------------
   One flower grows for each entry in flowerMessages, in order, and every
   flower stays — so the bouquet fills up as she goes.
   Add, remove or reorder entries freely (5–9 looks best).

   type  → "rose" | "tulip" | "daisy" | "lily" | "wildflower" | "cosmos"
   color → optional: "rose" | "burgundy" | "blush" | "cream" | "lavender"
           (leave it out to use that flower's natural colour)
   -------------------------------------------------------------------------- */

const whatYouMean = {
    opening: [
        "“There are things I don't say every day...",
        "not because I don't feel them,",
        "but because sometimes I don't know how to put them into words.”"
    ],

    invitation: "I wanted to give you flowers.\n\nBut since I can't be there today...\n\nlet me grow you a bouquet here.",
    startLabel: "Start",
    nextLabel: "Next flower",
    finishLabel: "See your bouquet",

    // Shown once the last flower has bloomed and the view pulls back.
    finale: [
        "These flowers are virtual.",
        "But what they represent isn't.",
        "Every flower is for a little reason\nI love having you in my life.",
        "And if I could,\nI'd give you a real bouquet today.",
        "So until I can...",
        "this one's yours. 🌷"
    ],
    giveLabel: "Take My Bouquet ❤️",

    // After she takes it. Her name (CONFIG.girlfriendName) is added automatically.
    givenTitle: "Happy One Month",
    replayLabel: "Grow it again"
};

// ✎ One flower per entry.
const flowerMessages = [
    {
        type: "rose",
        title: "The way you talk",
        message: "I could listen to you talk about random things for hours."
    },
    {
        type: "daisy",
        title: "Your little reactions",
        message: "Your expressions when something happens are honestly one of my favourite things."
    },
    {
        type: "tulip",
        title: "Your presence",
        message: "Even when we're doing absolutely nothing, I like having you around."
    },
    {
        type: "wildflower",
        title: "The little things",
        message: "You probably don't realise how many tiny things about you I remember."
    },
    {
        type: "lily",
        title: "You became important",
        message: "I don't remember exactly when it happened... I just know that you did."
    },
    {
        type: "cosmos",
        title: "Our little moments",
        message: "One month isn't a very long time, but somehow you've already become such a big part of my days."
    },
    {
        type: "rose",
        color: "burgundy",
        title: "Just because",
        message: "If I could give you a real bouquet today, I would."
    }
];


/* --------------------------------------------------------------------------
   CHAPTER 06 — OUR FUTURE
   Her answers stay on her own phone only. Nothing is sent anywhere.
   She can choose to share them with you using the "Send them to me" button.
   -------------------------------------------------------------------------- */

const future = {
    lines: [
        "Chapter 1 is complete.",
        "But this story isn't over.",
        "I want us to write the next chapter together."
    ],
    fields: [
        { name: "place", label: "Somewhere we should go", placeholder: "a city, a café, a rooftop…" },
        { name: "experience", label: "Something we should experience", placeholder: "a sunrise, a concert, a first…" },
        { name: "memory", label: "A memory we should create", placeholder: "anything at all" }
    ],
    submitLabel: "Save & Add To Our Story",
    savedTitle: "Saved.",
    savedMessage: "Now Chapter 2 has its first three lines."
};


/* --------------------------------------------------------------------------
   CHAPTER 07 — IF I COULD BE THERE  (the hug)
   The two figures are drawn in code (js/script.js → "The hug · figures"),
   so there are no image files to add here.
   -------------------------------------------------------------------------- */

const hugChapter = {
    title: "If I Could Be There...",

    // The quiet opening, before she taps the button.
    intro: [
        "I know I can't be there with you right now.",
        "So for the next few moments...",
        "pretend I am."
    ],
    button: "Come here ❤️",

    // Appears above them once they hug.
    banner: "I LOVE YOU A LOT. ❤️",

    // ✎ One item = one verse (fades in one at a time). \n = new line.
    poem: [
        "Agar kabhi main paas na rahu,\ntoh bas aankhein band karke yaad kar lena,",
        "main wahi milunga...\ntumhari har ek chhoti si khushi mein.",
        "Tum meri zindagi ka woh hissa ho,\njise main khona nahi chahta,\njiske saath main har chhota moment jeena chahta hoon.",
        "Picture kam hain humari,\npar yaadein bahut hain.",
        "Aur jo yaadein dil mein ban jaati hain,\nunhe kisi camera ki zarurat nahi hoti.",
        "I love you a lot.\nMore than I sometimes know how to say. ❤️"
    ],

    // The small, almost hidden line at the very end.
    finalLine: "Abhi hug virtual hai...\nreal wala pending hai. 🤍",

    replayLabel: "Once more"
};


/* --------------------------------------------------------------------------
   FINAL PAGE + THE CARD
   -------------------------------------------------------------------------- */

const finale = {
    title: "Thank you for being you.",
    lines: [
        "For every conversation.",
        "Every random thought.",
        "Every laugh.",
        "Every “good night”.",
        "And just for existing in my life."
    ],
    closing: "This is just the beginning.",
    footnote: "One month down.\nMany memories to go.",
    button: "Here's to Chapter 2"
};

// A small echo of the physical card, shown at the very end.
const keepsake = {
    to: "My Favourite Person",
    from: "The person who fell for you",
    chapter: "Chapter 01",
    line: "Some stories are written.\nOurs is still being written.",
    note: "Keep the card.\nIt's the only key to this place.",

    // ✎ A small photo on the card (put the file in assets/images/card/).
    //   If the file is missing, or this is null, the card shows "You're already here." instead.
    image: "assets/images/card/Card.jpeg",
    imageAlt: "Her, smiling, in a pink embroidered suit"
};
