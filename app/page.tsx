'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useQuiz } from '@/lib/store'
import { getCategories, generateQuiz } from '@/lib/api'
import { Category, QuizSession } from '@/lib/types'
import Header from '@/components/header'
import LoadingOverlay from '@/components/loading-overlay'
import { Button } from '@/components/ui/button'

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

const QUESTION_COUNTS = [5, 10, 15]

const TIMER_OPTIONS = [
  { id: 'none', label: 'No timer' },
  { id: '5', label: '5 min' },
  { id: '10', label: '10 min' },
]

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { setSession } = useQuiz()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [timerOption, setTimerOption] = useState<string>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
        
        const categoriesParam = searchParams.get('categories')
        const difficultyParam = searchParams.get('difficulty')
        
        if (categoriesParam) {
          const ids = categoriesParam.split(',').map(Number)
          setSelectedCategoryIds(ids)
        }
        if (difficultyParam) {
          setSelectedDifficulty(difficultyParam)
        }
      } catch (err) {
        setError('Failed to load categories')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [searchParams])

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const canStart = selectedCategoryIds.length > 0 && selectedDifficulty !== null

  const handleStart = async () => {
    if (!canStart) {
      setError('Please select at least one category and a difficulty level')
      return
    }

    if (!isAuthenticated) {
      const params = new URLSearchParams()
      params.set('categories', selectedCategoryIds.join(','))
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty)
      params.set('count', String(questionCount))
      params.set('timer', timerOption)

      localStorage.setItem('pendingQuiz', JSON.stringify({
        categories: selectedCategoryIds,
        difficulty: selectedDifficulty,
        count: questionCount,
        timer: timerOption,
      }))

      router.push(`/login?${params.toString()}`)
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const quiz = await generateQuiz({
        category_ids: selectedCategoryIds,
        difficulty: selectedDifficulty!,
        number_of_questions: questionCount,
      })

      const session: QuizSession = {
        quiz,
        currentIndex: 0,
        answers: Array(quiz.questions.length).fill(null),
        score: 0,
        completed: false,
        timerOption: timerOption,
        timerSeconds: timerOption === 'none' ? 0 : parseInt(timerOption, 10) * 60,
      }

      setSession(session)
      router.push('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {isGenerating && <LoadingOverlay />}
      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Daymark</h1>
            {isAuthenticated && <div className="text-sm text-muted-foreground">Streak: 5</div>}
          </div>
        </div>

        {/* Main Container */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 border border-destructive bg-destructive/5 text-destructive text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-muted border-t-accent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Daily Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-border rounded p-4 text-center">
                  <div className="text-3xl font-bold">{isAuthenticated ? '12' : '-'}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Played</div>
                </div>
                <div className="border border-border rounded p-4 text-center">
                  <div className="text-3xl font-bold text-accent">{isAuthenticated ? '8' : '-'}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Streak</div>
                </div>
                <div className="border border-border rounded p-4 text-center">
                  <div className="text-3xl font-bold">{isAuthenticated ? '67%' : '-'}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Win %</div>
                </div>
                <div className="border border-border rounded p-4 text-center">
                  <div className="text-3xl font-bold">{isAuthenticated ? '240' : '-'}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Points</div>
                </div>
              </div>

              {/* Daily Quiz Highlight */}
              <div className="border-2 border-accent rounded p-6 bg-accent/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Daily Challenge</div>
                    <h2 className="text-2xl font-bold">Today&apos;s Quiz</h2>
                  </div>
                  <div className="text-xs font-semibold bg-accent text-accent-foreground px-3 py-1 rounded">New</div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Test your knowledge on today&apos;s top stories. You have one chance per day.</p>
                <Button className="w-full" onClick={handleStart} disabled={isGenerating}>
                  {isGenerating ? 'Loading...' : 'Play Daily Quiz'}
                </Button>
              </div>

              {/* Custom Quiz Builder */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Create Custom Quiz</h3>
                  
                  {/* Topics */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Topics</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => {
                        const selected = selectedCategoryIds.includes(category.id)
                        return (
                          <button
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            className={`px-3 py-2 text-sm font-medium border rounded transition-colors ${
                              selected
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border hover:border-foreground'
                            }`}
                          >
                            {category.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Difficulty</div>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map((diff) => {
                        const active = selectedDifficulty === diff.id
                        return (
                          <button
                            key={diff.id}
                            onClick={() => setSelectedDifficulty(diff.id)}
                            className={`px-3 py-2 text-sm font-medium border rounded transition-colors ${
                              active
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border hover:border-foreground'
                            }`}
                          >
                            {diff.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Count & Timer */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Questions</div>
                      <div className="flex gap-2">
                        {QUESTION_COUNTS.map((count) => (
                          <button
                            key={count}
                            onClick={() => setQuestionCount(count)}
                            className={`flex-1 px-3 py-2 text-sm font-medium border rounded transition-colors ${
                              questionCount === count
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border hover:border-foreground'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Timer</div>
                      <div className="flex gap-2">
                        {TIMER_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setTimerOption(option.id)}
                            className={`flex-1 px-3 py-2 text-sm font-medium border rounded transition-colors ${
                              timerOption === option.id
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border hover:border-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={handleStart}
                    disabled={!canStart || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? 'Preparing...' : 'Start Custom Quiz'}
                  </Button>
                </div>
              </div>

              {/* Sample Question Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sample Question</h3>
                <div className="border border-border rounded p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Question 1 of 5</div>
                    <h4 className="font-semibold">What was the major economic announcement made today?</h4>
                  </div>
                  <div className="space-y-2">
                    {['New interest rate decision', 'Stock market surge', 'Job report released', 'Tax policy change'].map((option, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-3 border border-border rounded hover:bg-secondary transition-colors text-sm"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="text-center py-8 border-t border-border">
                {!isAuthenticated && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in to track streaks, points, and compete with friends
                    </p>
                    <Link href="/login">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
