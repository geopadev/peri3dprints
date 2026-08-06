import type { Metadata } from "next";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory, saveCategory } from "./actions";
import { categoryErrorMessage } from "./messages";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = categoryErrorMessage(error);
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, position")
    .order("position", { ascending: true });

  const rows = categories ?? [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl">Categories</h1>
      <p>Groups on the shop page. A print can sit in one of them, or none.</p>

      {errorMessage && (
        <Card className="border-magenta">
          <p>{errorMessage}</p>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl">Add a category</h2>
        <form action={saveCategory} className="flex flex-col gap-3">
          <label className="font-semibold" htmlFor="new-category-name">
            Name
          </label>
          <Input id="new-category-name" name="name" required placeholder="Keyrings" />
          <p className="text-sm">The web address is made from the name if you leave it empty.</p>
          <Input name="slug" placeholder="keyrings" aria-label="Web address" />
          <input type="hidden" name="position" value={rows.length} />
          <div>
            <Button type="submit">Add category</Button>
          </div>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add one above. Prints work fine without any."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((category) => (
            <li key={category.id}>
              <Card className="flex flex-col gap-3">
                <form action={saveCategory} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="position" value={category.position ?? 0} />
                  <label className="font-semibold" htmlFor={`name-${category.id}`}>
                    Name
                  </label>
                  <Input id={`name-${category.id}`} name="name" defaultValue={category.name} />
                  <label className="font-semibold" htmlFor={`slug-${category.id}`}>
                    Web address
                  </label>
                  <Input id={`slug-${category.id}`} name="slug" defaultValue={category.slug} />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </div>
                </form>

                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button type="submit" variant="ghost">
                    Delete category
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
