// Copy the split into separate pages needs: the three home page teasers, tab titles for six pages, the trail
// register's early lines, six rewordings of lines that point at the single page, and the words on two new documents.
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with no
// alternate keeps the most recent one. Extra fields used below:
//   from     the first stage at which an entry exists (absent means 0)
//   check    a line that says what the reader did: show it only when `when` is true, otherwise show `fallback`
//   struck   the first stage at which a row is drawn struck through
// Where an existing piece is reused as it is, it is imported rather than copied.
import { C } from '../content.mjs';

// ---------------------------------------------------------------------------------------------------------------
// Home page teasers. Each is cut from the block it points to and never says more, or says it sooner.
export const homeTeasers = {
  // Points to Explore. The heading is zones.h2, unchanged. Each line is taken from that place's zones entry at the
  // same stage. Cathedral Stand has no stage 1 change on purpose.
  landscapes: {
    h2: C.zones.h2,
    items: [
      { name: 'Echo Pass', alt: '8,560 ft', line: ["Snow most of the year, and a warming hut that's staffed all summer.", {
        1: "Snow most of the year, and a warming hut that's occupied all summer.",
        2: 'A few people this month have counted five echoes at Echo Point.',
        3: "If you hear your name from up in the snow, that isn't a ranger.",
        4: 'The fifth echo now comes back before the other four.',
        5: "It was using Tomás's voice at the hut on the 15th.",
        6: 'If you can hear somebody reading this out loud, check whether your mouth is moving.',
      }] },
      { name: 'Halloran Meadows', alt: '6,230 ft', line: ['Elk graze here most evenings, so bring binoculars and keep your distance.', {
        1: 'Elk gather here most evenings, so bring binoculars and keep your distance.',
        2: 'Lately the elk mostly stand and watch the trees on the east side.',
        3: 'If the elk all leave at once, you leave too, the same direction they went.',
        4: 'No elk have been counted since September 14.',
        5: 'The track runs dead straight from the pass to the lake.',
      }] },
      { name: 'Cathedral Stand', alt: '4,270 ft', line: ['Old-growth cedar and Douglas fir, some of it more than 600 years old.', {
        2: 'You might notice bark missing from some of the trunks about forty feet up.',
        3: 'After 5 pm please keep your eyes on the boardwalk.',
        4: 'Every trunk in the stand is marked at forty feet now.',
        5: "It's taller than forty feet.",
      }] },
      // Stage 4 avoids "the thing", which the site uses once. Stage 5 is the Explore line as reworded below
      // (rewordings[0]) and carries the same check.
      { name: 'Echo Lake', alt: '3,540 ft', line: ['Eleven miles long and cold enough to make you yelp.', {
        1: 'Eleven miles long and cold all the way down.',
        2: "A few guests have told us the reflection doesn't always match the shoreline.",
        3: "Please don't stare at the reflection.",
        4: 'What you can see in the reflection is really there.',
        5: 'You looked at the picture of the lake for a long time.',
      }], check: { stage: 5, when: 'the same as rewordings[0]', fallback: 'What you can see in the reflection is really there.' } },
    ],
    link: ['Explore the park', { 4: "See what's closed" }],
  },

  // Points to Conditions. Drawn from field and the ticker. field.h2 is not reused because at stages 3 and 5 its
  // "these" means the three cards, which are not on the home page.
  today: {
    h2: ['Today in the park', { 3: 'Check before you go outside', 4: 'Tonight in the park', 5: 'Nobody is posting updates', 6: 'Where you are right now' }],
    body: ['The pass usually runs about 20 degrees colder than the lake, so check both temperatures before you pick a trail.', {
      2: "We've added a line to the track card for one we can't identify yet. If you've seen it, tell a ranger where.",
      3: "Conditions were last reported near Echo Pass, heading downhill. If they're within half a mile, don't go out at all.",
      4: 'Conditions advisory tonight for the whole basin. Last reported 0.4 mi NE of the lodge.',
      5: 'Conditions are at the lodge.',
      6: 'Its last print is 38 feet behind you.',
    }],
    link: ["See today's conditions", { 4: "See tonight's conditions", 5: 'See the last report', 6: 'See where you are' }],
  },

  // Points to Plan. The heading is plan.h2 and the button is the header's cta, both unchanged. The body keeps clear of
  // the glance figures, which sit higher on the same page. Stage 2 and 3 follow the Plan page beats in bible section 12.
  // Stage 4 keeps stage 3 on purpose: the pass is still for sale while the glance says "No charge to leave."
  plan: {
    h2: C.plan.h2,
    body: ['Buy a pass at either entrance station, or online before you come. The road to the lodge is plowed all winter.', {
      2: 'Buy a pass at either entrance station, or online before you come. Plan to arrive before the gate locks at 7:42.',
      3: 'Buy a pass at either entrance station, or online before you come. Plan to be indoors by 7:42.',
      4: "There's a conditions advisory tonight for the whole basin. Please don't drive up.",
      5: "There's nobody at the entrance stations.",
      6: 'It left the park last night.',
    }],
    cta: C.cta,
  },
};

