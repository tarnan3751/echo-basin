// Copy for the Conditions page, below "Today in the park" (the `field` block in src/content.mjs).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a
// stage with no alternate keeps the most recent one.
// The alerts list is the six `ticker` items from src/content.mjs, shown as they are. Only its heading
// and intro live here.
// Log entries are newest first. `from` is the first stage at which an entry exists (absent means 0).
// Every entry rests on story bible section 5 or a ticker line, and must agree with the ticker at every
// stage. Stage 1 swaps words in three entries; stage 5 rewrites the four oldest; stage 6 adds one.
export const conditions = {
  titles: [
    'Conditions | Echo Basin National Park',
    'Conditions | Echo Basin National Park',
    'Conditions: Quiet | Echo Basin National Park',
    'Where Conditions Are | Echo Basin National Park',
    'Conditions | Echo Basin',
    'Conditions | Echo Basin',
    "Don't turn around",
  ],
  alerts: {
    h2: 'Current alerts',
    intro: ['Also posted at both entrance stations and the lodge front desk.', {
      3: 'Ask where conditions were last reported before you go out.',
      4: 'As of Sept. 16. Stay indoors tonight.',
      5: "There's nobody at the front desk.",
    }],
  },
  log: {
    h2: ['Recent updates', { 5: 'Recent updates (none)' }],
    note: ['Posted by the lodge front desk, newest first.', { 5: 'Nobody has posted here since Sept. 16.', 6: 'Posted just now.' }],
    entries: [
      // Stage 6: the reader's own date and time.
      { date: '{now}', from: 6, text: 'Conditions have left the park.' },

      // Mon Sept. 16 (stage 4)
      { date: 'Sept. 16', from: 4, text: 'Conditions advisory tonight for the whole basin. Last reported 0.4 mi NE of the lodge.' },
      { date: 'Sept. 16', from: 4, text: "Cedar Flats is closed and empty. Please don't go looking." },
      { date: 'Sept. 16', from: 4, text: 'Lakeshore Rd closed past the boat launch, staff vehicles only.' },
      { date: 'Sept. 16', from: 4, text: 'Park map reprinted. Staff will swap your old one, no questions asked.' },

      // Sun Sept. 15 (stage 4)
      { date: 'Sept. 15', from: 4, text: 'Pass Hut: door found open this morning. Do not go in.' },
      { date: 'Sept. 15', from: 4, text: 'No report from the pass today.' },

      // Sat Sept. 14 (stage 4)
      { date: 'Sept. 14', from: 4, text: 'Closure extended to all ground north of the lake above 3,760 ft. Lakeshore Loop is the only trail open.' },
      { date: 'Sept. 14', from: 4, text: 'Echo Point is closed.' },
      { date: 'Sept. 14', from: 4, text: 'Fall wildlife count: eleven species, nine of them birds flying over.' },

      // Fri Sept. 13 (stage 3)
      { date: 'Sept. 13', from: 3, text: 'Star talk tonight, 9 pm outside the Pass Hut. No lights of any color.' },
      { date: 'Sept. 13', from: 3, text: "Paper maps: if yours has a straight line on it that isn't on ours, please hand it in." },
      { date: 'Sept. 13', from: 3, text: 'Conditions last reported near Echo Pass, heading downhill. All ground above 7,500 ft is closed.' },
      { date: 'Sept. 13', from: 3, text: 'Cedar Flats: everyone in tents by 7:42 pm, no exceptions.' },
      { date: 'Sept. 13', from: 3, text: 'No campfires. No lanterns or headlamps outside after dusk.' },
      { date: 'Sept. 13', from: 3, text: "Until further notice, please don't shout, sing or whistle anywhere in the park." },
      { date: 'Sept. 13', from: 3, text: 'Be indoors by 7:42 pm. Trails close at dusk and rangers sweep at 6 pm.' },
      { date: 'Sept. 13', from: 3, text: 'Treetops behind the lodge came down overnight, all at about the same height.' },

      // Thu Sept. 12 (stage 2)
      { date: 'Sept. 12', from: 2, text: 'Lakeshore Rd open until dusk. Gate locks at 7:42 starting tonight. Quiet hours at the lodge and Cedar Flats now start at dusk too.' },
      { date: 'Sept. 12', from: 2, text: "Cathedral Stand: boardwalk only for now. There's bark missing on some trunks about forty feet up. Our forester says wind." },
      { date: 'Sept. 12', from: 2, text: 'No fresh bear sign in the park since late August. Keep using the lockers anyway.' },

      // Wed Sept. 11, later in the day than the stage 0 snapshot (stage 2)
      { date: 'Sept. 11', from: 2, text: 'A rental canoe was found adrift this afternoon with nobody in it. If you know who took it out, please call the lodge.' },
      { date: 'Sept. 11', from: 2, text: 'A few visitors have counted a fifth echo at Echo Point this month. If you hear one, tell a ranger what time it was.' },

      // Stage 0: the summer log, Aug. 26 to Sept. 11.
      { date: 'Sept. 11', text: 'Cedar Flats is 82% full this weekend. Book soon if you still need a site.' },
      { date: 'Sept. 6', text: ['Pass Hut is staffed daily through Sept. 30. Stop in if you need to warm up.', {
        3: "Updated Sept. 13: Pass Hut is not staffed after dark. Please don't knock.",
      }] },
      { date: 'Sept. 5', text: ['Elk are grazing in Halloran Meadows most evenings. Please give them 25 yards, even for photos.', {
        1: 'Elk are gathering in Halloran Meadows most evenings. Please give them 25 yards, even for photos.',
      }] },
      { date: 'Sept. 3', text: 'Cedar Flats reminder: anything with a smell goes in the bear locker. Toothpaste too.' },
      // The four oldest are the ones that change at stage 5.
      { date: 'Sept. 2', text: ['Trail report: Echo Pass trail in good condition. Snow above 7,500 ft. Poles help.', {
        1: 'Trail report: Echo Pass trail in fair condition. Snow above 7,500 ft. Poles help.',
        5: 'Conditions are at the lodge.',
        6: 'Conditions were at the lodge.',
      }] },
      { date: 'Aug. 30', text: ["Sunset is getting earlier. If you're doing the pass trail, bring a headlamp.", {
        1: "Dusk is getting earlier. If you're doing the pass trail, bring a headlamp.",
        5: "It's after 7:42.",
      }] },
      { date: 'Aug. 28', text: ['Fire danger is now moderate. Campfires in the fire rings only.', {
        5: 'No lights.',
      }] },
      { date: 'Aug. 26', text: ['Paving starts today on Lakeshore Rd near mile 4. The road stays open but expect short delays.', {
        5: "Lakeshore Rd: don't. It isn't a way out.",
      }] },
    ],
  },
};
