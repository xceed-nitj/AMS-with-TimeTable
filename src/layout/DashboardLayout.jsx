import Sidebar from '../components/sidebar'

export default function DashboardLayout() {
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white">
        <body class="h-full">
        ```
      */}
      <div>
        <Sidebar />
        <main className='py-10 bg-gray-100 lg:pl-72'>
          <div className='px-4 sm:px-6 lg:px-8'>{/* Your content */}</div>
        </main>
      </div>
    </>
  )
}