// ---------------------------------------------------------------------------------------------------------------
// Tab titles, stage 0 to 6. Pattern from bible section 11. Each follows its own page's heading or menu entry.
export const pageTitles = {
  explore: [
    'Explore | Echo Basin National Park',
    'Explore | Echo Basin National Park',
    'Explore Before Dusk | Echo Basin National Park',
    'Explore: Three of Four Open | Echo Basin National Park',
    'Explore | Echo Basin',
    'Explore | Echo Basin',
    "Don't turn around",
  ],
  trails: [
    'Trails | Echo Basin National Park',
    'Trails | Echo Basin National Park',
    'Trails: Stick to the Route | Echo Basin National Park',
    'Trails (Day Use) | Echo Basin National Park',
    'Trails | Echo Basin',
    'Trails | Echo Basin',
    "Don't turn around",
  ],
  wildlife: [
    'Wildlife | Echo Basin National Park',
    'Wildlife | Echo Basin National Park',
    'Wildlife, for Now | Echo Basin National Park',
    'Wildlife: Give Them Room | Echo Basin National Park',
    'Wildlife (None) | Echo Basin',
    'Wildlife (None) | Echo Basin',
    "Don't turn around",
  ],
  safety: [
    'Safety | Echo Basin National Park',
    'Safety | Echo Basin National Park',
    'Safety and Conditions | Echo Basin National Park',
    'Alerts | Echo Basin National Park',
    'Alerts | Echo Basin',
    'Alerts | Echo Basin',
    "Don't turn around",
  ],
  lodging: [
    'Lodging and Camping | Echo Basin National Park',
    'Lodging and Camping | Echo Basin National Park',
    'Lodging and Camping: Quiet Hours at Dusk | Echo Basin National Park',
    'Lodging and Camping: New Rules | Echo Basin National Park',
    'Lodging | Echo Basin',
    'Lodging (Closed) | Echo Basin',
    "Don't turn around",
  ],
  rangers: [
    'Meet the Rangers | Echo Basin National Park',
    'Meet the Rangers | Echo Basin National Park',
    'Meet the Rangers | Echo Basin National Park',
    'Meet the Rangers | Echo Basin National Park',
    'Meet the Ranger | Echo Basin',
    'Staff | Echo Basin',
    "Don't turn around",
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// Trail register, stages 0 and 1: seven ordinary lines, oldest first, all signed out (bible 9.4). The page always
// shows the seven newest lines, so at stage 2 Sep 5 drops off for Castellanos, at stage 3 Sep 6 drops off for
// Kessler, and at stage 4 all of these are gone. Times are 24-hour, and each trip fits that trail's time in bible
// section 8: Lakeshore 2 hr, Cathedral Stand 1.5 hr, Echo Point 1 hr, Halloran Meadows 5 hr, Echo Pass 9 hr.
export const registerEarly = [
  ['Sep 5', 'P. Lindqvist +2', 'Halloran Meadows', '07:50', '13:05'],
  ['Sep 6', 'G. Abernathy', 'Echo Pass', '06:40', '16:05'],
  ['Sep 7', 'H. Duarte +3', 'Lakeshore', '09:15', '11:30'],
  ['Sep 8', 'Ken Brennan', 'Cathedral Stand', '13:20', '14:55'],
  ['Sep 9', 'Y. Sato +1', 'Echo Point', '09:35', '10:55'],
  ['Sep 10', 'E. Marchetti', 'Halloran Meadows', '09:30', '14:20'],
  ['Sep 11', 'O. Adeyemi +1', 'Lakeshore', '10:20', '12:35'],
];

// ---------------------------------------------------------------------------------------------------------------
// The six lines in bible 9.7. `old` is exactly as it stands in src/content.mjs (for the three marked "part of", it
// is one sentence inside a longer string, and only that sentence is replaced). Lines that say what the reader did
// carry `when` and `fallback` (bible 10.6).
export const rewordings = [
  {
    where: 'zones.items[3].body (Echo Lake), stage 5. Explore page',
    old: 'You looked at the picture at the top of this page for a long time.',
    new: 'You looked at the picture of the lake for a long time.',
    when: 'the lake picture at the top of the home page has been on screen for a long time in all, across visits (suggest 30 seconds)',
    fallback: "Don't look at the water any longer than you have to.",
  },
  {
    where: 'wildlife.items[4], body, stage 5. Wildlife page',
    old: "You've been looking for it in every picture on this page.",
    new: "You've been looking for it in every picture.",
    when: 'every picture the reader has reached so far has been on screen for 12 seconds or more',
    fallback: "Don't look for it in the pictures.",
  },
  {
    where: 'hero.sub, stage 6, part of. Home page',
    old: "It's been reading along since the trail map.",
    new: "It's been reading along since you got here.",
    // Always true: it counts from first arrival on the site. No check needed.
  },
  {
    where: 'echo.intro, stage 6, part of. Echo Point page. The sentence after it, "The red mark on the chart isn\'t you.", stays.',
    old: "You've been reading this page in your own voice. It's been listening since the top.",
    new: "You've been reading these pages in your own voice. It's been listening since the first one.",
    // Always true: "the first one" is the first page the reader opened. No check needed.
  },
  {
    where: 'plan.typed, part of. Plan page. {m} counts from first arrival on the site, not on the page (bible 10.6).',
    old: "You've been on this page for {m}.",
    new: "You've been on this site for {m}.",
  },
  {
    where: 'ticker[1], stage 6. Every page. The words stand. Only the check is new',
    old: "Cedar Flats wasn't empty when you looked at the map",
    new: "Cedar Flats wasn't empty when you looked at the map",
    when: 'the park map (Trails page) or the Cedar Flats site plan (Lodging page) has been on screen at any stage',
    fallback: "Cedar Flats wasn't empty",
    // On the site plan itself the line needs no check: the plan loads one stage behind and steps to 6 in front of
    // the reader, so by then they have looked at it.
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Cedar Flats site plan, Lodging page, beside the campsite entry. Every word lettered on the sheet.
// Drawing notes: 80 sites on three loops, numbered 1 to 80 (suggest A 1 to 28, B 29 to 54, C 55 to 80). Stage 0:
// 66 of them shaded as booked (82% of 80, the ticker's figure). Stage 4: the same 66 drawn as tents. Stage 5: one
// straight line of marks comes out of the lake on the north side of the sheet and crosses it toward the south-west,
// with "40 ft" measured between two of them. Stage 6: as at 5, plus one site on the line ringed like the map's
// "you are here" and labelled with `labels.marked`.
export const sitePlan = {
  title: ['Cedar Flats Campground', { 4: 'Cedar Flats Campground (closed)' }],
  sub: '80 sites on the south shore of Echo Lake',
  labels: {
    lake: 'Echo Lake',
    lodge: 'Basin Lodge, 1.8 mi across the lake',
    entrance: 'Entrance',
    north: 'N',
    loops: ['Loop A', 'Loop B', 'Loop C'],
    stride: { from: 5, text: '40 ft' },
    marked: { from: 6, text: "Cedar Flats wasn't empty when you looked at the map" },
  },
  legend: [
    { key: 'site', text: 'Campsite' },
    { key: 'booked', text: ['Booked this weekend', { 1: 'Taken this weekend', 4: 'Tent still standing' }] },
    { key: 'fire', text: ['Fire ring', { 3: 'Fire ring (no fires)' }] },
    { key: 'locker', text: 'Bear locker' },
    { key: 'tap', text: 'Water tap' },
    { key: 'restroom', text: 'Restrooms' },
    { key: 'marks', from: 5, text: 'Marks, 40 ft apart' },
  ],
  notes: [
    ['Quiet hours 10 pm to 6 am.', {
      2: 'Quiet hours now start at dusk.',
      3: 'Everyone in tents by 7:42 pm, no exceptions.',
      4: 'Closed Sept. 16. Every site is empty.',
    }],
    ['Anything with a smell goes in the bear locker.', { 3: 'No lanterns or headlamps outside after dusk.', 5: 'No lights.' }],
  ],
  cap: ['Cedar Flats site plan. Book soon if you still need a site this weekend.', {
    4: 'Cedar Flats site plan, updated Sept. 16.',
    5: 'The marks come out of the lake here.',
  }],
  alt: 'A site plan of Cedar Flats Campground on the south shore of Echo Lake, with 80 numbered sites on three loops, most of them shaded as booked for the weekend, and the water taps, bear lockers, fire rings, restrooms and entrance marked.',
};

// ---------------------------------------------------------------------------------------------------------------
// Fall count sheet, Wildlife page, in place of the track card. The park's survey form. Every word lettered on it.
// The spring groups add up to 214 (141 + 48 + 12 + 8 + 5). The fall column is blank until stage 4, when it is filled
// in for Sept. 14: eleven species, ten of them birds (nine flying over, and the owls) and one on the printed "Other"
// line, with no name written in. The elk line is a head count, not a species count, so it sits below the total.
// At stage 5 every row is struck through except Birds (the owls are still on the roof) and Other. The page heading
// above the sheet reads "What lives here now" at stage 5, so the sheet's own title does not change.
export const fallCount = {
  title: 'Echo Basin wildlife survey',
  sub: 'Species by group, spring and fall',
  cols: ['Group', 'Spring', ['Fall', { 4: 'Fall, Sept. 14' }], 'Notes'],
  rows: [
    { group: 'Birds', spring: '141', fall: ['', { 4: '10' }], note: ['', { 4: '9 flying over, plus the owls on the lodge roof' }] },
    { group: 'Mammals', spring: '48', fall: ['', { 4: '0' }], note: '', struck: 5 },
    { group: 'Fish', spring: '12', fall: ['', { 4: '0' }], note: '', struck: 5 },
    { group: 'Amphibians', spring: '8', fall: ['', { 4: '0' }], note: '', struck: 5 },
    { group: 'Reptiles', spring: '5', fall: ['', { 4: '0' }], note: '', struck: 5 },
    // Flagged (bible 12 and 14): that the eleventh is the one "not listed". The name stays blank at every stage.
    { group: ['Other, not listed above', { 6: 'You know what it is' }], spring: '0', fall: ['', { 4: '1' }], note: '' },
    { total: true, group: 'Total species', spring: '214', fall: ['', { 4: '11' }], note: '', struck: 5 },
    { group: 'Elk herd, Halloran Meadows (head count)', spring: '60', fall: '', note: ['Evenings. Sept. 9: 61. Sept. 11: 59.', {
      3: 'Sept. 13: standing, facing east, two hours.',
      4: 'None at the count on Sept. 14, and none since.',
    }], struck: 5 },
  ],
  // Handwritten in the margin.
  margin: [
    { from: 2, text: "Bulls haven't bugled this year." },
    { from: 2, text: 'No fresh bear sign since late Aug.' },
    { from: 3, text: 'Owls have moved to the lodge roof, facing the stand.' },
    { from: 6, text: 'It noticed.' },
  ],
  cap: ['Wildlife survey sheet. The elk line is a head count, taken in the evening.', {
    4: 'Fall count, Sept. 14.',
    5: 'We stopped counting after the 16th.',
    6: 'Updated just now.',
  }],
  alt: 'A wildlife survey form listing the spring species count by group, 214 in all, with the elk herd\'s evening head count of about sixty on its own line and the fall column still blank.',
};
