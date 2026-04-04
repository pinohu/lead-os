import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  schema?: object;
}

const SEO = ({ title, description, keywords, canonical, schema }: SEOProps): JSX.Element | null => {
  useEffect(() => {
    // Update title
    document.title = `${title} | Notroom - Erie, PA`;

    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

    // Add canonical link
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement("link");
        linkCanonical.setAttribute("rel", "canonical");
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute("href", canonical);
    }

    // Add schema markup
    if (schema) {
      const schemaScript = document.createElement("script");
      schemaScript.type = "application/ld+json";
      schemaScript.text = JSON.stringify(schema);
      schemaScript.id = "page-schema";
      document.head.appendChild(schemaScript);

      return () => {
        const existingSchema = document.getElementById("page-schema");
        if (existingSchema) {
          existingSchema.remove();
        }
      };
    }
  }, [title, description, keywords, canonical, schema]);

  return null;
};

export default SEO;
