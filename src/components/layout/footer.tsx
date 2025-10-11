import React from "react";
import { Link } from "react-router-dom";
import Icon from "../icon.png"; // Your logo

export function Footer() {
  return (
    <footer className="bg-gray-100 text-black mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Logo & About */}
        <div className="flex flex-col space-y-4">
          <img src={Icon} alt="App Logo" className="h-12 w-8" />
          <p className="text-gray-700 text-sm">
            ModTask is your trusted platform for managing tasks efficiently, keeping everything synchronized and organized.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/boards" className="hover:text-gray-900 transition-colors">
                Boards
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="hover:text-gray-900 transition-colors">
                Notifications
              </Link>
            </li>
            <li>
              <Link to="/subscription" className="hover:text-gray-900 transition-colors">
                Subscription
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-gray-900 transition-colors">
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-4">Contact Us</h3>
          <p className="text-gray-700 text-sm">Email: support@modlogiq.com</p>
          <p className="text-gray-700 text-sm">Phone: +123 456 7890</p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 mt-8 py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ModTask. All rights reserved.
      </div>
    </footer>
  );
}
