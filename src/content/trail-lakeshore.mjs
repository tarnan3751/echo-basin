// Copy for the Lakeshore Loop page (/trails/lakeshore-loop/).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a
// stage with no alternate keeps the most recent one. An empty string means nothing is shown.
// Distance, climb, time and status come from the Lakeshore Loop row of `trails.rows` in src/content.mjs.
// Beats follow the `zones` entry for Echo Lake, the hero caption, the loon in `wildlife` and the trail row,
// at the same stages. Stage 1 swaps words in three places. At stage 5 the marks go into the water here.
export const trailLakeshore = {
  titles: [
    'Lakeshore Loop | Echo Basin National Park',
    'Lakeshore Loop | Echo Basin National Park',
    'Lakeshore Loop: Dawn to Dusk | Echo Basin National Park',
    'Lakeshore Loop (Day Use) | Echo Basin National Park',
    'Lakeshore Loop | Echo Basin',
    'Lakeshore Loop | Echo Basin',
    "Don't turn around",
  ],
  name: 'Lakeshore Loop',
  facts: [
    ['Start', 'Basin Lodge trailhead'],
    ['Terrain', 'Packed dirt and gravel. Flat along the shore, with one short climb to the bench. Muddy in places.'],
  ],
  intro: ['This is the easiest trail in the park and the one most people do first. It follows the north shore west from the lodge and loops back on the bench above the water, so you have the lake in view the whole way.', {
    1: "This is the easiest trail in the park and the one most people do first. It follows the north shore west from the lodge and loops back on the bench above the water, so you're in view of the lake the whole way.",
    3: "Please don't stare at the water while you walk.",
    4: "The only trail in the park that's still open.",
    5: 'It crossed this trail.',
    6: 'You can stop looking at the water.',
  }],
  walk: [
    ['Start at the lodge trailhead and take the path down past the dock, then turn west along the shore. The first stretch is flat and right at the edge of the water, with a few gravel beaches where you can get your feet wet.', {
      3: 'Rangers sweep this trail at 6 pm.',
      4: 'The beaches count as off the trail.',
      5: 'The marks go into the water a short way from the lodge.',
    }],
    "At the far end the trail turns away from the water and climbs through the trees to the bench, a level shelf above the lake. Most of the 200 ft of climbing is on this one stretch, and it doesn't last long.",
    ['The bench brings you back east through cedar and fir, with the lake below you on the right, and comes out behind the lodge.', {
      3: "The bench comes out behind the lodge, where the treetops came down on the night of the 12th. Please don't stop under them.",
      5: 'The trail comes out behind the lodge. Conditions are at the lodge.',
    }],
  ],
  look: {
    h2: ['What to look for', { 3: 'What you might see' }],
    items: [
      ['Tracks', ['Easiest to find first thing in the morning, in the mud along the water. Deer and snowshoe hare are the usual ones. Check anything else against the track card.', {
        2: 'The track card has a new line at the bottom for one reported up in the snow. Nobody has found it down here.',
        3: 'If you find the one on the bottom line of the card, turn around and walk back the way you came.',
        4: 'The track card is down to one track.',
        5: "It's the only track anybody is still finding.",
        6: 'Yours are the small ones.',
      }]],
      ['The reflection', ['On calm mornings the lake is a mirror. The bench on the way back is the best place to see the far shore upside down in it.', {
        2: "A few guests have told us the reflection doesn't always match the shoreline. It's probably the light. If you see it, tell the front desk where you were standing.",
        3: "If something in the water isn't on the shore, look at the trail and keep walking.",
        4: "What's standing in the trees in the reflection is really there. Please stop sending us photos of it.",
        5: "Don't look at the water any longer than you have to.",
      }]],
      ['Loons', ['Two pairs nest on the lake. Listen for them from the shore early in the morning and again around sunset.', {
        1: 'Two pairs nest on the lake. Listen for them from the shore early in the morning and again around dusk.',
        2: 'Two pairs nest on the lake. Guests keep reporting a third one calling from the wrong side.',
        3: "If you hear a loon calling from the trees, it isn't a loon.",
        4: 'Not seen. Still heard most nights, from the trees.',
      }]],
      ['The view from the bench', ['Looking south from the bench you can see right across to Cedar Flats on the far shore. Bring binoculars.', {
        4: 'You can see Cedar Flats from the bench. The tents are still up and nobody is in them.',
      }]],
    ],
  },
  know: {
    h2: 'Before you go',
    items: [
      ["Sign the trail register at the lodge trailhead, and sign out when you're back.", {
        3: 'Sign the register in your own handwriting.',
        4: "Sign out when you're back.",
        5: 'Nobody is checking the register.',
        6: "You're already signed in.",
      }],
      ["Bring water and a warm layer. It's cooler down by the water than it looks from the lodge.", {
        2: 'Bring water and a warm layer, and give yourself time to be back before dusk.',
        3: 'Be off the trail by dusk. Leave the headlamp in your pack.',
        5: 'No lights.',
      }],
      ["Canoes and kayaks rent by the hour at the lodge dock, life jackets included, if you'd rather see the shore from the water.", {
        1: "Canoes and kayaks are signed out by the hour at the lodge dock, life jackets included, if you'd rather see the shore from the water.",
        2: 'Canoes and kayaks are signed out at the lodge dock. If you know who took one out and left it adrift, please call the lodge.',
        3: 'Canoes and kayaks have to be back at the dock by dusk.',
        4: 'No canoe or kayak rentals.',
      }],
    ],
  },
  mapCap: ['Lakeshore Loop, trail 1 on the park map. Paper copies are free at both entrance stations.', {
    4: 'Lakeshore Loop on the park map, reprinted Sept. 16.',
    5: 'The marks come out on the south shore, by Cedar Flats.',
  }],
  // The lake depth diagram: a cross-section off the lodge dock, drawn to scale. 260 ft of water, with the
  // 259 ft fir from Cathedral Stand standing on the bottom and a foot to spare. It is never drawn on the
  // card. From stage 4 there is one tick at the waterline. From stage 5 the height scale carries on above
  // the waterline and off the top of the card.
  diagram: {
    title: 'Echo Lake: depth off the lodge dock',
    labels: {
      dock: 'Lodge dock',
      surface: 'Lake surface, 3,540 ft',
      bottom: 'Lake bottom',
      depth: '260 ft',
      fir: ['259 ft Douglas fir, Cathedral Stand', { 3: '259 ft Douglas fir (top section lost Sept. 12)' }],
      spare: '1 ft to spare',
      scale: 'Feet above the bottom',
      // the tick at the waterline, from stage 4 (flagged: staff putting Dana's account on a diagram)
      knees: ['', { 4: 'Up to about its knees (guest report)' }],
    },
    // Marks on the height scale, measured up from the lake bottom. `above` are added from stage 5, in the
    // same steps, past the waterline and off the top of the card: draw as many as fit and cut the last one
    // at the edge.
    scaleMarks: {
      marks: ['0', '50', '100', '150', '200', '250'],
      above: { from: 5, marks: ['300', '350', '400', '450', '500'] },
    },
    notes: [
      ['Off the end of the lodge dock the lake is 260 ft deep. Stand the tallest tree in the park on the bottom and its top would still be a foot under water.', {
        3: 'Off the end of the lodge dock the lake is 260 ft deep.',
        5: "The rest of it doesn't fit on the card.",
        6: "It isn't in the water anymore.",
      }],
      ['Cold enough to make you yelp, even in August.', { 1: 'Cold all the way down, even in August.' }],
    ],
    cap: ['Echo Lake off the lodge dock, drawn to scale. The tree is the big Douglas fir from Cathedral Stand.', {
      4: "Drawn to scale. The mark at the waterline is from a guest's report on the 15th.",
      5: 'Drawn to scale as far as the card goes.',
    }],
    alt: 'Diagram: a cross-section of Echo Lake off the lodge dock, 260 feet deep, with the 259 ft Douglas fir from Cathedral Stand drawn standing on the bottom and its top a foot under the surface.',
  },
};
