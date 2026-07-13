import Tag from "@/Model/Tag";
import { Types } from "mongoose";
import { toSlug } from "./slugify";


/**
 * Takes an array of raw tag name strings (from the article form),
 * finds existing Tag docs or creates new ones, and returns their ObjectIds.
 * Dedupes by slug so "Cricket" and "cricket" resolve to the same tag.
 */
export async function resolveTags(rawTags: string[]): Promise<Types.ObjectId[]> {
  if (!rawTags || rawTags.length === 0) return [];

  const cleanNames = Array.from(
    new Set(rawTags.map((t) => t.trim()).filter((t) => t.length > 0))
  );

  const tagIds: Types.ObjectId[] = [];

  for (const name of cleanNames) {
    let slug = toSlug(name);

    // Fallback for edge cases where the name is pure punctuation/whitespace
    // and produces an empty slug even after Bengali-safe processing.
    if (!slug) {
      slug = `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const tag = await Tag.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug } },
      { new: true, upsert: true }
    );

    tagIds.push(tag._id as Types.ObjectId);
  }

  return tagIds;
}