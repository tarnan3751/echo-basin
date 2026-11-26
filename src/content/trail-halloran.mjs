// Copy for the Halloran Meadows trail page (/trails/halloran-meadows/).
// Same conventions as src/content.mjs: each piece is a string or [base, { stage: alternate }], and a stage with no
// alternate keeps the most recent one.
// Distance, climb and time come from the trail table (C.trails.rows), and the status box shows that row's status
// word for word, so neither is repeated here. The route is the first part of the Echo Pass trail: trail 3 on the
// park map up to Echo Point, then trail 4 to the meadows.
// Beats come from what the site already says about the meadows at each stage: the zones entry, the elk entry and
// the wildlife caption, the trail row, and from stage 4 the reprinted map.
export const trailHalloran = {
  titles: [
    'Halloran Meadows | Echo Basin National Park',
    'Halloran Meadows | Echo Basin National Park',
    'Halloran Meadows: Elk Most Evenings | Echo Basin National Park',
    'Halloran Meadows: Daylight Only | Echo Basin National Park',
    'Halloran Meadows | Echo Basin',
    'Halloran Meadows | Echo Basin',
    "Don't turn around",
  ],
  name: 'Halloran Meadows',
  facts: [
    ['Start', 'Basin Lodge trailhead, by way of Echo Point'],
    ['Terrain', 'Steep to Echo Point, then a long run of switchbacks. Level across the meadows.'],
  ],
  intro: ["Most people turn around at Echo Point. Keep climbing and you come out on a wide bench of meadow at 6,230 feet. Wildflowers peak in July, and it's the best place in the park to see elk.", {
    2: "If you're going up for the elk, they're still there most evenings. Lately they mostly stand still, all facing the trees on the east side. If you can tell what they're looking at, let a ranger know.",
    3: "It's five hours there and back and the trail closes at dusk, so start in the morning.",
    4: 'Closed since Sept. 14, along with everything else north of the lake above 3,760 feet.',
    5: 'Closed. Nobody needs to go up there now.',
    6: 'It came through here on its way to you.',
  }],
  walk: [
    ['The trail starts at the Basin Lodge trailhead and climbs steeply through the trees to the rail at Echo Point. That first half mile is the hardest part of the day, so catch your breath at the top and give the cliffs a yell.', {
      3: 'The trail starts at the Basin Lodge trailhead and climbs steeply through the trees to the rail at Echo Point. No shouting from the rail until further notice.',
      4: 'The first half mile is the Echo Point trail, which is closed too.',
    }],
    ["Past the point the trail heads uphill again and switchbacks a long way through the trees. It's easier going than the first half mile, but you don't get much of a view until the meadows.", {
      3: "Past the point the trail switchbacks up through the trees. Please don't cut the corners. It doesn't follow the trails, so you're better off on one.",
      4: 'The line on the reprinted map comes down through the meadows and partway down the switchbacks above Echo Point.',
    }],
    ['You come out of the trees onto the meadows and the trail levels off across the bench. Halloran Creek runs through the middle and falls off the lower edge of the bench, above the head of the lake.', {
      4: "You come out of the trees onto the meadows. There's been a straight track through the flowers since the 15th, holes forty feet apart, and we didn't cut it.",
    }],
  ],
  look: {
    h2: ['What to look for', { 3: 'What you might see' }],
    items: [
      ['Wildflowers', 'They peak in July. Please keep to the trail through them, because a shortcut kills plants that take twenty years to grow back.'],
      ['Elk', ['A herd of about sixty grazes here most evenings. Bring binoculars and stay at least 25 yards back.', {
        1: 'A herd of about sixty gathers here most evenings. Bring binoculars and stay at least 25 yards back.',
        2: "The bulls haven't bugled once this year, and nobody's sure why.",
        3: 'If the whole herd leaves at once, leave the meadow the same way they went.',
        4: 'None counted since Sept. 14.',
      }]],
      ['The view', ["It's the only place in the park where you can see the lake and the pass at the same time. Walk down to the lower edge of the meadow for the best of it.", {
        5: 'You can see the whole line from here.',
      }]],
    ],
  },
  know: {
    h2: 'Before you go',
    items: [
      ["Allow five hours, and longer if you're staying for the elk. If you are, you'll be walking down after sunset, so bring a headlamp.", {
        1: "Allow five hours, and longer if you're staying for the elk. If you are, you'll be walking down after dusk, so bring a headlamp.",
        3: "Don't stay for the elk. Rangers sweep the trails at 6 pm.",
      }],
      ["Bring water and a warm layer. There's no cell coverage past the lodge.", {
        3: 'Bring water and a warm layer, and leave the binoculars at the lodge.',
      }],
    ],
  },
  mapCap: ['Halloran Meadows, trail 4 on the park map. It starts where the Echo Point trail ends.', {
    4: 'Park map, reprinted Sept. 16. The line comes down through the meadows.',
    5: 'The line runs through every stop on this trail.',
  }],
  // The view down from the meadows (new painted scene). It looks south-west down the line: Echo Point below, the lodge
  // on its point, the lake, Cedar Flats on the far shore, the ridge beyond. The caption never describes what the
  // picture adds at 5 and 6. Stage 6 does not depend on the gap in the far ridge, which is flagged.
  picture: {
    cap: ['Looking down from Halloran Meadows over Echo Point to Basin Lodge, with Cedar Flats across the lake.', {
      4: 'The track through the flowers has been there since the 15th. It lines up with the lodge.',
      5: 'The track runs straight from here to the lake.',
      6: 'It left the park this way.',
    }],
    alt: 'A painting of the view down from Halloran Meadows: wildflowers in front, Echo Point below, Basin Lodge on its point at the edge of Echo Lake, Cedar Flats on the far shore and a wooded ridge beyond.',
  },
};
