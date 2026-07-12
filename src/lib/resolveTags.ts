import slugify from "slugify";
import Tag from "@/Model/Tag";
import { Types } from "mongoose";

/**
 * Takes an array of raw tag name strings (from the article form),
 * finds existing Tag docs or creates new ones, and returns their ObjectIds.
 * Dedupes by slug so "Cricket" and "cricket" resolve to the same tag.
 */
export async function resolveTags(
  rawTags: string[],
): Promise<Types.ObjectId[]> {
  console.log("resolveTags called with:", rawTags); // ADD THIS

  if (!rawTags || rawTags.length === 0) return [];

  const cleanNames = Array.from(
    new Set(rawTags.map((t) => t.trim()).filter((t) => t.length > 0)),
  );

  console.log("cleanNames after processing:", cleanNames); // ADD THIS

  const tagIds: Types.ObjectId[] = [];

  for (const name of cleanNames) {
    const slug = slugify(name, { lower: true, strict: true });
    if (!slug) continue;

    const tag = await Tag.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug } },
      { new: true, upsert: true },
    );

    console.log("Resolved tag:", tag); // ADD THIS

    tagIds.push(tag._id as Types.ObjectId);
  }

  console.log("Final tagIds:", tagIds); // ADD THIS

  return tagIds;
}
