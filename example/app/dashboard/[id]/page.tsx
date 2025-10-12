export default async function Dashboard({
  params,
}: {
  params: { id: string };
}) {
  return <div>Dashboard {(await params).id}</div>;
}
