// Edit ONLY this file to change which ads show and where they link.
// This file is small on purpose, so it's easy to update from a phone.
//
// Each ad needs:
//   id       - unique, keep the "ad-XX" pattern or change it, just don't repeat one
//   sponsor  - the name shown on the card
//   tagline  - a short line under the name
//   hue      - a hex color for the card's icon background (any hex works)
//   url      - the link that opens when someone taps this ad
//
// After editing, commit the change on GitHub - Vercel redeploys automatically
// within a minute or two, no extra steps needed.

const AD_POOL = [
  { id: 'ad-04', sponsor: 'Watch for 1 point #4', tagline: 'Tap to watch', hue: '#5A7D5A', url: 'https://gasptournament.com/zr61dqxj?key=510863d07fc0f2f92c4788d2a977cc4e' },
  { id: 'ad-03', sponsor: 'Watch for 1 point #3', tagline: 'Tap to watch', hue: '#B23A2E', url: 'https://gasptournament.com/u8w628qc?key=abe71ada36018e74a0db5a719d6cab8c' },
  { id: 'ad-05', sponsor: 'Watch for 1 point #5', tagline: 'Tap to watch', hue: '#8A6BAF', url: 'https://gasptournament.com/wd8j9afpq?key=1129e4b741cc18807426039cc2959f92' },
  { id: 'ad-02', sponsor: 'Watch for 1 point #2', tagline: 'Tap to watch', hue: '#4C6B8A', url: 'https://gasptournament.com/buvmiz4b?key=7b2d37a742f685fc7d46dbba8cb30626' },
  { id: 'ad-01', sponsor: 'Watch for 1 point #1', tagline: 'Tap to watch', hue: '#2E6F52', url: 'https://gasptournament.com/tdb5v2ygku?key=535e64707678e5ca73ec5b38530f6e94' },
];

export default AD_POOL;
