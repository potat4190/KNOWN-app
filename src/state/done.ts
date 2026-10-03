/** Whether the moment that just ended was saved (shown on Done). Not persisted. */
let lastSaved = false;
export const setLastSaved = (v: boolean) => (lastSaved = v);
export const wasSaved = () => lastSaved;
