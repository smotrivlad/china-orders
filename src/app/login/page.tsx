import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoginForm from './LoginForm'

export const metadata = { title: 'Вход — EASTWIND LOGISTIC' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next = '/cabinet', error } = await searchParams
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen flex items-center justify-center px-4 py-28"
        style={{ background: '#0f1729' }}
      >
        <Suspense>
          <LoginForm redirectTo={next} serverError={error} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
