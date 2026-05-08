'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MyRecordView } from '@/components/record/MyRecordView'

export default function RecordPage() {
  return (
    <ProtectedRoute>
      <div className="ml-16 h-full overflow-y-auto bg-transparent">
        <div className="max-w-3xl px-4 py-8 pb-16 sm:px-6">
          <MyRecordView />
        </div>
      </div>
    </ProtectedRoute>
  )
}
