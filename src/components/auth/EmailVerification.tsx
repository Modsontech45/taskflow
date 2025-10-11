import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { CheckSquare, CheckCircle, XCircle, Mail } from "lucide-react";

type Status = "verifying" | "success" | "error";

export function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email.");
      return;
    }
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      // Corrected: GET request with query param
      await apiClient.verifyEmail(token);
      setStatus("success");
      setMessage(
        "Your email has been successfully verified! You can now log in."
      );
      showToast("success", "Email verified", "Your account is now active.");
    } catch (err: any) {
      console.error("Email verification error:", err);
      setStatus("error");
      setMessage(
        err.message ||
          "Failed to verify email. The link may be expired or invalid."
      );
      showToast(
        "error",
        "Verification failed",
        err.message || "Please try again or contact support."
      );
    }
  };

  const getIcon = () => {
    switch (status) {
      case "verifying":
        return <Mail className="w-16 h-16 text-blue-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "error":
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case "verifying":
        return "Verifying your email...";
      case "success":
        return "Email verified successfully!";
      case "error":
        return "Verification failed";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">ModTask</span>
          </div>

          <div className="mb-6">{getIcon()}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getTitle()}
          </h1>
          <p className="text-gray-600 mb-8">{message}</p>

          <div className="space-y-3">
            {status === "success" && (
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
                size="lg"
              >
                Continue to Login
              </Button>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/register")}
                  className="w-full"
                  size="lg"
                >
                  Try Registration Again
                </Button>
                <Link
                  to="/login"
                  className="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Already have a verified account? Sign in
                </Link>
              </div>
            )}

            {status === "verifying" && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
