'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, FileText, Lock, Newspaper, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'
import {
  hasResearchAccess,
  getResearchPapers,
  getBlogCrosslinks,
  type ResearchPaper,
  type BlogCrosslink,
} from '@/lib/research'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  return (
    <Card className="p-5 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            {paper.year}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{paper.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{paper.authors}</p>
        </div>
        {paper.pdf_url && (
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </a>
        )}
      </div>
      {paper.abstract && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{paper.abstract}</p>
      )}
      {paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {paper.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

function BlogCard({ post }: { post: BlogCrosslink }) {
  return (
    <Card className="p-4 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{formatDate(post.published_at)}</p>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{post.title}</h3>
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Open post"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {post.excerpt && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
      )}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

function ResearchHubContent() {
  const { user } = useAuth()
  const [access, setAccess] = useState<boolean | null>(null)
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [posts, setPosts] = useState<BlogCrosslink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    async function load() {
      if (!user?.uid) return
      setLoading(true)
      const allowed = await hasResearchAccess(user.uid)
      setAccess(allowed)
      if (allowed) {
        const [p, b] = await Promise.all([getResearchPapers(), getBlogCrosslinks()])
        setPapers(p)
        setPosts(b)
      }
      setLoading(false)
    }

    load()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading…
      </div>
    )
  }

  if (!access) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Lock className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Access by permission only</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          This section contains academic papers and research materials from the Mind Mechanism programme.
          Contact the team to request access.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Academic Papers */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest">
            Academic Papers
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({papers.length})</span>
        </div>
        {papers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No papers published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {papers.map((p) => <PaperCard key={p.id} paper={p} />)}
          </div>
        )}
      </section>

      {/* Blog Cross-Links from TOLP */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest">
              From The One-Legged Poet
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => <BlogCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

export default function ResearchPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Research Hub
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Academic papers, back-stories, and blog posts connected to the Mind Mechanism.
            </p>
          </header>
          <ResearchHubContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
