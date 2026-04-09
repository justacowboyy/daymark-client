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
import { ArrowRightIcon } from '@radix-ui/react-icons'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', description: 'Perfect for warming up', emoji: '🌱' },
  { id: 'medium', label: 'Medium', description: 'Test your knowledge', emoji: '⚡' },
  { id: 'hard', label: 'Hard', description: 'Challenge yourself', emoji: '🔥' },
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
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5 pt-16 md:pt-24 pb-12">
          <div className="max-w-5xl mx-auto px-4">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <Link href="/daily">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors">
                  <span className="text-sm font-medium">✨ Daily Quiz</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </div>
              </Link>
            </div>

            {/* Hero Title */}
            <div className="text-center mb-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-tight mb-4">
                Test Your Knowledge
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                Take quizzes on topics that matter to you. Challenge yourself and track your progress.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          {error && (
            <div className="mb-8 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block">
                  <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading categories…</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Categories Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Select Topics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((category) => {
                    const selected = selectedCategoryIds.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          selected
                            ? 'border-accent bg-accent text-white'
                            : 'border-border bg-card text-foreground hover:border-accent/50'
                        }`}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Choose Difficulty</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DIFFICULTIES.map((difficulty) => {
                    const active = selectedDifficulty === difficulty.id
                    return (
                      <button
                        key={difficulty.id}
                        onClick={() => setSelectedDifficulty(difficulty.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          active
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-card hover:border-accent/30'
                        }`}
                      >
                        <div className="text-2xl mb-2">{difficulty.emoji}</div>
                        <div className="font-bold text-lg">{difficulty.label}</div>
                        <p className="text-sm text-muted-foreground">{difficulty.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Options Section */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Number of Questions</h3>
                  <div className="flex gap-3">
                    {QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          questionCount === count
                            ? 'border-accent bg-accent text-white'
                            : 'border-border bg-card hover:border-accent/50'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Timer</h3>
                  <div className="flex gap-3">
                    {TIMER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTimerOption(option.id)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          timerOption === option.id
                            ? 'border-accent bg-accent text-white'
                            : 'border-border bg-card hover:border-accent/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="pt-8 border-t border-border">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {selectedCategoryIds.length === 0
                      ? 'Choose at least one topic and difficulty to begin'
                      : `Ready for a ${selectedDifficulty} quiz across ${selectedCategoryIds.length} topic${selectedCategoryIds.length > 1 ? 's' : ''}`}
                  </p>
                  <Button
                    onClick={handleStart}
                    disabled={!canStart || isGenerating}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isGenerating ? 'Preparing...' : 'Start Quiz'}
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground">
                      <Link href="/login" className="font-medium text-accent hover:underline">
                        Sign in
                      </Link>{' '}
                      to save your progress
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
