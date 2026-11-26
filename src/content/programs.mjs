// Copy for the Programs page, above "Dark sky programs" (the `night` block in src/content.mjs, which is not here).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with
// no alternate keeps the most recent one.
// Table rows: `until` is the first stage at which a row is no longer shown. From stage 5 the table is down to its
// head row.
// Sheet rows and margin notes: `from` is the first stage at which they exist (absent means 0). Rows are in date
// order, oldest first. `times` are the four cliffs in column order; `fifth` is the column June added in pencil.
// `{time}` is the reader's own time.
export const programs = {
  titles: [
    'Ranger Programs | Echo Basin National Park',
    'Ranger Programs | Echo Basin National Park',
    'Ranger Programs (Updated) | Echo Basin National Park',
    'Ranger Programs: Stay With Your Group | Echo Basin National Park',
    'Ranger Programs | Echo Basin',
    'Ranger Programs | Echo Basin',
    "Don't turn around",
  ],
  h1: ['Ranger programs', { 4: 'Ranger programs (cancelled)', 5: 'Ranger programs (none)' }],
  intro: ['All of these are free. Meet the ranger at the spot listed, about ten minutes before the start.', {
    1: 'All of these are free. Report to the ranger at the spot listed, about ten minutes before the start.',
    2: "All of these are free. We've changed a few small things this month, so check the notes before you come.",
    3: 'Until further notice, stay with the ranger the whole time. Count your group by touch before you leave.',
    4: 'All programs are cancelled until further notice.',
    5: 'Programs are no longer listed.',
  }],
  table: {
    head: ['Program', 'When', 'Where', 'With', ''],
    rows: [
      {
        name: 'Canoe tour',
        when: ['Sat, 7 am', { 4: 'Cancelled' }],
        where: 'Lodge dock',
        who: 'Ines',
        note: ['Canoes and life jackets provided. Expect a race back to the dock.', {
          2: "This month the tour stays in sight of the dock, and we're counting canoes out and back in.",
          3: "Stays in sight of the dock. Please don't stare at the reflection.",
          4: 'The rental canoe from the 11th is still out on the lake.',
        }],
        until: 5,
      },
      {
        name: 'Echo Point talk',
        when: ['10 am and 2 pm', { 3: 'Suspended', 4: 'Cancelled' }],
        where: ['The rail at Echo Point', { 4: 'Echo Point (closed)' }],
        who: ['June', { 4: '' }],
        note: ['June brings a stopwatch so you can time your own echo. Allow an hour for the walk up and back.', {
          1: 'June brings a stopwatch so you can time your own answer. Allow an hour for the walk up and back.',
          2: 'A few people have timed a fifth echo this month. If you get one, June wants it on her sheet.',
          3: "Echo Point is closed to shouting. Please don't ask June to demonstrate.",
          4: "On the 14th a group went up for the 2 pm talk. They hadn't seen the notice.",
        }],
        until: 5,
      },
      {
        name: 'Star talk',
        when: ['Fri and Sat, 9 pm', { 4: 'Cancelled' }],
        where: 'Outside the Pass Hut',
        who: ['Rangers', { 4: '' }],
        note: ["June through September. It's a lot colder up there than down at the lake.", {
          3: 'Still on for tonight.',
          4: 'Last held Sept. 13.',
        }],
        until: 5,
      },
      {
        name: 'Old-growth walk',
        when: ['Sun, 4:30 pm', { 3: 'Sun, 3:30 pm', 4: 'Cancelled' }],
        where: 'Cathedral Stand trailhead',
        who: ['Sam', { 4: '' }],
        note: ['Sam talks cedar for about an hour. The boardwalk is flat and wheelchair accessible.', {
          2: 'Boardwalk only for now. Sam will point out where the bark is missing about forty feet up, which our forester puts down to wind.',
          3: "Ends by 5, no exceptions. Please don't look up.",
          4: 'Cathedral Stand has been closed since the 14th.',
        }],
        until: 5,
      },
    ],
    note: ['Programs can be cancelled for weather. The lodge front desk posts any changes by 6 am.', {
      1: 'Programs can be cancelled for conditions. The lodge front desk posts any changes by 6 am.',
      3: 'Before you go, ask the front desk where conditions were last reported.',
      4: 'Last updated Sept. 16.',
      5: 'No longer updated.',
    }],
  },
  // June's stopwatch sheet: a printed form, filled in by hand. Visitors shout from the rail and time their own
  // echoes, so the times scatter a tenth or two around the four cliffs (1.1, 2.4, 3.8, 5.5).
  sheet: {
    head: 'Echo Point talk: echo times',
    sub: 'Start the watch when you shout and split it on each echo.',
    cols: ['Date', 'Time', ['Who shouted', { 1: 'Who called' }], 'The Step (1.1)', 'Organ Wall (2.4)', 'Gray Wall (3.8)', 'Halloran Face (5.5)', ['', { 2: 'No cliff' }]],
    rows: [
      { date: '9/7', time: '10:00', who: 'family from Cedar Flats', times: ['1.1', '2.5', '3.8', '5.6'], fifth: '' },
      { date: '9/7', time: '2:00', who: 'couple from the lodge', times: ['1.2', '2.4', '3.9', '5.5'], fifth: '' },
      { date: '9/8', time: '10:00', who: 'birders', times: ['1.1', '2.4', '3.7', '5.4'], fifth: '' },
      { date: '9/10', time: '10:00', who: 'school group', times: ['1.0', '2.3', '3.8', '5.6'], fifth: ['', { 2: '6.9' }] },
      { date: '9/10', time: '2:00', who: 'boy, about 9', times: ['1.3', '2.6', '4.0', '5.7'], fifth: '' },
      { date: '9/11', time: '10:00', who: 'bus tour', times: ['1.1', '2.4', '3.9', '5.5'], fifth: ['', { 2: '7.0' }] },
      { date: '9/12', time: '10:00', who: 'retired couple', times: ['1.2', '2.4', '3.8', '5.6'], fifth: '6.9', from: 2 },
      { date: '9/12', time: '2:00', who: 'two hikers', times: ['1.1', '2.3', '3.8', '5.5'], fifth: '6.8', from: 2 },
      // Bible 9.9 and 9.13: the group reached the rail before the 2 pm talk. The line stops here.
      { date: '9/14', time: '1:55', who: 'tour group', times: ['', '', '', ''], fifth: '-1.3', from: 4 },
      // Flagged in the bible (14): lines in June's handwriting after the 14th. Not yet approved.
      { date: '9/15', time: 'morning', who: 'nobody at the rail', times: ['', '', '', ''], fifth: "Tomás's voice", from: 5 },
      { date: '9/15', time: 'night', who: 'nobody at the rail', times: ['', '', '', ''], fifth: "June's voice", from: 5 },
      // The reader. The other one started a tenth of a second later (as on the echo diagram).
      { date: '', time: '{time}', who: 'you', times: ['', '', '', ''], fifth: '0.1', from: 6 },
    ],
    margin: [
      { text: "Tell them to wait for Halloran Face. It's the quiet one." },
      { text: 'Varied thrush at the rail on the 8th.' },
      { text: 'Watch needs a new battery.' },
      { from: 2, text: "6.9 would need a cliff 3,800 ft out. It's all trees." },
      { from: 2, text: "Calls I can't name", tally: 11 },
      { from: 2, text: "12th, 2 pm. Both of them say the 5th said something else. I couldn't make it out." },
      { from: 3, text: '13th. Talks suspended until further notice, per Ines.' },
    ],
    cap: ["June's timing sheet from the echo talk. Visitors run the stopwatch, so the numbers wander a little.", {
      2: 'June added the last column this month, for the fifth one.',
      3: "June's sheet. The last times are from the 12th.",
      4: "June's sheet. The last line is from 1:55 pm on the 14th.",
      5: "The lines dated the 15th are in June's handwriting.",
      6: 'The last line is yours.',
    }],
    label: "June's handwritten timing sheet from the Echo Point talk, with visitors' stopwatch times for each echo.",
  },
};
