import ArticleForm from "@/components/admin/ArticleForm";
import ArticleListTable from "@/components/admin/ArticleListTable";

export default function page() {
  return (
    <div>
      <ArticleForm />
      <ArticleListTable />
    </div>
  );
}
