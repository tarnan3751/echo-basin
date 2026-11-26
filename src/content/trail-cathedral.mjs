// Copy for the Cathedral Stand page (/trails/cathedral-stand/).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a
// stage with no alternate keeps the most recent one. An empty string means nothing is shown.
// Distance, climb, time and status come from the Cathedral Stand row of `trails.rows` in src/content.mjs.
// Beats follow the `zones` entry for Cathedral Stand, its caption `capA`, Sam's bio in `rangers` and the
// trail row, at the same stages. The boardwalk is the flat first part and the full loop climbs (bible 9.14).
export const trailCathedral = {
  titles: [
    'Cathedral Stand | Echo Basin National Park',
    'Cathedral Stand | Echo Basin National Park',
    'Cathedral Stand: Boardwalk Only | Echo Basin National Park',
    'Cathedral Stand: Closes at 5 pm | Echo Basin National Park',
    'Cathedral Stand | Echo Basin',
    'Cathedral Stand | Echo Basin',
    "Don't turn around",
  ],
  name: 'Cathedral Stand',
  facts: [
    ['Start', 'Cathedral Stand trailhead, with its own parking lot off Lakeshore Rd, 3.6 miles west of the lodge'],
    ['Terrain', 'Boardwalk for the first part, flat and wheelchair accessible. After that, dirt trail with roots and a few steps.'],
  ],
  intro: ['Old-growth cedar and Douglas fir, some of it more than 600 years old. The boardwalk at the start is flat and wheelchair accessible. Past it the trail keeps going on dirt, and the full 2.8 mile loop climbs 300 ft.', {
    2: "Old-growth cedar and Douglas fir, some of it more than 600 years old. For now it's boardwalk only.",
    3: "The stand closes at 5 pm. While you're in it, please don't look up into the canopy.",
    4: 'Closed since the 14th.',
    5: "It's taller than forty feet.",
    6: "Don't look up.",
  }],
  walk: [
    ["The boardwalk starts at the parking lot and goes straight in under the trees. Within a minute you can't hear the road. Sam Whitlow, our trail crew lead, rebuilt it over three summers, and it's level the whole way around.", {
      1: "The boardwalk starts at the parking lot and goes straight in under the trees. Within a minute you can't see the road. Sam Whitlow, our trail crew lead, rebuilt it over three summers, and it's level the whole way around.",
      2: 'The boardwalk starts at the parking lot and goes straight in under the trees. Sam Whitlow rebuilt it over three summers, and he was the first to notice the bark damage.',
      3: 'Sam measures the marks every Monday. Forty feet, give or take an inch.',
      4: "Sam went up to measure on Monday the 16th and hasn't signed out.",
    }],
    ['It makes one loop through the biggest trees in the stand. The numbered posts match the plan on this page, and most of them have a bench.', {
      3: 'Keep your eyes on the boardwalk the whole way around.',
      4: 'M. Arroyo signed in on the 14th. His pack and pole are still on the boardwalk.',
    }],
    ["Partway around, a dirt trail leaves the boardwalk and heads uphill. That's the rest of the loop. It climbs through the upper stand, crosses Cathedral Creek and comes back down to the boardwalk. There are roots and a few steps, so this part isn't wheelchair accessible.", {
      2: 'The dirt trail past the boardwalk is closed for now while the crew checks some damaged trees.',
      3: 'The dirt trail is closed until further notice.',
    }],
  ],
  look: {
    h2: ['What to look for', { 3: 'What you might see' }],
    items: [
      ['The big fir', ['Post 1 is the tallest tree in the park, a Douglas fir 259 ft tall. Stand at the rail and look straight up.', {
        3: "It lost its top section on Sept. 12. Please don't stop under it.",
        4: 'Not the tallest thing in the park anymore.',
      }]],
      ['Bark', ["The old firs have bark thick enough to get them through a forest fire. Please don't pick at it, or at the cedars.", {
        2: "If you look up you'll see bark missing on some of the trunks, about forty feet off the ground. Our forester says wind.",
        3: "The pale patches forty feet up are the marks. Please don't look up at them.",
        4: 'Every trunk in the stand is marked at forty feet now.',
      }]],
      ['Owls', ["A great horned owl lives in the stand year round. Mostly you'll just hear it.", {
        3: "None in the stand right now. They've all moved to the lodge roof, and they sit facing this way.",
        4: 'Five on the lodge roof as of the 16th. They face north now.',
      }]],
    ],
  },
  know: {
    h2: 'Before you go',
    items: [
      ["Sign the trail register at the Basin Lodge trailhead before you drive over, and sign out when you're back.", {
        3: 'Sign the register at the lodge in your own handwriting.',
        4: 'Lakeshore Loop is the only trail open.',
        5: 'The park is closed to the public.',
      }],
      ['Please stay on the boardwalk or the trail, because the roots are shallower than they look.', {
        1: 'Please stay on the boardwalk or the trail, where you can be seen.',
        2: 'Please stay on the boardwalk, where you can be seen.',
        4: "Please don't go in to look at the marks.",
      }],
      ["It's cool and damp under the big trees, even on a hot day. Bring a warm layer.", {
        3: 'Be back at your car well before 5 pm.',
        4: "If you left anything on the boardwalk, we can't get it for you right now.",
      }],
    ],
  },
  mapCap: ['Cathedral Stand, trail 2 on the park map. The trailhead and parking are at the bottom, off Lakeshore Rd.', {
    4: 'Everything north of the lake above 3,760 ft is closed. That includes the stand.',
  }],
  // Sam's bark survey sheet. Stage 0 is the printed plan only. Sam's pencil starts at stage 2 (lowercase
  // labels below). At stage 2 he has ringed the first damaged trees; at stage 3, 212 of them; at stage 4,
  // every tree on the plan. The sketch is a side view of one trunk with a person beside it for scale.
  diagram: {
    title: 'Cathedral Stand boardwalk loop',
    labels: {
      // printed
      sub: 'Big trees. Echo Basin Park Authority, trail crew',
      road: 'Lakeshore Rd',
      parking: 'Trailhead and parking',
      boardwalk: 'Boardwalk loop, flat',
      upper: 'Dirt trail to upper loop, climbs 300 ft',
      creek: 'Cathedral Creek',
      north: 'N',
      scale: '200 ft',
      legendTree: 'Old-growth cedar or Douglas fir',
      legendPost: 'Numbered post',
      tree1: 'Douglas fir, 259 ft. Tallest tree in the park',
      tree2: 'Western redcedar, more than 600 years old',
      tree3: 'The Twins, two cedars growing from one root',
      tree4: 'Hollow cedar, still growing',
      tree5: 'Nurse log, with young trees growing out of it',
      // Sam's pencil
      ring: ['', { 2: 'bark off, 40 ft, wind?' }],
      same: ['', { 2: 'same height, all of them' }],
      tallyHead: ['', { 2: 'Mondays' }],
      fir: ['', { 3: 'top gone 9/12' }],
      sketch: ['', { 3: '40 ft', 5: '40 ft is its shoulders when it ducks' }],
      sketchPerson: ['', { 3: 'me' }],
    },
    // From stage 3 the word "wind?" in the `ring` note is struck through with one pencil line, not erased.
    struck: { ring: { from: 3, text: 'wind?' } },
    // Sam's tally of marked trees, one row per Monday, under `tallyHead`. Each row appears at `from`. The row
    // for the 16th is dated in his hand and the count is left empty.
    tally: [
      { from: 2, date: '8/26', count: '9' },
      { from: 2, date: '9/2', count: '47' },
      { from: 2, date: '9/9', count: '212' },
      { from: 4, date: '9/16', count: '' },
    ],
    notes: ['Numbers match the posts along the boardwalk.'],
    cap: ['Plan of the boardwalk loop from the trail crew, with the biggest trees numbered.', {
      2: "Sam's copy of the plan. The pencil rings are trees with bark missing about forty feet up. He's been keeping count.",
      3: "Sam's survey as of Sept. 13. Every ring is a tree marked at forty feet.",
      4: "Sam's survey sheet. Nothing filled in for Monday the 16th.",
      5: "Sam's survey sheet. No longer updated.",
    }],
    alt: 'Diagram: a printed plan of the Cathedral Stand boardwalk loop and its trailhead parking off Lakeshore Rd, with five big trees numbered and the 259 ft Douglas fir labeled as the tallest tree in the park.',
  },
};
