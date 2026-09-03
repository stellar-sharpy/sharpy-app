"use client";
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * ErrorBoundary — class-component wrapper that catches render errors
 * in invoice cards and dashboard grids, showing a retry fallback.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  private handleRetry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="card p-6 text-center space-y-3" role="alert">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Something went wrong loading this section.
          </p>
          <p className="text-xs mono truncate" style={{ color: "var(--muted)" }}>
            {this.state.error.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
