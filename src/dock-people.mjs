// The six people on the lodge pier in the last picture. They are the people who were still at the lodge on the 16th:
// two guests from Cabin 3 (Dana, whose portrait is in the visitor account, and her husband), the one guest left in
// the main building, and three of the lodge's own staff. None of them is a ranger and none is anybody who went
// missing earlier. Colours here are the clothes as they would look by day; the picture relights them.
import * as L from './lib.mjs';
const { mix } = L;

export function dockPeople(){
  const G = L.PAL.gold;
  return [
    // the attendant from the boat dock: a yellow life vest over a grey hooded top
    { name: 'attendant', h: 1.86, sp: { kind: 'vest', straps: true, build: 1.05, skin: '#D2996E', skinSh: '#AC7654', hair: '#C7A46B', brow: '#8F7044', hairStyle: 'short',
      top: { lit: '#EDB140', sh: '#BE8526' }, sleeve: { lit: '#9C97A6', sh: '#6F6A7C' }, pants: { lit: '#A98F6C', sh: '#7C684E' }, boots: '#2A2230' } },
    // Dana K., Cabin 3: the jacket, collar and roll-neck of her portrait
    { name: 'dana', h: 1.63, sp: { kind: 'jacket', build: 0.93, skin: '#EDB08C', skinSh: '#C98A70', hair: '#2B2136', hairStyle: 'bob', neck: 'roll', collar: '#F6E3C4',
      top: { lit: G.tealLight, sh: G.teal }, leaf: { lit: G.coral, sh: G.coralSh }, pants: { lit: '#4A3E57', sh: G.plumDeep }, boots: '#1B1420' } },
    // the guest from the main building, out in his dressing gown and slippers
    { name: 'guest', h: 1.72, sp: { kind: 'robe', build: 1.08, skin: '#E3AC8E', skinSh: '#BD866E', hair: '#BDB8BC', brow: '#8F8A90', hairStyle: 'short', beard: true, collar: '#C9D6DF',
      top: { lit: '#7A3B4C', sh: '#532636' }, pants: { lit: '#B4C3D0', sh: '#8797AA' }, pin: '#6E86A6', feet: 'slippers', slipper: '#4A3E57' } },
    // Dana's husband, as he got out of bed: a pullover over pyjama trousers, nothing on his feet
    { name: 'mark', h: 1.8, sp: { kind: 'sweater', build: 1.0, skin: '#DBA380', skinSh: '#B67F64', hair: '#5A4636', hairStyle: 'short', glasses: '#2A2230',
      top: { lit: '#7B90A2', sh: '#55697A' }, pants: { lit: '#655C7C', sh: '#453E5A' }, pin: '#928BB0', feet: 'bare' } },
    // the front desk: the lodge's quilted vest over a shirt, with a name badge
    { name: 'desk', h: 1.68, sp: { kind: 'vest', tag: true, build: 0.96, skin: '#8E5A44', skinSh: '#6C4133', hair: '#1B1420', hairStyle: 'bun', earrings: true,
      top: { lit: '#8C3A46', sh: '#5E2531' }, sleeve: { lit: G.cream, sh: G.creamSh }, pants: { lit: mix(G.teal, G.tealLight, 0.3), sh: G.tealDeep }, boots: '#1B1420' } },
    // the cook: whites with the sleeves pushed up, a dark apron, a kitchen cap
    { name: 'cook', h: 1.74, sp: { kind: 'jacket', sleeves: 'rolled', build: 1.06, skin: '#C68A6A', skinSh: '#A26B54', hair: '#241B2E', hairStyle: 'beanie', beanie: { lit: '#3A3948', sh: '#22212C', band: '#3A3948' },
      top: { lit: '#F1EBDD', sh: '#C5BDAE' }, apron: { lit: '#3B4E58', sh: '#24333B' }, pants: { lit: '#55556A', sh: '#37374A' }, boots: '#1B1420' } },
  ];
}
