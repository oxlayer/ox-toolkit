/**
 * Main App Component
 */

import { Button } from './components/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/card';

export function App() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{{PROJECT_NAME}}</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to your new OxLayer frontend app!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This template includes React 19, Vite, Tailwind CSS v4, and ESLint configured.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}