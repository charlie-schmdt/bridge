// Build a DiceBear API URL you can drop into <img src="..."/>
export function buildDiceBearUrl({
  style = "thumbs",
  seed,
  size = 128,
  format = "svg", // "svg" | "png" | "jpg"
  extra = "",     // e.g. "&radius=50&backgroundType=gradientLinear"
}: {
  style?: string;
  seed: string;
  size?: number;
  format?: string;
  extra?: string;
}) {
  const base = `https://api.dicebear.com/9.x/${style}/${format}`;
  const params = `?seed=${encodeURIComponent(seed)}&size=${size}${extra}`;
  return `${base}${params}`;
}