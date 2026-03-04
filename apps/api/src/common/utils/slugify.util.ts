import slugify from "slugify";

export const generateSlug = async (text: string): Promise<string> => {
  return slugify(text, {
    replacement: '_',
    remove: undefined,
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  })
}
