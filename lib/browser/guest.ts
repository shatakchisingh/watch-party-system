const GUEST_ID_KEY = 'syncspace_guest_id';
const GUEST_NAME_KEY = 'syncspace_guest_name';

export function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function getGuestName() {
  return localStorage.getItem(GUEST_NAME_KEY) || '';
}

export function saveGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name.trim());
}
