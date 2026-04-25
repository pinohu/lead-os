// Local case studies for different cities and services
export interface CaseStudy {
  neighborhood: string;
  date: string;
  service: string;
  details: string;
  arrivalTime?: string;
  completionTime?: string;
  outcome: string;
}

export const getCaseStudiesForCity = (citySlug: string): CaseStudy[] => {
  const caseStudiesMap: Record<string, CaseStudy[]> = {
    erie: [
      {
        neighborhood: "Downtown Erie",
        date: "December 2024",
        service: "Real Estate Closing - Loan Signing",
        details: "Refinance closing for homeowner near Bayfront. Mobile notary service with complete loan document package including deed of trust, promissory note, and closing disclosure.",
        arrivalTime: "45 minutes",
        completionTime: "1.5 hours",
        outcome: "Documents scanned and returned to title company same day. Client saved $200 compared to title company fees."
      },
      {
        neighborhood: "Millcreek Township",
        date: "November 2024",
        service: "Apostille for International Documents",
        details: "Pennsylvania birth certificate apostille for Italian dual citizenship application. Rush processing through PA Department of State.",
        completionTime: "3 business days",
        outcome: "Apostille obtained and documents authenticated. Client's citizenship application accepted by Italian consulate."
      },
      {
        neighborhood: "West Erie - Peninsula Drive",
        date: "December 2024",
        service: "Power of Attorney",
        details: "Durable power of attorney for elderly client unable to travel. Mobile notary came to residence with healthcare POA forms.",
        arrivalTime: "30 minutes",
        completionTime: "45 minutes",
        outcome: "Legal documents properly executed and witnessed. Family has legal authority for healthcare decisions."
      },
      {
        neighborhood: "East Erie - Harborcreek",
        date: "October 2024",
        service: "I-9 Employment Verification",
        details: "Remote I-9 verification for new hire working from home. Video call with approved identification documents.",
        completionTime: "20 minutes",
        outcome: "I-9 Section 2 completed same day. Employer met federal compliance requirements for remote employee."
      }
    ],
    meadville: [
      {
        neighborhood: "Downtown Meadville",
        date: "December 2024",
        service: "Business Formation Documents",
        details: "LLC formation documents notarized for new Allegheny College area business. Operating agreement and Pennsylvania registration documents.",
        arrivalTime: "50 minutes",
        completionTime: "1 hour",
        outcome: "Business legally formed. Client filed with PA Department of State same week."
      },
      {
        neighborhood: "Saegertown Road",
        date: "November 2024",
        service: "Mobile Notary - Real Estate Deed",
        details: "Property deed transfer between family members. Mobile notary service at client's home with title transfer documents.",
        arrivalTime: "40 minutes",
        completionTime: "30 minutes",
        outcome: "Deed properly executed and recorded with Crawford County Recorder of Deeds."
      }
    ],
    warren: [
      {
        neighborhood: "Downtown Warren",
        date: "November 2024",
        service: "Remote Online Notary (RON) - Affidavit",
        details: "Evening RON session for court affidavit. Client connected via video from home after work hours.",
        completionTime: "15 minutes",
        outcome: "Affidavit notarized with electronic seal. Accepted by Warren County Court of Common Pleas."
      },
      {
        neighborhood: "West Warren",
        date: "October 2024",
        service: "Loan Signing - HELOC",
        details: "Home equity line of credit closing. Mobile notary service with complete HELOC package from local credit union.",
        arrivalTime: "35 minutes",
        completionTime: "1 hour",
        outcome: "Documents returned to lender same day. Funds disbursed within 48 hours."
      }
    ]
  };

  return caseStudiesMap[citySlug] || caseStudiesMap.erie.slice(0, 2);
};
