// Phones and tablets (no hover, coarse pointer) get a lighter rendering profile; desktop is untouched.
export const MOBILE = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;
