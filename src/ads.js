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
  { id: 'ad-04', sponsor: 'Watch for 1 point #4', tagline: 'Tap to watch', hue: '#5A7D5A', url: 'https://wwpb.ailooe.com/redirect-zone/8ccc5a63' },
  { id: 'ad-03', sponsor: 'Watch for 1 point #3', tagline: 'Tap to watch', hue: '#B23A2E', url: 'https://wwpb.ailooe.com/redirect-zone/88ea7947 '},
  { id: 'ad-05', sponsor: 'Watch for 1 point #5', tagline: 'Tap to watch', hue: '#8A6BAF', url: 'https://wwpb.ailooe.com/redirect-zone/ddcea1c0' },
  { id: 'ad-02', sponsor: 'Watch for 1 point #2', tagline: 'Tap to watch', hue: '#4C6B8A', url: 'https://wwpb.ailooe.com/redirect-zone/e3a04ce3' },
  { id: 'ad-01', sponsor: 'Watch for 1 point #1', tagline: 'Tap to watch', hue: '#2E6F52', url: 'https://wwpb.ailooe.com/redirect-zone/ddcea1c0' },
];

export default AD_POOL;
