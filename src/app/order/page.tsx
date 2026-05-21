import Header from '@/components/layout/Header'
import OrderForm from '@/components/forms/OrderForm'

export default function OrderPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Оформить заявку</h1>
          <p className="mt-2 text-gray-500">Заполните форму — мы свяжемся с вами и уточним детали</p>
        </div>
        <OrderForm />
      </main>
    </>
  )
}
