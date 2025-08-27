import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Star,
  Play,
  Heart,
  Target,
  Share2,
  Sparkles
} from 'lucide-react';

export function LandingPage() {
  const features = [
    {
      icon: CheckSquare,
      title: 'Create Boards',
      description: 'Organize tasks by project, goal, or day. Keep everything structured and clear.',
    },
    {
      icon: Target,
      title: 'Tick as You Go',
      description: 'Enjoy the satisfaction of checking tasks off. Feel the progress with every click.',
    },
    {
      icon: Heart,
      title: 'Share with Loved Ones',
      description: 'Invite family & friends to cheer you on. Make productivity a shared journey.',
    },
    {
      icon: BarChart3,
      title: 'Track Your Progress',
      description: 'See how far you\'ve come every day. Celebrate your wins, big and small.',
    },
  ];

  const testimonials = [
    {
      quote: "It keeps me focused every day and sharing progress with my partner makes it fun.",
      author: "Sarah M.",
      role: "Working Mom",
    },
    {
      quote: "Finally, a productivity app that feels personal, not corporate.",
      author: "Mike R.",
      role: "Freelancer",
    },
    {
      quote: "I love seeing my family celebrate my daily wins. It's so motivating!",
      author: "Emma L.",
      role: "Student",
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Create a Board',
      description: 'Add tasks for your day or project. Organize them however makes sense to you.',
      icon: CheckSquare,
    },
    {
      number: 2,
      title: 'Work Through Them',
      description: 'Focus and mark tasks done. Feel the satisfaction with every completed task.',
      icon: Target,
    },
    {
      number: 3,
      title: 'Share & Celebrate',
      description: 'Let your loved ones see your progress. Turn productivity into a celebration.',
      icon: Share2,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">TaskNest</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Organize Your Day,<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Share the Wins
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create boards, add tasks, and celebrate progress with the people you love. 
              A cozy place where your daily tasks live and grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2">
                <Play className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to stay organized
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TaskNest combines powerful organization with the joy of sharing your progress with loved ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps and transform how you approach your daily tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                      {step.number}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* App Preview Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              See TaskNest in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A beautiful, intuitive interface that makes task management feel effortless and enjoyable.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 md:p-12">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="flex-1 bg-gray-100 rounded-lg h-8 flex items-center px-4">
                  <span className="text-sm text-gray-500">tasknest.app</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckSquare className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-900">Morning workout</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    <span className="text-gray-700">Finish project proposal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white"></div>
                    </div>
                    <Share2 className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    <span className="text-gray-700">Call mom</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-pink-500 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
                    </div>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why People Love TaskNest
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands who have transformed their daily productivity into a shared celebration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Make Every Day Count
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Start organizing your tasks and sharing your wins today. Your loved ones are waiting to celebrate with you.
          </p>
          <Link to="/login">
            <Button size="lg" className="px-12 py-4 text-lg bg-white text-purple-600 hover:bg-gray-100 shadow-xl">
              Get Started Today – It's Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">TaskNest</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                A cozy place where your daily tasks live and grow. Share your progress and celebrate with the people you love.
              </p>
              <div className="flex items-center space-x-4">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-gray-400">Made with love for productivity</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TaskNest. All rights reserved. Made for people who love to share their wins.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };