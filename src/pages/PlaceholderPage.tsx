import PageHeader from '../components/common/PageHeader';
import { EmptyState } from '../components/common/States';
export default function PlaceholderPage({ title }: { title: string }) {
  return (<><PageHeader title={title} /><div className="mx-auto max-w-6xl px-4 py-12"><EmptyState text="หน้านี้อยู่ระหว่างการจัดทำเนื้อหา" /></div></>);
}
