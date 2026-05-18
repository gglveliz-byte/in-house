import { RestaurantScreen } from '@/screens/RestaurantScreen';

export default function RestaurantPage({ params }: { params: { slug: string } }) {
  return <RestaurantScreen slug={params.slug} />;
}
