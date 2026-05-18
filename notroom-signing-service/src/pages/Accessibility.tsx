import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

const Accessibility = () => {
  return (
    <Layout>
      <SEO
        title="Accessibility Statement | Notroom - WCAG 2.2 AA Compliant"
        description="Notroom is committed to digital accessibility. Learn about our WCAG 2.2 AA compliance, accessibility features, and how to report accessibility issues."
        canonical="https://notroom.com/accessibility"
      />

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Accessibility Statement</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Last Updated: January 27, 2025
            </p>

            <div className="space-y-8">
              {/* Commitment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    Our Commitment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Notroom is committed to ensuring digital accessibility for people with disabilities. 
                    We are continually improving the user experience for everyone and applying the relevant 
                    accessibility standards to achieve these goals.
                  </p>
                  <p>
                    We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.2</strong> 
                    at the <strong>AA level</strong>, as published by the World Wide Web Consortium (W3C).
                  </p>
                </CardContent>
              </Card>

              {/* Standards */}
              <Card>
                <CardHeader>
                  <CardTitle>Conformance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and 
                    developers to improve accessibility for people with disabilities. It defines three levels 
                    of conformance: Level A, Level AA, and Level AAA.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">Notroom is partially conformant with WCAG 2.2 level AA.</p>
                    <p className="text-sm text-muted-foreground">
                      Partially conformant means that some parts of the content do not fully conform to the 
                      accessibility standard. We are actively working to improve accessibility across all pages.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Keyboard Navigation:</strong> All interactive elements can be accessed using only a keyboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Screen Reader Support:</strong> Proper ARIA labels and semantic HTML throughout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Color Contrast:</strong> All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Focus Indicators:</strong> Clear visual focus indicators for keyboard navigation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Form Labels:</strong> All form fields have associated labels and error messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Alt Text:</strong> Images include descriptive alt text</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Responsive Design:</strong> Site is fully functional on mobile devices and assistive technologies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Skip Links:</strong> Skip to main content links for screen reader users</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Known Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    Known Issues & Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Despite our best efforts to ensure accessibility, there may be some limitations. 
                    Below are known issues that we are working to address:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Some third-party integrations may not fully conform to WCAG standards</li>
                    <li>Older content may not meet current accessibility standards (we are updating these pages)</li>
                    <li>Video content may lack captions (we are working to add captions to all videos)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    We are committed to addressing these issues and improving accessibility across the site.
                  </p>
                </CardContent>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback & Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We welcome your feedback on the accessibility of Notroom. If you encounter accessibility 
                    barriers, please let us know:
                  </p>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:accessibility@notroom.com" className="text-primary hover:underline">accessibility@notroom.com</a></p>
                    <p><strong>Phone:</strong> <a href="tel:814-480-0989" className="text-primary hover:underline">(814) 480-0989</a></p>
                    <p><strong>Address:</strong> Erie, Pennsylvania</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We aim to respond to accessibility feedback within 5 business days.
                  </p>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>
                      <a 
                        href="https://www.w3.org/WAI/WCAG21/quickref/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        WCAG 2.2 Quick Reference
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.w3.org/WAI/fundamentals/accessibility-intro/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Introduction to Web Accessibility
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.ada.gov/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Americans with Disabilities Act (ADA)
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Updates */}
              <Card>
                <CardHeader>
                  <CardTitle>Ongoing Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    We regularly review and update our website to improve accessibility. This statement 
                    will be updated as we make improvements and address any accessibility issues.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong>Last Accessibility Audit:</strong> January 27, 2025<br />
                    <strong>Next Scheduled Review:</strong> April 27, 2025
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Accessibility;

