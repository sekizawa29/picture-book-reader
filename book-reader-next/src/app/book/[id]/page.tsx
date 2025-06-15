import BookReader from '@/components/BookReader'

interface BookPageProps {
  params: Promise<{ id: string }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  
  return <BookReader bookId={id} />
}

export async function generateStaticParams() {
  // 静的生成用のパラメータ
  return [
    { id: 'book1' },
    { id: 'book2' },
  ]
}