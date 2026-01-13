import { redirect } from 'next/navigation';
import { BankCards } from "@/components/bank-cards"

// ¡IMPORTANTE: El redirect debe estar DENTRO de esta función!
export default function Page() {
  redirect('/dashboard');
}