# HandyWriterz Documentation

## SEO Implementation

### Overview

HandyWriterz implements a comprehensive SEO strategy using `react-helmet-async` to manage document head metadata. This implementation ensures that all pages have proper metadata for search engines and social media platforms.

### SEO Component

The core of our SEO implementation is the reusable `SEO` component located at `src/components/SEO.tsx`. This component provides a standardized way to set metadata across the application.

```tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'HandyWriterz - Your Writing Assistant',
  description = 'HandyWriterz helps you create, edit, and manage your writing projects with ease.',
  keywords = 'writing, assistant, content creation, editing, AI writing',
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex = false,
}) => {
  // Component implementation
}
```

### Usage

To use the SEO component in a page or component:

```tsx
import SEO from '@/components/SEO';

const MyPage = () => {
  return (
    <>
      <SEO 
        title="Page Title | HandyWriterz"
        description="Detailed page description for search engines"
        keywords="relevant, keywords, for, this, page"
        ogImage="/path/to/custom-image.jpg"
      />
      {/* Page content */}
    </>
  );
};
```

### Default Open Graph Image

The application includes a default Open Graph image for social media sharing. This image is generated using the script at `scripts/generate-og-image.js` and saved to `public/images/og-default.jpg`.

To generate or update the default Open Graph image:

```bash
npm run generate-og
# or
pnpm generate-og
```

### SEO Best Practices Implemented

1. **Dynamic Metadata**: Each page has unique, relevant metadata.
2. **Open Graph Protocol**: Proper implementation for Facebook and other social media platforms.
3. **Twitter Cards**: Twitter-specific metadata for rich media sharing.
4. **Canonical URLs**: Prevents duplicate content issues.
5. **Responsive Design**: Mobile-friendly pages for better search rankings.
6. **Semantic HTML**: Proper use of HTML5 semantic elements.

### SEO for Blog Posts

Blog posts have enhanced SEO with:

- **Article-specific metadata**: Title, description, and keywords tailored to the content.
- **Rich media sharing**: Featured images used for social media cards.
- **Structured data**: JSON-LD implementation for rich search results.
- **Canonical URLs**: Proper URL management to prevent duplicate content.

### SEO for Service Pages

Service pages include:

- **Service-specific metadata**: Title, description, and keywords related to the service.
- **Custom Open Graph images**: Service-specific images for social sharing when available.
- **Breadcrumb navigation**: Helps search engines understand site structure.

## Implementation in Key Components

### BlogPostDetail Component

The `BlogPostDetail` component uses the SEO component to set metadata specific to each blog post:

```tsx
<SEO
  title={`${post.meta_title || post.title} | HandyWriterz`}
  description={post.meta_description || post.excerpt}
  keywords={post.tags?.join(', ')}
  ogImage={post.featured_image}
  ogUrl={window.location.href}
  ogType="article"
  twitterCard="summary_large_image"
  canonicalUrl={window.location.href}
/>
```

### ServiceBlogTemplate Component

The `ServiceBlogTemplate` component sets service-specific metadata:

```tsx
<SEO
  title={metaTitle}
  description={metaDescription}
  keywords={`${serviceType?.replace(/-/g, ' ')}, academic services, handywriterz, academic writing`}
  ogImage={servicePage?.featured_image}
  ogUrl={window.location.href}
  ogType="website"
  twitterCard="summary_large_image"
  canonicalUrl={window.location.href}
/>
```

## Future SEO Enhancements

Planned enhancements to the SEO implementation include:

1. **Structured Data**: Implement JSON-LD for rich search results.
2. **Sitemap Generation**: Automated sitemap generation for search engines.
3. **Performance Optimization**: Improve page load times for better rankings.
4. **Analytics Integration**: Track SEO performance metrics.
5. **AMP Support**: Accelerated Mobile Pages for faster mobile loading. 