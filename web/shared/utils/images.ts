// file: shared/utils/images.ts
/**
 * Возвращает публичный URL картинки, хранящейся в Supabase Storage.
 * Если `src` уже абсолютный URL – вернёт как есть.
 */
export function getPublicImageUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'public';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${src}`;
}
