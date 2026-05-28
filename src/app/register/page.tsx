import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RegisterForm from './RegisterForm'

export const metadata = { title: 'Регистрация — EASTWIND LOGISTIC' }

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen flex items-center justify-center px-4 py-28"
        style={{ background: '#0f1729' }}
      >
        <Suspense>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
