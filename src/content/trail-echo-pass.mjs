// Copy for the Echo Pass trail page (/trails/echo-pass/).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with no
// alternate keeps the most recent one. In the diagram, '' means the label is not drawn at that stage.
// Distance, climb and time come from the trail table (C.trails.rows), and the status box shows that row's status
// word for word, so neither is repeated here. The route is trails 3, 4 and 5 on the park map: lodge to Echo Point,
// on to Halloran Meadows, up the Halloran Creek valley to the Pass Hut and the pass.
// Beats come from what the site already says about the pass and the hut at each stage: the zones entry, the hut
// caption (capB), Tomás's bio, the trail row, the trail note, the ticker and the conditions cards.
// The hut's height is never given (story bible 9.15).
export const trailEchoPass = {
  titles: [
    'Echo Pass | Echo Basin National Park',
    'Echo Pass | Echo Basin National Park',
    'Echo Pass: Unidentified Tracks | Echo Basin National Park',
    'Echo Pass: Closed for the Season | Echo Basin National Park',
    'Echo Pass | Echo Basin',
    'Echo Pass | Echo Basin',
    "Don't turn around",
  ],
  name: 'Echo Pass',
  facts: [
    ['Start', 'Basin Lodge trailhead, by way of Echo Point and Halloran Meadows'],
    ['Terrain', 'Steep in places, with snow on the trail above 7,500 ft.'],
  ],
  intro: ['This is the long one, a full day there and back from the lake to the snow at the top of the basin. Start early, and plan on a stop at the Pass Hut on the way up.', {
    3: 'Everything above 7,500 feet is closed for the season. You can still go as far as Halloran Meadows in daylight.',
    4: 'Closed. Tomás last radioed in from the Pass Hut at 5:30 am on the 15th.',
    5: 'Closed. The prints come all the way down now.',
  }],
  walk: [
    ["The first part is the Halloran Meadows trail, steeply up to Echo Point and then a long run of switchbacks through the trees to the meadows at 6,230 feet. By the meadows you've done a little over half the climb.", {
      4: "Everything above 3,760 feet has been closed since the 14th. That's nearly the whole trail.",
    }],
    // Stage 3 only drops the welcome at the end.
    ["Above the meadows the trail follows Halloran Creek up its valley toward the pass. The trees thin out and you reach the snow at about 7,500 feet. The Pass Hut is about a mile below the top, and you're welcome to stop in and warm up.", {
      3: 'Above the meadows the trail follows Halloran Creek up its valley toward the pass. The trees thin out and you reach the snow at about 7,500 feet. The Pass Hut is about a mile below the top.',
      4: 'On the morning of the 15th the hut door was open and the stove was still warm. Two pairs of snowshoes were standing outside.',
      5: 'Tomás had the hut lamp on.',
    }],
    ["From the hut it's switchbacks in the snow for the last mile to the pass at 8,560 feet. Poles help.", {
      3: 'On Sept. 13 a line of prints came over the pass and down to the hut door.',
      4: "The prints didn't stop at the hut door. They carry on down the valley.",
    }],
  ],
  look: {
    h2: ['What to look for', { 3: 'What you might see' }],
    items: [
      [['Snow', { 3: 'Tracks' }], ["It's firmest first thing in the morning. By afternoon it gets soft and slow, which is one more reason to start early.", {
        2: "A few hikers have reported tracks in the snow up there that we can't identify. It's probably old tracks melted out of shape, but if you see them, tell a ranger where.",
        3: "They're about six feet long and forty feet apart, in one line. If you come across them, turn around and walk back the way you came.",
        6: 'The last one is 38 feet behind you.',
      }]],
      ['Pass Hut', ["Staffed daily through Sept. 30. Tomás keeps it stocked, and he'll tell you his coffee is the best in the park.", {
        1: "Occupied daily through Sept. 30. Tomás keeps it stocked, and he'll tell you his coffee is the best in the park.",
        3: "Not staffed after dark. Please don't knock.",
        4: 'Do not go in.',
        5: 'No longer staffed.',
      }]],
      [['The view from the top', { 3: 'The pass' }], ["It's the one on the postcards, so pick a clear day.", {
        3: 'Conditions were last reported near the pass, heading downhill.',
        4: 'No report from the pass since the 15th.',
      }]],
    ],
  },
  know: {
    h2: 'Before you go',
    items: [
      ['Most people take about nine hours, and sunset is at 7:42. Pick a time to turn back before you start, and stick to it.', {
        1: 'Most people take about nine hours, and dusk is at 7:42. Pick a time to turn back before you start, and stick to it.',
        3: "If you're going as far as the meadows, start in the morning and be indoors by 7:42.",
      }],
      'Bring poles, water and a warm layer. The pass usually runs about 20 degrees colder than the lake.',
      ['Overnight trips above Halloran Meadows need a backcountry permit, $12 per group, from the ranger station.', {
        3: 'Backcountry permits are not issued after 12 noon.',
        4: 'Backcountry permits are not being issued.',
      }],
    ],
  },
  mapCap: ['Echo Pass, trail 5 on the park map, from Halloran Meadows to the top. Trails 3 and 4 get you to the meadows.', {
    3: 'The hatched area is a seasonal closure. The trail is crossed out above the hut.',
    4: 'Park map, reprinted Sept. 16. The line comes straight down from the pass, past the hut and through the meadows.',
    5: 'Follow the line down and you end up at the lodge.',
  }],
  // The elevation profile, lodge to pass, on the same card paper as the map and the conditions cards. Every word
  // lettered on it is here. For whoever draws it (reference, not copy): miles are along the trail, one way, so Echo
  // Point sits at about 0.55, the meadows at 3.2 and the pass at 5.9 (half of each round trip in the trail table);
  // the hut is about a mile below the pass, just above where the profile crosses 7,500 ft. The stage 4 pin is
  // between the lodge and Echo Point, about 700 ft short of the rail. At 6 there is no pin: the line runs on past
  // the lodge and off the edge of the card, and `end` is lettered where it leaves.
  // The three stop suffixes are the park map's own, at the same stages.
  diagram: {
    title: 'Basin Lodge to Echo Pass',
    labels: {
      sub: 'Elevation profile, one way',
      miles: 'Miles from the lodge',
      feet: 'Feet',
      stops: {
        lodge: { name: 'Basin Lodge', ft: '3,540 ft' },
        point: { name: ['Echo Point', { 3: 'Echo Point (no shouting)' }], ft: '4,330 ft' },
        meadows: { name: ['Halloran Meadows', { 4: 'Halloran Meadows (no elk)' }], ft: '6,230 ft' },
        snowline: { name: 'Snowline', ft: '7,500 ft' },
        hut: { name: ['Pass Hut', { 4: 'Pass Hut (do not enter)' }], ft: null },
        pass: { name: 'Echo Pass', ft: '8,560 ft' },
      },
      tracks: ['', { 2: 'Unidentified tracks', 3: '' }],
      closure: ['', { 3: 'Seasonal closure above 7,500 ft', 4: 'Closure extended to 3,760 ft, Sept. 14', 5: 'Closed until further notice' }],
      pin: ['', { 3: 'Last reported Sept. 13', 4: 'Last reported Sept. 16, 0.4 mi NE of the lodge', 5: 'At the lodge', 6: '' }],
      end: ['', { 6: 'You' }],
    },
    notes: [
      'Round trip from the lodge: Echo Point 1.1 mi, 1 hr. Halloran Meadows 6.4 mi, 5 hr. Echo Pass 11.8 mi, 9 hr.',
      ['Snow above 7,500 ft most of the year. Pass Hut staffed daily through Sept. 30.', { 3: 'Pass Hut not staffed after dark.' }],
      ['', { 4: 'Revised Sept. 16', 5: 'No longer updated', 6: 'Updated just now' }],
    ],
    cap: ['The Echo Pass trail seen from the side, one way from the lodge.', {
      2: "We've marked where the unidentified tracks have been reported.",
      3: 'Hatched ground is closed. The pin shows where conditions were last reported.',
      4: 'The hatching now starts just above the lodge.',
      5: 'The pin is at the lodge.',
      6: "It didn't stop at the lodge.",
    }],
    alt: 'An elevation profile of the Echo Pass trail, climbing from Basin Lodge at 3,540 feet past Echo Point at 4,330 feet, Halloran Meadows at 6,230 feet, the snowline at 7,500 feet and the Pass Hut to Echo Pass at 8,560 feet.',
  },
};
