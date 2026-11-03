import { redirect } from 'next/navigation';

export default function HomePage() {
  // Directly open the Candidate Application Form without any preview step
  redirect('/apply');
}
