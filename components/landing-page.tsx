"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Users,
  Zap,
  MessageSquare,
  GitBranch,
  Clock,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react";

export function LandingPage() {
  const { isSignedIn, user } = useUser();

  if (isSignedIn) {
    return null; // Don&apos;t show landing page if user is signed in
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CollabTask
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Get Started</Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-4 w-4 mr-2" />
            Real-time Collaboration
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Collaborate on Tasks
            <br />
            <span className="text-blue-600">In Real-Time</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build amazing projects with your team using our real-time
            collaborative task management platform. See changes instantly,
            communicate seamlessly, and stay productive together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Collaborating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need for team collaboration
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make your team more productive and
            connected
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                See changes instantly across all team members. No more
                refreshing or waiting for updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Assign tasks, track progress, and work together seamlessly with
                your entire team.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Live Comments</CardTitle>
              <CardDescription>
                Discuss tasks in real-time with threaded comments that update
                instantly for everyone.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Task Dependencies</CardTitle>
              <CardDescription>
                Create complex workflows with task dependencies and automatic
                status updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Status Tracking</CardTitle>
              <CardDescription>
                Track progress with customizable statuses: TODO, In Progress,
                Review, Done, and Blocked.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Enterprise-grade security with Clerk authentication and
                PostgreSQL database.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and see the power of real-time
              collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Create Your Account
              </h3>
              <p className="text-gray-600">
                Sign up with your email and start collaborating immediately. No
                complex setup required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Projects</h3>
              <p className="text-gray-600">
                Set up projects and invite your team members. Start organizing
                your work right away.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Collaborate in Real-Time
              </h3>
              <p className="text-gray-600">
                Create tasks, assign team members, and watch updates happen
                instantly across all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              <Globe className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Real-time</h3>
            <p className="text-gray-600">Instant updates across all devices</p>
          </div>

          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              <CheckCircle className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Reliable</h3>
            <p className="text-gray-600">
              99.9% uptime with WebSocket connections
            </p>
          </div>

          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              <Star className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Modern</h3>
            <p className="text-gray-600">
              Built with Next.js and latest technologies
            </p>
          </div>

          <div>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              <TrendingUp className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Scalable</h3>
            <p className="text-gray-600">Grows with your team and projects</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your team&apos;s productivity?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already collaborating in real-time with
            CollabTask
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">CollabTask</span>
            </div>
            <p className="text-gray-400">
              © 2024 CollabTask. Built with Next.js, WebSockets, and Clerk.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
