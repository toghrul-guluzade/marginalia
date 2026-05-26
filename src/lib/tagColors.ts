// Fixed palette; tag colors are auto-assigned (not user-chosen) by hashing the name.
const TAG_PALETTE = [
  { bg: "#EEF2FF", text: "#4338CA" },
  { bg: "#ECFDF5", text: "#047857" },
  { bg: "#FEF2F2", text: "#B91C1C" },
  { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#FDF4FF", text: "#A21CAF" },
  { bg: "#F0F9FF", text: "#0369A1" },
];

export function tagColor(tag: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
