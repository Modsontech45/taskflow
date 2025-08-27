import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  Bell,
  CreditCard,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';

export function BlogPage() {
  const features = [
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Create, organize, and track tasks with ease. Set deadlines, add notes, and mark tasks as complete.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members to your boards with different permission levels. Work together seamlessly.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Set start and end dates for tasks. Get a clear overview of your upcoming deadlines.',
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Stay updated with instant notifications for board activities, task updates, and team changes.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security. Access your tasks from anywhere.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed and performance. No lag, no waiting - just pure productivity.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Project Manager',
      content: 'TaskFlow has revolutionized how our team manages projects. The collaboration features are outstanding.',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Startup Founder',
      content: 'Simple, elegant, and powerful. TaskFlow helps us stay organized without the complexity of other tools.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Freelance Designer',
      content: 'Perfect for managing client projects. The notification system keeps me on top of all my deadlines.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <CheckSquare className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">TaskFlow</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The modern task management platform that helps individuals and teams stay organized, 
              collaborate effectively, and achieve their goals with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            TaskFlow combines powerful features with an intuitive interface to help you manage tasks and collaborate with your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="p-4 bg-blue-100 rounded-2xl w-fit mx-auto mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How TaskFlow Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Your Board</h3>
              <p className="text-gray-600">
                Start by creating a board for your project. Give it a name and you're ready to go.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Tasks & Members</h3>
              <p className="text-gray-600">
                Create tasks with deadlines and notes. Invite team members to collaborate on your board.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Track Progress</h3>
              <p className="text-gray-600">
                Monitor task completion, receive notifications, and keep your projects on track.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What our users say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their productivity with TaskFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for you and your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">Basic Plan</h3>
                  <p className="text-gray-600 mt-2">Perfect for individual use</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$2</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Unlimited personal boards</span>
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Unlimited tasks</span>
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Basic notifications</span>
                  </li>
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Team Plan</h3>
                  <p className="text-gray-600 mt-2">Collaborate with your team</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$0.50</span>
                    <span className="text-gray-600">/member/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Member management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    <span>Advanced notifications</span>
                  </li>
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already transformed their workflow with TaskFlow.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <CheckSquare className="w-8 h-8 text-blue-400" />
                <span className="font-bold text-xl">TaskFlow</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The modern task management platform that helps you stay organized and productive.
              </p>
              <div className="flex items-center space-x-4">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Available worldwide</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TaskFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}