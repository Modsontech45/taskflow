import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">KaziFlow</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              From Swahili "kazi" (work) + "flow" - where your workflow becomes effortless. Share your progress and celebrate with the people you love.
            </p>
            <div className="flex items-center space-x-4">
              <Globe className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Available worldwide</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/boards" className="hover:text-white transition-colors">Boards</Link></li>
              <li><Link to="/subscription" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/notifications" className="hover:text-white transition-colors">Notifications</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
              <li><Link to="/subscription" className="hover:text-white transition-colors">Subscription</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} KaziFlow. All rights reserved. Made for people who love to share their wins.</p>
        </div>
      </div>
    </footer>
  );
}