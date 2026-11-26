// Copy for the Plan your visit page, above the existing `plan` block in src/content.mjs (its heading, the dock
// picture and the last button stay at the end of the page and are not in this file).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with no
// alternate keeps the most recent one.
// Must agree at every stage with `glance` ("Open", "Entrance fee"), the ticker, the footer ("Hours and seasons" becomes
// "Daylight hours" at stage 3) and src/content/conditions.mjs.
// Rows are [label, value] for hours and [label, price, note] for fees.
// The vehicle pass is a document drawn on the same paper as the track card. `issued` and `number` are its handwritten
// lines, blank until stage 6. At stage 6 {date} and {time} are the reader's own, taken from their first arrival on
// the site, as the register's line is. `sample` and `stamp` are rubber stamps, set in capitals like the memo's FILED.
export const planPage = {
  titles: [
    'Plan Your Visit | Echo Basin National Park',
    'Plan Your Stay | Echo Basin National Park',
    'Plan Your Visit: Arrive Before Dusk | Echo Basin National Park',
    'Plan Your Visit (Day Use) | Echo Basin National Park',
    'Plan Your Visit | Echo Basin',
    'Plan Your Visit | Echo Basin',
    "Don't turn around",
  ],

  hours: {
    h2: ['Hours and seasons', { 3: 'Daylight hours' }],
    intro: ['You can visit any time of year. Some things close for the season, though, so check the list before you come.', {
      3: 'Until further notice, please be indoors by 7:42.',
      4: 'Stay indoors tonight.',
    }],
    rows: [
      ['Park', ['Open all year, 24 hours', { 1: 'Open all year, all hours', 2: 'Daily, dawn to dusk', 3: 'Daylight hours only', 5: 'Closed to the public' }]],
      ['Basin Lodge', ['Open all year', { 3: 'All guests inside by dusk', 5: 'Closed' }]],
      ['Cedar Flats Campground', ['May to October. Quiet hours 10 pm to 6 am.', {
        2: 'May to October. Quiet hours now start at dusk.',
        3: 'Everyone in tents by 7:42 pm, no exceptions',
        4: 'Closed',
      }]],
      ['Trails', ['Open all year. Expect snow above 7,500 ft most of the year.', {
        2: 'Dawn to dusk',
        3: 'Close at dusk. Rangers sweep at 6 pm. Closed above 7,500 ft.',
        4: 'Lakeshore Loop only',
        5: 'Closed',
      }]],
      ['Pass Hut', ['Staffed daily through Sept. 30. From November to May, Tomás patrols the pass on skis and keeps the hut stocked.', {
        1: 'Occupied daily through Sept. 30. From November to May, Tomás patrols the pass on skis and keeps the hut stocked.',
        3: 'Not staffed after dark',
        4: 'Door found open 9/15. Do not go in.',
      }]],
      ['Rangers on duty', ['31 in summer, about a dozen in winter', { 4: 'One who answers the radio', 5: 'One' }]],
    ],
    note: ['Wildflowers in Halloran Meadows peak in July. The elk bulls bugle through September, and you can hear them from the lodge.', {
      2: "Wildflowers in Halloran Meadows peak in July. The elk bulls haven't bugled at all this year.",
      3: 'Halloran Meadows is open in daylight only.',
      4: 'Halloran Meadows is closed. No elk have been counted since the 14th.',
    }],
  },

  fees: {
    h2: 'Fees and passes',
    intro: ['One pass covers a vehicle and everyone in it. Hang it from your rearview mirror so a ranger can see it.', {
      1: 'One pass covers a vehicle and everyone in it. Hang it from your rearview mirror where it can be seen.',
      2: "We've started stamping passes with a reminder that the Lakeshore Rd gate locks at dusk.",
      3: 'Passes are good in daylight hours only, until further notice.',
      5: 'You came in without a pass.',
      6: 'Your pass has been issued.',
    }],
    rows: [
      ['Vehicle pass', ['$30', { 5: 'Waived' }], ['Good for seven days. Sold at both entrance stations and online.', { 4: 'No charge to leave.' }]],
      ['Cedar Flats campsite', '$28/night', ['Per site. Book ahead for summer weekends.', { 4: 'Closed.' }]],
      ['Backcountry permit', '$12 per group', ['Needed for overnight trips above Halloran Meadows. Pick it up in person at the ranger station.', { 3: 'Not issued after 12 noon.', 4: 'Not being issued.' }]],
    ],
    note: "Lodge rooms start at $189 a night and cabins at $240. See Lodging for what's included.",
  },

  pass: {
    // Alt text. The renderer should add the stamp's words when there is a stamp.
    label: ['Sample seven-day vehicle pass for Echo Basin National Park, $30. The date, time and visitor number are blank.', {
      6: 'Seven-day vehicle pass for Echo Basin National Park, $30, issued {date} at {time} to visitor number 412,001.',
    }],
    head: 'Echo Basin National Park',
    title: 'Seven-day vehicle pass',
    price: '$30',
    lines: [
      'Valid for one private vehicle and its occupants for seven days from the date of issue.',
      'Hang from rearview mirror, printed side out.',
      'Not transferable.',
    ],
    small: 'Echo Basin Park Authority. Keep until you leave the park. Lost passes cannot be replaced.',
    issued: [
      ['Date issued', ['', { 6: '{date}' }]],
      ['Time', ['', { 6: '{time}' }]],
    ],
    number: ['Visitor no.', ['', { 6: '412,001' }]],
    sample: ['SAMPLE', { 6: '' }],
    stamp: ['', { 2: 'GATE LOCKS AT DUSK', 3: 'DAYLIGHT HOURS ONLY', 4: 'NO CHARGE TO LEAVE', 5: 'WAIVED' }],
  },

  getting: {
    h2: 'Getting here',
    intro: ["We're about two and a half hours from the city. There are two ways in, and each has an entrance station where you can buy a pass.", {
      2: "We're about two and a half hours from the city. If you're driving up after work, leave the city by 5, because the Lakeshore Rd gate locks at 7:42 now.",
      3: "Arrive in daylight. If you can't be indoors by 7:42, please come another day.",
      4: "There's a conditions advisory tonight for the whole basin. Please don't drive up.",
      6: "It didn't come by road.",
    }],
    routes: [
      { name: 'West Entrance', body: ['At the west end of the lake, by the Echo River. Lakeshore Rd runs from here along the north shore to Basin Lodge, past the Cathedral Stand trailhead.', {
        4: 'Lakeshore Rd is closed past the boat launch, staff vehicles only.',
        5: 'Lakeshore Rd crosses the line at the lodge.',
      }] },
      { name: 'South Entrance', body: ['On the south road through Cedar Gap, past the ranger station. The road meets Lakeshore Rd near Cedar Flats, and you follow that around the head of the lake to the lodge. Come this way if you need a backcountry permit.', {
        4: "Cedar Flats is closed, and the ranger station isn't issuing permits.",
      }] },
    ],
    note: ['Paper maps are free at both entrance stations. The nearest town is sixty miles away, so get gas before you leave the highway.', {
      3: "Hand in any paper map with a straight line on it that isn't on ours.",
      4: 'The paper map was reprinted on the 16th. Staff will swap your old one, no questions asked.',
      5: 'The maps at the entrance stations are out of date.',
    }],
  },

  access: {
    h2: 'Accessibility',
    items: [
      ['The Cathedral Stand boardwalk is flat and wheelchair accessible, with accessible parking at the trailhead. The rest of the 2.8 mile loop climbs 300 ft.', {
        2: "The Cathedral Stand boardwalk is flat and wheelchair accessible. For now it's the only part of the stand that's open.",
        3: 'The Cathedral Stand boardwalk is flat and wheelchair accessible. It closes at 5 pm.',
        4: 'Cathedral Stand is closed.',
      }],
      ['Basin Lodge has two accessible rooms with roll-in showers, both on the ground floor near the lobby. Ask for one when you book.', {
        4: 'Basin Lodge has two accessible rooms. Both are empty.',
      }],
      ['The dock is level with the path from the lodge, and staff can help you in and out of a canoe.', {
        2: 'The dock is level with the path from the lodge, and staff can help you in and out of a canoe. Please stay in sight of the dock.',
        4: 'The dock is closed.',
      }],
      ['You can buy a pass and pick up a map at either entrance station without getting out of your car.', {
        5: "There's nobody at the entrance stations.",
      }],
    ],
  },

  faq: {
    h2: 'Common questions',
    items: [
      ['Is the park open in winter?', ["Yes. The lodge stays open and we plow the road to it all winter. Cedar Flats closes for the season. Above Halloran Meadows you'll need skis or snowshoes, so check with a ranger before you go up.", {
        4: "We don't know yet.",
      }]],
      ['Will my phone work?', ["Around the lodge, mostly. There's no cell coverage past it, so take a paper map and sign the trail register before you set out.", {
        3: 'At the lodge. After dusk, keep your screen off outside. A screen counts as a light.',
        5: 'Your screen has been on the whole time.',
      }]],
      ['Can I have a campfire?', ['Yes, in the fire rings at Cedar Flats. Fire danger is moderate right now, so keep it small and put it all the way out before bed.', {
        3: 'No. No lanterns or headlamps outside after dusk either.',
      }]],
      ['Can I swim in the lake?', ["You can, but it's cold even in August, and there's no lifeguard. It's 260 feet deep off the lodge dock.", {
        3: "Daylight only, and stay close to shore. Please don't stare at the reflection.",
        4: 'No. Please stay out of the lake.',
      }]],
      ['Can I shout at Echo Point?', ["Everybody does. From the rail you'll hear four echoes, one for each cliff. June's echo talk at 10 and 2 explains why.", {
        1: "Everybody does. From the rail you'll hear four answers, one for each cliff. June's echo talk at 10 and 2 explains why.",
        2: 'Everybody does. You should hear four echoes. If you hear a fifth, tell a ranger what time it was.',
        3: 'No. Echo Point is closed to shouting until further notice.',
        4: 'No. Echo Point is closed.',
        5: 'Nobody has since the 14th.',
      }]],
    ],
  },
};
