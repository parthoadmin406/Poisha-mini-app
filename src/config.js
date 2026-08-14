// Edit ONLY this file to control withdrawals. This file is small on purpose,
// so it's easy to update from a phone.
//
// After editing, commit the change on GitHub - Vercel redeploys automatically
// within a minute or two, no extra steps needed.

// Set to false to pause withdrawals app-wide (shows a "paused" message
// instead of the form). Set back to true whenever you want to allow them.
export const WITHDRAWALS_ENABLED = false;

// Minimum withdrawal amount, in Taka.
export const MIN_TAKA = 20;
// Max points a user can earn in one streak before they must wait.
export const MAX_CYCLE_POINTS = 160;

// Hours to wait after hitting the cap before earning again.
export const CYCLE_COOLDOWN_HOURS = 1;
