export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FlowForge Control Plane",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "29",
      "priceCurrency": "USD",
      "priceSpecification": [
        {
          "@type": "UnitPriceSpecification",
          "price": "0",
          "priceCurrency": "USD",
          "name": "Starter Plan",
          "description": "Free tier for individual developers with 5 workflows",
          "billingDuration": "P1M",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "5",
            "unitText": "workflows"
          }
        },
        {
          "@type": "UnitPriceSpecification",
          "price": "29",
          "priceCurrency": "USD",
          "name": "Pro Plan",
          "description": "Unlimited n8n workflows with enterprise features",
          "billingDuration": "P1M",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "unlimited",
            "unitText": "workflows"
          }
        }
      ]
    },
    "description": "AI-powered control plane for self-hosted n8n instances. Build and manage workflows with natural language, secure BYOK encryption, enterprise audit trails, and one-click rollbacks.",
    "screenshot": "https://flowforge.app/dashboard-screenshot.png",
    "featureList": [
      "AI-powered n8n workflow builder with natural language",
      "BYOK encryption for data sovereignty",
      "12-month audit trail with JSONB snapshots",
      "One-click workflow rollback to any version",
      "n8n MCP and REST API integration",
      "Multi-tenant workspace management",
      "Real-time n8n execution monitoring",
      "SOC 2 compliant security",
      "Enterprise-grade encryption (AES-256-CBC)"
    ],
    "provider": {
      "@type": "Organization",
      "name": "FlowForge",
      "url": "https://flowforge.app",
      "description": "AI-powered control plane for self-hosted n8n workflow automation"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "softwareVersion": "1.0",
    "releaseNotes": "Initial release with AI-powered n8n workflow management"
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FlowForge",
    "url": "https://flowforge.app",
    "logo": "https://flowforge.app/logo.png",
    "description": "AI-powered control plane for self-hosted n8n workflow automation with enterprise security",
    "sameAs": [
      "https://twitter.com/flowforge",
      "https://github.com/flowforge",
      "https://linkedin.com/company/flowforge"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@flowforge.app",
      "availableLanguage": ["en"]
    }
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FlowForge",
    "url": "https://flowforge.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://flowforge.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}
