import { create } from "zustand"

type ProjectResult = { id: string; name: string; slug: string; ingestionKey: string }

type WizardState = {
  step: 1 | 2 | 3 | 4
  githubConnected: boolean
  githubPromptDismissed: boolean
  project: ProjectResult | null
  goToStep: (step: 1 | 2 | 3 | 4) => void
  setGithubConnected: () => void
  dismissGithubPrompt: () => void
  setProject: (project: ProjectResult) => void
}

export const useWizardStore = create<WizardState>((set) => ({
  step: 1,
  githubConnected: false,
  githubPromptDismissed: false,
  project: null,
  goToStep: (step) => set({ step }),
  setGithubConnected: () => set({ githubConnected: true }),
  dismissGithubPrompt: () => set({ githubPromptDismissed: true }),
  setProject: (project) => set({ project }),
}))
