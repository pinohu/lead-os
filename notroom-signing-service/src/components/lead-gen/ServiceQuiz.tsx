import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

const questions: QuizQuestion[] = [
  {
    id: "document_type",
    question: "What type of document do you need help with?",
    options: [
      { value: "personal", label: "Personal documents (affidavits, power of attorney, etc.)" },
      { value: "real_estate", label: "Real estate or loan documents" },
      { value: "transaction_coordination", label: "Complex transaction coordination (multi-party deals)" },
      { value: "business", label: "Business formation or filing" },
      { value: "international", label: "International documents (apostille)" },
      { value: "employment", label: "Employment verification (I-9)" },
    ],
  },
  {
    id: "urgency",
    question: "How soon do you need this completed?",
    options: [
      { value: "today", label: "Today or ASAP" },
      { value: "week", label: "Within a week" },
      { value: "month", label: "Within a month" },
      { value: "planning", label: "Just planning ahead" },
    ],
  },
  {
    id: "preference",
    question: "How would you prefer to complete this?",
    options: [
      { value: "online", label: "100% online from anywhere" },
      { value: "mobile", label: "Have someone come to me" },
      { value: "office", label: "Meet in person at an office" },
      { value: "unsure", label: "Not sure, need guidance" },
    ],
  },
];

const ServiceQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    const questionId = questions[currentQuestion].id;
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      trackEvent('quiz_completed', {
        answers: JSON.stringify(answers),
        timestamp: Date.now(),
      });
    }
  };

  const handleBack = () => {
    setCurrentQuestion(currentQuestion - 1);
  };

  const getRecommendation = () => {
    const docType = answers.document_type;
    const preference = answers.preference;

    if (docType === "transaction_coordination") {
      return {
        service: "Transaction Coordination",
        price: "$299+",
        description: "Professional coordination for complex multi-party transactions. We manage documents, deadlines, and communication.",
        link: "/transaction-coordination",
      };
    }

    if (docType === "real_estate") {
      return {
        service: "Loan Signing Agent",
        price: "$175",
        description: "Professional loan signing service for your real estate transaction.",
        link: "/services/loan-signing-agent",
      };
    }

    if (docType === "business") {
      return {
        service: "Business Formation & Filing",
        price: "$149+",
        description: "Complete business setup and registered office services.",
        link: "/services/business-retainer",
      };
    }

    if (docType === "international") {
      return {
        service: "Apostille Services",
        price: "$245+",
        description: "Document authentication for international use.",
        link: "/services/apostille",
      };
    }

    if (docType === "employment") {
      return {
        service: "I-9 Verification",
        price: "$85+",
        description: "Authorized representative for employment verification.",
        link: "/services/i9-verification",
      };
    }

    if (preference === "online") {
      return {
        service: "Remote Online Notary",
        price: "$60",
        description: "Get notarized 100% online via secure video call.",
        link: "/services/remote-online-notary",
      };
    }

    return {
      service: "Mobile Notary Service",
      price: "$125+",
      description: "Professional notary comes to your location.",
      link: "/services/mobile-notary",
    };
  };

  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  if (showResults) {
    const recommendation = getRecommendation();
    
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="w-16 h-16 text-[hsl(var(--success-green))]" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Perfect! We Recommend:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-2">{recommendation.service}</h3>
            <p className="text-4xl font-bold text-[hsl(var(--action-cyan))] mb-4">
              {recommendation.price}
            </p>
            <p className="text-muted-foreground mb-6">{recommendation.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="amber" 
              size="lg" 
              className="flex-1"
              onClick={scrollToBooking}
            >
              Book {recommendation.service}
            </Button>
            <Button 
              variant="amberOutline" 
              size="lg" 
              className="flex-1"
              onClick={() => window.location.href = recommendation.link}
            >
              Learn More
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setShowResults(false);
              setCurrentQuestion(0);
              setAnswers({});
            }}
            className="w-full"
          >
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const currentAnswer = answers[currentQuestionData.id];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{currentQuestionData.question}</CardTitle>
        <CardDescription>
          Question {currentQuestion + 1} of {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={currentAnswer} onValueChange={handleAnswer}>
          {currentQuestionData.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between gap-4">
          {currentQuestion > 0 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            variant="amber"
            onClick={handleNext}
            disabled={!currentAnswer}
            className="ml-auto"
          >
            {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceQuiz;
