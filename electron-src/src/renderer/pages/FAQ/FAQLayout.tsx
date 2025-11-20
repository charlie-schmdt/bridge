import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  HelpCircle,
  MessageCircleQuestionMark,
} from "lucide-react";
import Header from "../../components/Header";
import Banner from "../../components/Banner";
import { Button } from "@/renderer/components/ui/Button";
 import { useNotification } from "@/hooks/useNotification"; // at the top of file
import NotificationBanner from "@/renderer/components/NotificationBanner";
import { Endpoints } from "@/renderer/utils/endpoints";

// Sample FAQ Data
const faqData = [
  {
    id: 1,
    question: "What is this desktop application for?",
    answer:
      "This application is designed to manage and organize all your video conferencing workspaces and associated documents in one centralized place, perfect for hybrid teams.",
  },
  {
    id: 2,
    question: "How do I create a new workspace?",
    answer:
      "You can create a new workspace by clicking the 'Create Workspace' card on the home dashboard and following the prompts to name it and invite members.",
  },
  {
    id: 3,
    question: "How can I view my profile?",
    answer:
      "You can look at your profile by clicking on your profile icon in the top right corner and selecting 'Profile' from the dropdown menu.",
  },
  {
    id: 4,
    question: "How do I update my profile settings?",
    answer:
      "Click on your profile icon (top right corner), select 'Settings' from the dropdown menu, and navigate to the 'Profile' tab to make changes.",
  },
  {
    id: 5,
    question: "How can I test my video and audio?",
    answer:
      "Once logged in, you're able to access the Test Room from the header of the dashboard.",
  },
];

const FAQLayout = () => {
   const { notification, showNotification } = useNotification(); // inside the exported component function

  // State for search filtering
  const [searchTerm, setSearchTerm] = useState("");
  // State for controlling the open/closed state of the accordion items (holds the ID of the open item)
  const [openId, setOpenId] = useState(null);

  // Filter the FAQs based on the search term
  const filteredFaqs = useMemo(() => {
    if (!searchTerm) {
      return faqData;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return faqData.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerCaseSearch) ||
        item.answer.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  // Toggle the accordion item
  const toggleFAQ = (id) => {
    setOpenId((currentId) => (currentId === id ? null : id));
  };

  const handleQuestionSubmission = async (email: string, question: string) => {
    try {
      const token = localStorage.getItem("bridge_token");

      const res = await fetch(`${Endpoints.FAQ}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, question }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification("Your question has been submitted and will be answered soon!", "success"); // type can be "success", "error", "warning", "info", "created"

      } else {
        console.error("Failed to send question.");
        showNotification("Failed to submit your question. Please try again later.", "error"); // type can be "success", "error", "warning", "info", "created"

      }
    } catch (error) {
      console.error("Error submitting question:", error);
      showNotification("An error occurred while submitting your question.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">
      <Header />
      <Banner title="Ask Away!" />
      {notification && (
          <div className="fixed top-20 right-4 z-[9999]">
          <NotificationBanner
              message={notification.message}
              type={notification.type as "success" | "error" | "warning" | "info" | "created"}
          />
          </div>
      )}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
        {/* Header and Title */}
        <div className="flex items-center space-x-3 mb-8 border-b pb-4">
          <HelpCircle className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900">
            Frequently Asked Questions
          </h1>
        </div>

        {/* Search/Filter Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by keyword (e.g., 'security', 'workspace', 'filter')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              aria-label="Search FAQs"
            />
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border border-gray-200 rounded-xl transition-all duration-300 ${
                    isOpen ? "shadow-md bg-blue-50" : "hover:border-blue-300"
                  }`}
                >
                  <h3 className="text-lg font-medium">
                    <button
                      id={`faq-question-${item.id}`}
                      className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl cursor-pointer"
                      onClick={() => toggleFAQ(item.id)}
                      // --- ARIA FIX: Correctly set aria-expanded to a boolean value ---
                      //   aria-expanded={isOpen}
                      //   aria-controls={`faq-answer-${item.id}`}
                    >
                      <span
                        className={`${
                          isOpen ? "text-blue-700" : "text-gray-800"
                        }`}
                      >
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-blue-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={`faq-answer-${item.id}`}
                      role="region" // Indicates this is a collapsible region
                      aria-labelledby={`faq-question-${item.id}`}
                      className="px-4 pb-4 pr-12 text-gray-700 transition-all duration-300 ease-in-out"
                    >
                      <p className="border-t border-blue-200 pt-3 text-sm">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl font-medium">
                No results found for "{searchTerm}"
              </p>
              <p className="mt-2">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
        {/* Submit a question */}
        <div>
          {/* Header and Title */}
          <div className="flex items-center space-x-3 mb-8 border-b pb-4 mt-12">
            <MessageCircleQuestionMark className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">
              Submit a Question
            </h1>
          </div>

          <p className="text-gray-700 mb-4">
            Can't find the answer you're looking for? Submit your question!
          </p>

          {/* Form */}
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const email = form.get("email");
              const question = form.get("question");

              console.log("📩 Submitted:", { email, question });


              handleQuestionSubmission(email as string, question as string);

              e.currentTarget.reset();
              
            }}
            className="space-y-4 max-w-lg"
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Question
              </label>
              <textarea
                name="question"
                rows={4}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Write your question here..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FAQLayout;
