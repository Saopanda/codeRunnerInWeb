import { createFileRoute } from '@tanstack/react-router'
import { CodeRunner } from '@/features/code-runner'

export const Route = createFileRoute('/')({
  component: CodeRunner,
})
