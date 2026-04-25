import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import SigningLayout from "@/components/SigningLayout";
import { 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  Building2,
  Users,
  Zap,
  ArrowRight
} from "lucide-react";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Message sent! We'll be in touch within 24 hours.");
  };

  if (isSuccess) {
    return (
      <SigningLayout>
        <div className="min-h-screen flex items-center justify-center p-4 pt-24 bg-slate-950">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-12 pb-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Message Received!
              </h1>
              <p className="text-slate-600 mb-6">
                Thank you for reaching out. A member of our team will contact you within 24 hours 
                to discuss how Notroom can support your signing operations.
              </p>
              <Button onClick={() => setIsSuccess(false)}>
                Send Another Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </SigningLayout>
    );
  }

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              Get Started
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Let's Talk About Your
              <span className="block text-cyan-400">Signing Operations</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Start with a free pilot. First 10 signings on us. 
              See why title companies are switching to Notroom.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Start Your Free Pilot</CardTitle>
                  <CardDescription>
                    Tell us about your signing volume and we'll customize a solution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" required />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Work Email *</Label>
                      <Input id="email" type="email" required />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" type="tel" required />
                    </div>

                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input id="company" required />
                    </div>

                    <div>
                      <Label htmlFor="companyType">Company Type *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your company type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title Company</SelectItem>
                          <SelectItem value="escrow">Escrow Company</SelectItem>
                          <SelectItem value="lender">Lender</SelectItem>
                          <SelectItem value="signing-service">Signing Service</SelectItem>
                          <SelectItem value="attorney">Attorney / Law Firm</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="volume">Monthly Signing Volume</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Estimated monthly signings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-25">1-25 signings</SelectItem>
                          <SelectItem value="26-100">26-100 signings</SelectItem>
                          <SelectItem value="101-500">101-500 signings</SelectItem>
                          <SelectItem value="500+">500+ signings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">Tell us about your needs</Label>
                      <Textarea 
                        id="message" 
                        placeholder="What challenges are you facing with your current signing operations?"
                        rows={4}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-6 text-lg font-bold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Start Free Pilot"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Other Ways to Reach Us
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Call Us</h3>
                        <a href="tel:814-480-0989" className="text-cyan-600 hover:underline text-lg">
                          (814) 480-0989
                        </a>
                        <p className="text-sm text-slate-500">Mon-Fri 8am-8pm ET</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Email Us</h3>
                        <a href="mailto:closings@notroom.com" className="text-cyan-600 hover:underline">
                          closings@notroom.com
                        </a>
                        <p className="text-sm text-slate-500">We respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Response Time</h3>
                        <p className="text-slate-600">Most inquiries answered same day</p>
                        <p className="text-sm text-slate-500">Pilot setup within 48 hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Start a Pilot */}
                <Card className="bg-gradient-to-br from-slate-50 to-cyan-50 border-0">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-slate-900 mb-4">
                      What's Included in Your Pilot
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">First 10 signings free</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">3-minute confirmation guarantee</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">Dedicated account manager</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">Zero-defect QA on every package</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">Full performance reporting</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
}

