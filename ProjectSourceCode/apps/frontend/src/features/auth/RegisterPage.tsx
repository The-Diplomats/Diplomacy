import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { Themed } from '../../components/Themed';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';

export function RegisterPage() {
  return (
    <Themed className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <div
        className="relative flex items-center justify-center p-6"
        style={{
          aspectRatio: '2120 / 1427',
          width: 'min(100vw, calc(100vh * 2120 / 1427))',
          height: 'min(100vh, calc(100vw * 1427 / 2120))',
        }}
      >
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" aria-hidden />
        <Card
          size="sm"
          className="pointer-events-auto relative w-96 gap-5 bg-card/95 shadow-xl backdrop-blur-sm"
        >
          <CardHeader className="items-center space-y-1 text-center">
            <h1
              className="text-5xl text-foreground"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Diplomacy
            </h1>
            <p className="text-sm text-muted-foreground">Create an account to play</p>
          </CardHeader>

          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" type="text" placeholder="Rez Haleem" autoComplete="name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@diplomacy.gg"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full">
                Create account
                <ChevronRight />
              </Button>
            </form>

            <div className="relative py-4">
              <Separator />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground uppercase">or</span>
              </span>
            </div>

            <Button type="button" variant="outline" className="w-full">
              Continue with Microsoft
            </Button>
          </CardContent>

          <div className="pb-5 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </Themed>
  );
}
