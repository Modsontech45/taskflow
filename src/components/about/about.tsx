import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";

export function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">About ModTask</h1>
        <p className="text-gray-600 mt-2">
          ModTask is a modern task and project management application built to
          help teams stay organized and productive.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Our Mission</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              ModTask aims to simplify task management by providing intuitive
              boards, tasks, and real-time updates. Stay on top of your work and
              collaborate seamlessly with your team.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              About the Creator
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-2">
              This app was created by the brand <strong>Modlogiq</strong>,
              dedicated to building modern and intuitive web applications.
            </p>
            <p className="text-gray-700">
              Check out the creator's portfolio here:{" "}
              <a
                href="https://modson-dev.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                modson-dev.netlify.app
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call-to-action */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Explore ModTask to see how it can help you manage your projects
          efficiently.
        </p>
        <Link to="/boards">
          <Button variant="default">Go to Boards</Button>
        </Link>
      </div>
    </div>
  );
}
