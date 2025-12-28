import AdminReportClient from "@/components/admin/AdminReportClient";

export default function AdminReportPage({ params }: { params: { id: string } }) {
  return <AdminReportClient reportId={params.id} />;
}
