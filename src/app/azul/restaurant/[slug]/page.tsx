import { RestaurantScreen } from '@/screens/RestaurantScreen';

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RestaurantScreen slug={slug} />;
}
