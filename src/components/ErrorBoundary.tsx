import { Component, type ReactNode } from 'react'

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Filet de sécurité global : sans lui, une exception dans le rendu (ex: bug
 * de canal realtime rencontré pendant les tests) démonte tout l'arbre React
 * et laisse un écran blanc sans aucun indice pour l'utilisateur.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('Erreur non interceptée :', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-page)] px-6 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            Oups, une erreur est survenue.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Réessaie de recharger la page. Si le problème persiste, réessaie plus tard.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="tap-scale rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
