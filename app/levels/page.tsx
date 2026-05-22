import { redirect } from 'next/navigation'

export default function LevelsRedirect() {
    // Redirects to dashboard which currently acts as the main level page
    redirect('/dashboard')
}
